import { KnowledgeNode } from './types';
import {
  loadKnowledgeBase,
  saveKnowledgeBase,
  fetchServerKnowledgeBase,
  addChildNode,
  addSiblingNode,
  deleteNode,
  updateNode,
  toggleCollapse,
  setAllCollapsed,
  hasAnyCollapsedBranch,
  countTotalNodes,
  getMaxDepth,
  findNode
} from './storage';
import { GraphRenderer } from './graph-renderer';
import { Sidebar } from './sidebar';
import { Tooltip } from './tooltip';
import { SearchController } from './search';
import { DataModal } from './modal';
import { SettingsModal } from './settings-modal';
import { HistoryManager } from './history';

class App {
  private rootData: KnowledgeNode;
  private renderer!: GraphRenderer;
  private sidebar!: Sidebar;
  private tooltip!: Tooltip;
  private search!: SearchController;
  private modal!: DataModal;
  private settingsModal!: SettingsModal;
  private history!: HistoryManager;
  private selectedNodeId: string | null = null;

  constructor() {
    this.rootData = loadKnowledgeBase();
    this.init();
    this.syncFromDisk();
  }

  private async syncFromDisk(): Promise<void> {
    const diskData = await fetchServerKnowledgeBase();
    if (diskData) {
      this.rootData = diskData;
      this.history.clear();
      this.renderer.setData(this.rootData, false);
      this.search.updateData(this.rootData);
      this.modal.setData(this.rootData);
      this.updateStats();
      this.updateExpandCollapseUI();
    }
  }

  private init(): void {
    // 1. Tooltip
    this.tooltip = new Tooltip();

    // 2. Graph Renderer
    this.renderer = new GraphRenderer('graph-svg', {
      onNodeClick: (nodeId: string) => {
        this.selectNode(nodeId, false, false);
      },
      onNodeDoubleClick: (nodeId: string) => {
        this.selectNode(nodeId, false, true);
      },
      onCanvasClick: () => {
        this.history.commitTextEdit();
        if (this.sidebar.isOpen()) {
          this.sidebar.close();
        }
      },
      onNodeHover: (node: KnowledgeNode, clientX: number, clientY: number) => {
        this.tooltip.show(node.name, node.description || '', clientX, clientY);
      },
      onNodeHoverMove: (clientX: number, clientY: number) => {
        this.tooltip.updatePosition(clientX, clientY);
      },
      onNodeHoverEnd: () => {
        this.tooltip.hide();
      },
      onAddChildQuick: (parentId: string) => {
        this.addChild(parentId);
      },
      onAddSiblingQuick: (nodeId: string) => {
        this.addSibling(nodeId);
      },
      onToggleCollapse: (nodeId: string) => {
        this.toggleBranch(nodeId);
      }
    });

    // 3. History Manager (Lightweight memory-bounded undo/redo)
    this.history = new HistoryManager(25, (canUndo, canRedo) => {
      this.updateUndoRedoUI(canUndo, canRedo);
    });

    // 4. Right Sidebar Detail Panel
    this.sidebar = new Sidebar('right-sidebar', {
      onUpdate: (id, updates) => {
        this.history.recordTextEdit(this.rootData, this.selectedNodeId);
        this.rootData = updateNode(this.rootData, id, updates);
        saveKnowledgeBase(this.rootData);
        this.renderer.setData(this.rootData, true);
        this.search.updateData(this.rootData);
        this.updateStats();
      },
      onAddChild: parentId => {
        this.addChild(parentId);
      },
      onAddSibling: id => {
        this.addSibling(id);
      },
      onDelete: id => {
        this.deleteNodeItem(id);
      },
      onSelectNode: id => {
        this.selectNode(id, false);
      },
      onClose: () => {
        this.history.commitTextEdit();
        this.selectedNodeId = null;
        this.renderer.setSelectedNode(null);
      }
    });

    // 5. Search
    this.search = new SearchController('search-input', 'search-dropdown', (nodeId: string) => {
      this.selectNode(nodeId, true);
    });
    this.search.updateData(this.rootData);

    // 6. Modal
    this.modal = new DataModal(
      'data-modal',
      {
        onLoadData: newData => {
          this.history.push(this.rootData, this.selectedNodeId);
          this.rootData = newData;
          saveKnowledgeBase(this.rootData);
          this.renderer.setData(this.rootData, false);
          this.sidebar.close();
          this.search.updateData(this.rootData);
          this.modal.setData(this.rootData);
          this.updateStats();
          this.updateExpandCollapseUI();
        }
      },
      this.rootData
    );

    // 7. Settings Modal (Theme presets & Font packs)
    this.settingsModal = new SettingsModal('settings-modal', {
      onThemeChange: () => {
        // Theme variables update instantly via data-theme attribute
      },
      onFontChange: () => {
        // Font change affects text metrics, re-render graph nodes
        this.renderer.render();
      }
    });

    // Update undo/redo button states initially
    this.updateUndoRedoUI(false, false);

    // Initial render
    this.renderer.setData(this.rootData, false);
    this.updateStats();
    this.updateExpandCollapseUI();

    // Bind UI actions
    this.bindNavbarEvents();
    this.bindKeyboardShortcuts();

    window.addEventListener('termgraph:saved-to-disk', ((e: CustomEvent) => {
      const pill = document.getElementById('tree-status-pill');
      if (pill && e.detail?.ok) {
        pill.classList.add('saved-flash');
        setTimeout(() => pill.classList.remove('saved-flash'), 600);
      }
    }) as EventListener);

    // Close detail panel when clicking outside of it
    document.addEventListener('click', (e: MouseEvent) => {
      if (!this.sidebar.isOpen()) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Do nothing if clicking inside the sidebar
      if (target.closest('#right-sidebar')) return;

      // Do nothing if clicking a node (it handles selecting/opening)
      if (target.closest('.graph-node')) return;

      // Do nothing if clicking inside modals, search, settings, or canvas controls
      if (
        target.closest('#data-modal') ||
        target.closest('#settings-modal') ||
        target.closest('#search-dropdown') ||
        target.closest('.search-container') ||
        target.closest('#nav-btn-settings') ||
        target.closest('.canvas-controls')
      ) return;

      // Do nothing on SVG canvas clicks or pan-releases (GraphRenderer handles canvas clicks with pan detection)
      if (target.closest('#graph-svg')) return;

      // Close the sidebar panel and commit any pending text edits
      this.history.commitTextEdit();
      this.sidebar.close();
    });
  }

  private selectNode(nodeId: string, centerView = false, focusInput = false): void {
    this.selectedNodeId = nodeId;
    this.renderer.setSelectedNode(nodeId);
    this.sidebar.open(this.rootData, nodeId);
    this.tooltip.hide();

    if (centerView) {
      this.renderer.centerNode(nodeId);
    }

    if (focusInput) {
      setTimeout(() => this.sidebar.focusNameInput(), 50);
    }
  }

  private undo(): void {
    const state = this.history.undo(this.rootData, this.selectedNodeId);
    if (!state) return;
    this.rootData = state.data;
    saveKnowledgeBase(this.rootData);
    this.renderer.setData(this.rootData, true);
    this.search.updateData(this.rootData);
    this.modal.setData(this.rootData);
    this.updateStats();
    this.updateExpandCollapseUI();

    if (state.selectedNodeId && findNode(this.rootData, state.selectedNodeId).node) {
      this.selectNode(state.selectedNodeId, false, false);
    } else {
      this.selectedNodeId = null;
      this.renderer.setSelectedNode(null);
      this.sidebar.close();
    }
  }

  private redo(): void {
    const state = this.history.redo(this.rootData, this.selectedNodeId);
    if (!state) return;
    this.rootData = state.data;
    saveKnowledgeBase(this.rootData);
    this.renderer.setData(this.rootData, true);
    this.search.updateData(this.rootData);
    this.modal.setData(this.rootData);
    this.updateStats();
    this.updateExpandCollapseUI();

    if (state.selectedNodeId && findNode(this.rootData, state.selectedNodeId).node) {
      this.selectNode(state.selectedNodeId, false, false);
    } else {
      this.selectedNodeId = null;
      this.renderer.setSelectedNode(null);
      this.sidebar.close();
    }
  }

  private updateUndoRedoUI(canUndo: boolean, canRedo: boolean): void {
    const undoBtn = document.getElementById('nav-btn-undo') as HTMLButtonElement | null;
    const redoBtn = document.getElementById('nav-btn-redo') as HTMLButtonElement | null;
    if (undoBtn) undoBtn.disabled = !canUndo;
    if (redoBtn) redoBtn.disabled = !canRedo;
  }

  private updateExpandCollapseUI(): void {
    const btn = document.getElementById('nav-btn-toggle-expand');
    if (!btn) return;
    const anyCollapsed = hasAnyCollapsedBranch(this.rootData);
    btn.textContent = anyCollapsed ? 'Expand All' : 'Collapse All';
    btn.title = anyCollapsed ? 'Expand All Branches' : 'Collapse All Branches';
  }

  private toggleExpandCollapseAll(): void {
    this.history.push(this.rootData, this.selectedNodeId);
    const anyCollapsed = hasAnyCollapsedBranch(this.rootData);
    this.rootData = setAllCollapsed(this.rootData, !anyCollapsed);
    saveKnowledgeBase(this.rootData);
    this.renderer.setData(this.rootData, true);
    this.sidebar.refresh(this.rootData);
    this.updateExpandCollapseUI();
  }

  private addChild(parentId: string): void {
    this.history.push(this.rootData, this.selectedNodeId);
    const { root, newNode } = addChildNode(this.rootData, parentId);
    this.rootData = root;
    saveKnowledgeBase(this.rootData);
    this.renderer.setData(this.rootData, true);
    this.search.updateData(this.rootData);
    this.modal.setData(this.rootData);
    this.updateStats();
    this.updateExpandCollapseUI();

    // Select and focus the newly created sub-node without shifting the view
    this.selectNode(newNode.id, false, true);
  }

  private addSibling(targetId: string): void {
    this.history.push(this.rootData, this.selectedNodeId);
    const { root, newNode } = addSiblingNode(this.rootData, targetId);
    if (!newNode) return;

    this.rootData = root;
    saveKnowledgeBase(this.rootData);
    this.renderer.setData(this.rootData, true);
    this.search.updateData(this.rootData);
    this.modal.setData(this.rootData);
    this.updateStats();
    this.updateExpandCollapseUI();

    // Select and focus the newly created sibling node without shifting the view
    this.selectNode(newNode.id, false, true);
  }

  private deleteNodeItem(targetId: string): void {
    this.history.push(this.rootData, this.selectedNodeId);
    // Find parent to navigate to after deletion
    const { parent } = findNode(this.rootData, targetId);

    const { root, success } = deleteNode(this.rootData, targetId);
    if (!success) {
      alert('Cannot delete the root knowledge base node.');
      return;
    }

    this.rootData = root;
    saveKnowledgeBase(this.rootData);
    this.renderer.setData(this.rootData, true);
    this.search.updateData(this.rootData);
    this.modal.setData(this.rootData);
    this.updateStats();
    this.updateExpandCollapseUI();

    if (parent) {
      this.selectNode(parent.id, false);
    } else {
      this.sidebar.close();
    }
  }

  private toggleBranch(nodeId: string): void {
    this.history.push(this.rootData, this.selectedNodeId);
    this.rootData = toggleCollapse(this.rootData, nodeId);
    saveKnowledgeBase(this.rootData);
    this.renderer.setData(this.rootData, true);
    this.sidebar.refresh(this.rootData);
    this.updateExpandCollapseUI();
  }

  private updateStats(): void {
    const count = countTotalNodes(this.rootData);
    const depth = getMaxDepth(this.rootData);
    const pill = document.getElementById('tree-status-pill');
    if (pill) {
      pill.textContent = `${count} Terms • ${depth} Levels`;
      pill.title = 'Permanently saved on disk: data/knowledge-base.json';
    }
  }

  private bindNavbarEvents(): void {
    document.getElementById('nav-btn-undo')?.addEventListener('click', () => this.undo());
    document.getElementById('nav-btn-redo')?.addEventListener('click', () => this.redo());

    document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.renderer.zoomIn());
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.renderer.zoomOut());
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => this.renderer.resetZoom());
    document.getElementById('btn-fit-screen')?.addEventListener('click', () => this.renderer.fitToScreen());

    document.getElementById('nav-btn-toggle-expand')?.addEventListener('click', () => {
      this.toggleExpandCollapseAll();
    });

    document.getElementById('nav-btn-data')?.addEventListener('click', () => {
      this.modal.setData(this.rootData);
      this.modal.open();
    });

    document.getElementById('nav-btn-settings')?.addEventListener('click', () => {
      this.settingsModal.open();
    });
  }

  private bindKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      // If user presses Enter in the title input of the sidebar, blur it so they can use canvas hotkeys
      if (isInputActive && e.key === 'Enter' && activeEl?.id === 'node-name-input') {
        e.preventDefault();
        (activeEl as HTMLElement).blur();
        return;
      }

      // If typing inside an input/textarea, let normal typing happen
      if (isInputActive) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Undo: Ctrl+Z / Cmd+Z
      if (isCtrlOrCmd && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        this.undo();
        return;
      }

      // Redo: Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z
      if ((isCtrlOrCmd && e.key.toLowerCase() === 'y') || (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        this.redo();
        return;
      }

      // Global Canvas Hotkeys
      if (e.key === '0') {
        e.preventDefault();
        this.renderer.fitToScreen();
      } else if (e.key === '1') {
        e.preventDefault();
        this.renderer.resetZoom();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        this.renderer.zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        this.renderer.zoomOut();
      } else if (e.key === 'Escape') {
        this.sidebar.close();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedNodeId) {
        e.preventDefault();
        if (confirm('Delete selected term and its sub-terms?')) {
          this.deleteNodeItem(this.selectedNodeId);
        }
      } else if (e.key === 'Tab' && this.selectedNodeId) {
        e.preventDefault();
        this.addChild(this.selectedNodeId);
      } else if (e.key === 'Enter' && this.selectedNodeId) {
        e.preventDefault();
        this.addSibling(this.selectedNodeId);
      } else if (e.key === 'F2' && this.selectedNodeId) {
        e.preventDefault();
        this.sidebar.focusNameInput();
      } else if (this.selectedNodeId) {
        // Arrow Navigation
        const { node, parent, index } = findNode(this.rootData, this.selectedNodeId);
        if (!node) return;

        if (e.key === 'ArrowDown') {
          // Navigate to first child
          if (node.children && node.children.length > 0) {
            e.preventDefault();
            this.selectNode(node.children[0].id, false);
          }
        } else if (e.key === 'ArrowUp') {
          // Navigate to parent
          if (parent) {
            e.preventDefault();
            this.selectNode(parent.id, false);
          }
        } else if (e.key === 'ArrowLeft') {
          // Navigate to previous sibling
          if (parent && parent.children && index > 0) {
            e.preventDefault();
            this.selectNode(parent.children[index - 1].id, false);
          }
        } else if (e.key === 'ArrowRight') {
          // Navigate to next sibling
          if (parent && parent.children && index < parent.children.length - 1) {
            e.preventDefault();
            this.selectNode(parent.children[index + 1].id, false);
          }
        }
      }
    });
  }
}

// Start application
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
