import { KnowledgeNode } from './types';
import { findNode, NodeSearchResult } from './storage';

export interface SidebarCallbacks {
  onUpdate: (id: string, updates: Partial<KnowledgeNode>) => void;
  onAddChild: (parentId: string) => void;
  onAddSibling: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectNode: (id: string) => void;
  onClose: () => void;
}

export class Sidebar {
  private container: HTMLElement;
  private callbacks: SidebarCallbacks;
  private currentNodeId: string | null = null;
  private currentRoot: KnowledgeNode | null = null;

  constructor(containerId: string, callbacks: SidebarCallbacks) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Sidebar container #${containerId} not found`);
    this.container = el;
    this.callbacks = callbacks;
  }

  public open(root: KnowledgeNode, nodeId: string): void {
    this.currentRoot = root;
    this.currentNodeId = nodeId;
    this.container.classList.add('open');
    this.render();
  }

  public close(): void {
    this.currentNodeId = null;
    this.container.classList.remove('open');
    this.callbacks.onClose();
  }

  public isOpen(): boolean {
    return this.container.classList.contains('open');
  }

  public getCurrentNodeId(): string | null {
    return this.currentNodeId;
  }

  public refresh(root: KnowledgeNode): void {
    this.currentRoot = root;
    if (this.currentNodeId) {
      const search = findNode(root, this.currentNodeId);
      if (!search.node) {
        this.close();
      } else {
        this.render();
      }
    }
  }

  public focusNameInput(): void {
    const input = this.container.querySelector('#node-name-input') as HTMLTextAreaElement | HTMLInputElement | null;
    if (input) {
      input.focus();
      input.select();
      if (typeof input.setSelectionRange === 'function') {
        input.setSelectionRange(0, input.value.length);
      }
    }
  }

  private render(): void {
    if (!this.currentNodeId || !this.currentRoot) return;

    const search: NodeSearchResult = findNode(this.currentRoot, this.currentNodeId);
    const { node, parent, path } = search;

    if (!node) {
      this.close();
      return;
    }

    const isRoot = !parent;
    const hasChildren = Boolean(node.children && node.children.length > 0);

    // Breadcrumbs trail
    const breadcrumbHtml = path
      .map((item, idx) => {
        const isLast = idx === path.length - 1;
        if (isLast) {
          return `<span class="crumb active">${this.escape(item.name)}</span>`;
        }
        return `<span class="crumb clickable" data-crumb-id="${item.id}">${this.escape(item.name)}</span><span class="crumb-sep">›</span>`;
      })
      .join('');

    // Sub-terms list
    let childrenHtml = '';
    if (hasChildren && node.children) {
      childrenHtml = node.children
        .map(
          child => `
          <div class="panel-child-item" data-child-id="${child.id}">
            <span class="panel-child-name">${this.escape(child.name)}</span>
            <button class="child-del-btn" data-del-child-id="${child.id}" title="Delete sub-term">✕</button>
          </div>
        `
        )
        .join('');
    }

    this.container.innerHTML = `
      <!-- Top Bar: Breadcrumbs & Close -->
      <div class="panel-top-bar">
        <div class="panel-breadcrumbs">${breadcrumbHtml}</div>
        <button class="panel-close-btn" id="sidebar-close" title="Close Panel (Esc)">✕</button>
      </div>

      <!-- Main Content: View & Edit matching the reference sketch -->
      <div class="panel-content">
        <!-- Big Bold Title (Smart carriage return, auto-fit, view and edit) -->
        <div class="panel-title-wrapper">
          <textarea
            id="node-name-input"
            class="panel-title-input"
            rows="1"
            placeholder="Term Title"
            autocomplete="off"
            spellcheck="false"
          >${this.escape(node.name)}</textarea>
        </div>

        <!-- Soothing Thin Description (Click to view and edit) -->
        <div class="panel-desc-wrapper">
          <textarea
            id="node-desc-input"
            class="panel-desc-input"
            placeholder="Write clear, soothing brief or definition here..."
          >${this.escape(node.description || '')}</textarea>
        </div>

        <!-- Sub-nodes section if any exist or to add one -->
        <div class="panel-section">
          <div class="panel-section-header">
            <span class="panel-section-title">Sub-Terms (${node.children ? node.children.length : 0})</span>
            <button class="text-btn" id="sidebar-add-child-btn">+ Add Sub-Node</button>
          </div>
          <div class="panel-children-grid">
            ${childrenHtml || '<div class="panel-empty-text">No sub-terms yet.</div>'}
          </div>
        </div>
      </div>

      <!-- Footer Actions & Hotkeys Guide -->
      <div class="panel-footer">
        <div class="panel-btn-row">
          <button class="action-btn secondary" id="sidebar-add-sibling-btn" ${isRoot ? 'style="display:none;"' : ''}>
            + Sibling
          </button>
          ${
            !isRoot
              ? `<button class="action-btn danger-text" id="sidebar-delete-btn">
                  Delete
                </button>`
              : ''
          }
        </div>
        <div class="panel-hotkeys-guide">
          <span><kbd>Tab</kbd> Sub-node</span>
          <span><kbd>Enter</kbd> Sibling</span>
          <span><kbd>Del</kbd> Delete</span>
        </div>
      </div>
    `;

    this.bindEvents(node.id, isRoot);
  }

  private bindEvents(nodeId: string, isRoot: boolean): void {
    // Close button
    this.container.querySelector('#sidebar-close')?.addEventListener('click', () => this.close());

    // Breadcrumb clicks
    this.container.querySelectorAll('.crumb.clickable').forEach(el => {
      el.addEventListener('click', () => {
        const targetId = el.getAttribute('data-crumb-id');
        if (targetId) this.callbacks.onSelectNode(targetId);
      });
    });

    // Real-time title textarea (smart carriage return & dynamic font size)
    const nameInput = this.container.querySelector('#node-name-input') as HTMLTextAreaElement;
    if (nameInput) {
      this.adjustTitleTextarea(nameInput);
      nameInput.addEventListener('input', () => {
        this.adjustTitleTextarea(nameInput);
        this.callbacks.onUpdate(nodeId, { name: nameInput.value });
      });
      nameInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          nameInput.blur();
        }
      });
    }

    // Real-time description input
    const descInput = this.container.querySelector('#node-desc-input') as HTMLTextAreaElement;
    descInput?.addEventListener('input', () => {
      this.callbacks.onUpdate(nodeId, { description: descInput.value });
    });

    // Add child
    this.container.querySelector('#sidebar-add-child-btn')?.addEventListener('click', () => {
      this.callbacks.onAddChild(nodeId);
    });

    // Add sibling
    this.container.querySelector('#sidebar-add-sibling-btn')?.addEventListener('click', () => {
      this.callbacks.onAddSibling(nodeId);
    });

    // Delete node
    this.container.querySelector('#sidebar-delete-btn')?.addEventListener('click', () => {
      if (!isRoot && confirm('Delete this term and its sub-terms?')) {
        this.callbacks.onDelete(nodeId);
        this.close();
      }
    });

    // Click child item
    this.container.querySelectorAll('.panel-child-item').forEach(el => {
      el.addEventListener('click', (e: Event) => {
        if ((e.target as HTMLElement).classList.contains('child-del-btn')) return;
        const childId = el.getAttribute('data-child-id');
        if (childId) this.callbacks.onSelectNode(childId);
      });
    });

    // Delete child button
    this.container.querySelectorAll('.child-del-btn').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        const childId = btn.getAttribute('data-del-child-id');
        if (childId && confirm('Delete this sub-term?')) {
          this.callbacks.onDelete(childId);
        }
      });
    });
  }

  private adjustTitleTextarea(textarea: HTMLTextAreaElement): void {
    const text = textarea.value.trim();
    const len = text.length;

    if (len <= 8) {
      textarea.style.fontSize = '38px';
      textarea.style.lineHeight = '1.05';
    } else if (len <= 15) {
      textarea.style.fontSize = '30px';
      textarea.style.lineHeight = '1.1';
    } else if (len <= 24) {
      textarea.style.fontSize = '24px';
      textarea.style.lineHeight = '1.15';
    } else {
      textarea.style.fontSize = '20px';
      textarea.style.lineHeight = '1.2';
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  private escape(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
