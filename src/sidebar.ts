import { KnowledgeNode } from './types';
import { findNode, NodeSearchResult } from './storage';

export interface SidebarCallbacks {
  onUpdate: (id: string, updates: Partial<KnowledgeNode>) => void;
  onAddChild: (parentId: string) => void;
  onAddSibling: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectNode: (id: string) => void;
  onClose: () => void;
  onBadgeHover?: (node: KnowledgeNode, clientX: number, clientY: number) => void;
  onBadgeHoverMove?: (clientX: number, clientY: number) => void;
  onBadgeHoverEnd?: () => void;
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

    // Prevent any click inside the sidebar from bubbling to document outside-click handler
    this.container.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
    });
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
    this.callbacks.onBadgeHoverEnd?.();
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
    const { node, path } = search;

    if (!node) {
      this.close();
      return;
    }
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const hasIpo =
      node.hasIpo !== undefined
        ? node.hasIpo
        : Boolean(
            (node.inputs && node.inputs.trim()) ||
            (node.processing && node.processing.trim()) ||
            (node.outputs && node.outputs.trim()) ||
            (node.example && node.example.trim())
          );

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

        <!-- Soothing Description (Click to view and edit) -->
        <div class="panel-desc-wrapper">
          <textarea
            id="node-desc-input"
            class="panel-desc-input"
            placeholder="Write clear, soothing brief or definition here..."
            spellcheck="false"
            autocomplete="off"
          >${this.escape(node.description || '')}</textarea>
        </div>

        <!-- Section: I/O Model (Inputs - Processing - Outputs - Example) -->
        <div class="panel-section panel-ipo-section ${!hasIpo ? 'panel-section-compact' : ''}">
          <div class="panel-section-header">
            <span class="panel-section-title">I/O Model</span>
            <label class="panel-toggle-wrapper" title="Toggle I/O model for this term">
              <span class="panel-toggle-text">${hasIpo ? 'ON' : 'OFF'}</span>
              <input type="checkbox" id="sidebar-toggle-ipo" ${hasIpo ? 'checked' : ''} />
              <span class="panel-toggle-switch"></span>
            </label>
          </div>
          ${
            hasIpo
              ? `
          <div class="ipo-container">
            <!-- Inputs -->
            <div class="ipo-block">
              <div class="ipo-header">
                <span class="ipo-tag ipo-tag-in">INPUTS</span>
              </div>
              <textarea
                id="node-inputs-input"
                class="ipo-textarea"
                rows="1"
                placeholder="Enter inputs..."
                spellcheck="false"
                autocomplete="off"
              >${this.escape(node.inputs || '')}</textarea>
            </div>

            <!-- Processing -->
            <div class="ipo-block">
              <div class="ipo-header">
                <span class="ipo-tag ipo-tag-proc">PROCESSING</span>
              </div>
              <textarea
                id="node-processing-input"
                class="ipo-textarea"
                rows="1"
                placeholder="Enter processing..."
                spellcheck="false"
                autocomplete="off"
              >${this.escape(node.processing || '')}</textarea>
            </div>

            <!-- Outputs -->
            <div class="ipo-block">
              <div class="ipo-header">
                <span class="ipo-tag ipo-tag-out">OUTPUTS</span>
              </div>
              <textarea
                id="node-outputs-input"
                class="ipo-textarea"
                rows="1"
                placeholder="Enter outputs..."
                spellcheck="false"
                autocomplete="off"
              >${this.escape(node.outputs || '')}</textarea>
            </div>

            <!-- Example -->
            <div class="ipo-block">
              <div class="ipo-header">
                <span class="ipo-tag ipo-tag-example">EXAMPLE</span>
              </div>
              <textarea
                id="node-example-input"
                class="ipo-textarea"
                rows="1"
                placeholder="Concrete walk-through based on the I/O above..."
                spellcheck="false"
                autocomplete="off"
              >${this.escape(node.example || '')}</textarea>
            </div>
          </div>
          `
              : ''
          }
        </div>

        <!-- Sub-nodes section - sleek compact footprint -->
        <div class="panel-section ${!hasChildren ? 'panel-section-compact' : ''}">
          <div class="panel-section-header">
            <span class="panel-section-title">Sub-Terms (${node.children ? node.children.length : 0})</span>
            <button class="text-btn" id="sidebar-add-child-btn">+ Add Sub-Node</button>
          </div>
          ${hasChildren ? `<div class="panel-children-grid">${childrenHtml}</div>` : ''}
        </div>
      </div>

      <!-- Footer: Hotkeys Guide -->
      <div class="panel-footer">
        <div class="panel-hotkeys-guide">
          <span><kbd>Tab</kbd> Sub-node</span>
          <span><kbd>Enter</kbd> Sibling</span>
          <span><kbd>Del</kbd> Delete</span>
        </div>
      </div>
    `;

    this.bindEvents(node);
  }

  private bindEvents(node: KnowledgeNode): void {
    const nodeId = node.id;

    // Close button
    this.container.querySelector('#sidebar-close')?.addEventListener('click', () => this.close());

    // Breadcrumb clicks
    this.container.querySelectorAll('.crumb.clickable').forEach(el => {
      el.addEventListener('click', (e: Event) => {
        e.stopPropagation();
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

    // Real-time description input (natural auto-height in unified document scroll)
    const descInput = this.container.querySelector('#node-desc-input') as HTMLTextAreaElement;
    if (descInput) {
      this.adjustDescHeight(descInput);
      descInput.addEventListener('input', () => {
        this.adjustDescHeight(descInput);
        this.callbacks.onUpdate(nodeId, { description: descInput.value });
      });
    }

    // Toggle I/O Model
    const toggleIpo = this.container.querySelector('#sidebar-toggle-ipo') as HTMLInputElement;
    if (toggleIpo) {
      toggleIpo.addEventListener('change', () => {
        const enabled = toggleIpo.checked;
        node.hasIpo = enabled;
        this.callbacks.onUpdate(nodeId, { hasIpo: enabled });
        this.render();
        if (enabled) {
          const firstInput = this.container.querySelector('#node-inputs-input') as HTMLTextAreaElement;
          firstInput?.focus();
        }
      });
    }

    // Real-time Inputs - Processing - Outputs - Example
    const inputsInput = this.container.querySelector('#node-inputs-input') as HTMLTextAreaElement;
    if (inputsInput) {
      this.adjustAutoHeight(inputsInput, 44);
      inputsInput.addEventListener('input', () => {
        this.adjustAutoHeight(inputsInput, 44);
        this.callbacks.onUpdate(nodeId, { inputs: inputsInput.value });
      });
    }

    const procInput = this.container.querySelector('#node-processing-input') as HTMLTextAreaElement;
    if (procInput) {
      this.adjustAutoHeight(procInput, 44);
      procInput.addEventListener('input', () => {
        this.adjustAutoHeight(procInput, 44);
        this.callbacks.onUpdate(nodeId, { processing: procInput.value });
      });
    }

    const outputsInput = this.container.querySelector('#node-outputs-input') as HTMLTextAreaElement;
    if (outputsInput) {
      this.adjustAutoHeight(outputsInput, 44);
      outputsInput.addEventListener('input', () => {
        this.adjustAutoHeight(outputsInput, 44);
        this.callbacks.onUpdate(nodeId, { outputs: outputsInput.value });
      });
    }

    const exampleInput = this.container.querySelector('#node-example-input') as HTMLTextAreaElement;
    if (exampleInput) {
      this.adjustAutoHeight(exampleInput, 44);
      exampleInput.addEventListener('input', () => {
        this.adjustAutoHeight(exampleInput, 44);
        this.callbacks.onUpdate(nodeId, { example: exampleInput.value });
      });
    }

    const panelContent = this.container.querySelector('.panel-content');

    // Hide hint box when scrolling panel
    panelContent?.addEventListener('scroll', () => {
      this.callbacks.onBadgeHoverEnd?.();
    }, { passive: true });

    // Add child
    this.container.querySelector('#sidebar-add-child-btn')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      this.callbacks.onAddChild(nodeId);
    });

    // Map children for fast O(1) lookup during badge hover
    const childMap = new Map<string, KnowledgeNode>();
    if (node.children) {
      for (const child of node.children) {
        childMap.set(child.id, child);
      }
    }

    // Sub-term badges: click to navigate, hover to preview hint box
    this.container.querySelectorAll('.panel-child-item').forEach(el => {
      const childId = el.getAttribute('data-child-id');
      const child = childId ? childMap.get(childId) : null;

      el.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        this.callbacks.onBadgeHoverEnd?.();
        if (childId) this.callbacks.onSelectNode(childId);
      });

      if (child) {
        el.addEventListener('mouseenter', ((e: MouseEvent) => {
          this.callbacks.onBadgeHover?.(child, e.clientX, e.clientY);
        }) as EventListener);

        el.addEventListener('mousemove', ((e: MouseEvent) => {
          this.callbacks.onBadgeHoverMove?.(e.clientX, e.clientY);
        }) as EventListener);

        el.addEventListener('mouseleave', () => {
          this.callbacks.onBadgeHoverEnd?.();
        });
      }
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

  private adjustDescHeight(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(100, textarea.scrollHeight)}px`;
  }

  private adjustAutoHeight(textarea: HTMLTextAreaElement, minHeight = 44): void {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(minHeight, textarea.scrollHeight)}px`;
  }

  private escape(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
