import { KnowledgeNode } from './types';

export interface ListViewCallbacks {
  onLocateNode: (id: string) => void;
  onOpenDetail?: (id: string) => void;
  onClose?: () => void;
}

export interface FlatNodeRecord {
  id: string;
  name: string;
  depth: number;
  hasChildren: boolean;
}

export class ListView {
  private container: HTMLElement;
  private callbacks: ListViewCallbacks;
  private currentRoot: KnowledgeNode | null = null;
  private activeNodeId: string | null = null;
  private filterQuery = '';

  constructor(containerId: string, callbacks: ListViewCallbacks) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`List view container #${containerId} not found`);
    this.container = el;
    this.callbacks = callbacks;

    // Prevent any click inside the left sidebar from bubbling to document outside-click handler
    this.container.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
    });
  }

  public open(root: KnowledgeNode, activeId?: string | null): void {
    this.currentRoot = root;
    if (activeId) this.activeNodeId = activeId;
    this.container.classList.add('open');
    this.render();
  }

  public close(): void {
    this.container.classList.remove('open');
    this.callbacks.onClose?.();
  }

  public toggle(root: KnowledgeNode, activeId?: string | null): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open(root, activeId);
    }
  }

  public isOpen(): boolean {
    return this.container.classList.contains('open');
  }

  public setActiveNode(nodeId: string): void {
    this.activeNodeId = nodeId;
    const allItems = this.container.querySelectorAll<HTMLElement>('.list-record-item');
    allItems.forEach(item => {
      if (item.getAttribute('data-node-id') === nodeId) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  public refresh(root: KnowledgeNode): void {
    this.currentRoot = root;
    if (this.isOpen()) {
      this.render();
    }
  }

  private render(): void {
    if (!this.currentRoot) return;

    const allRecords = this.flattenTree(this.currentRoot);
    const totalCount = allRecords.length;
    const filteredRecords = this.filterQuery
      ? allRecords.filter(r => r.name.toLowerCase().includes(this.filterQuery))
      : allRecords;

    const recordsHtml = this.generateRecordsHtml(filteredRecords);

    this.container.innerHTML = `
      <!-- Left Panel Header -->
      <div class="panel-list-top-bar">
        <div class="panel-list-heading">
          <span class="panel-list-title">OUTLINE</span>
          <span class="tab-count-badge" id="left-total-badge">${this.filterQuery ? `${filteredRecords.length} / ${totalCount}` : totalCount}</span>
        </div>
        <button class="panel-close-btn" id="left-sidebar-close" title="Close List (Esc)">✕</button>
      </div>

      <!-- Left Panel Search & Filter Bar -->
      <div class="panel-list-header">
        <div class="list-search-wrapper">
          <span class="list-search-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="10.5" cy="10.5" r="7" />
              <line x1="15.5" y1="15.5" x2="21" y2="21" />
            </svg>
          </span>
          <input
            type="text"
            id="left-list-search-input"
            class="list-search-input"
            placeholder="Filter terms..."
            value="${this.escape(this.filterQuery)}"
            autocomplete="off"
            spellcheck="false"
          />
          ${this.filterQuery ? `<button class="list-search-clear" id="left-list-search-clear" title="Clear filter">✕</button>` : ''}
        </div>
      </div>

      <!-- Scrollable Records List -->
      <div class="panel-list-scroll" id="left-list-records" tabindex="0">
        ${recordsHtml}
      </div>

      <!-- Footer Hotkeys Guide -->
      <div class="panel-footer">
        <div class="panel-hotkeys-guide">
          <span><kbd>Click</kbd> Locate</span>
          <span><kbd>DblClick</kbd> Detail</span>
        </div>
      </div>
    `;

    this.bindEvents(allRecords);
  }

  private generateRecordsHtml(records: FlatNodeRecord[]): string {
    if (records.length === 0) {
      return `<div class="list-empty-msg">No terms match "${this.escape(this.filterQuery)}"</div>`;
    }

    return records
      .map(r => {
        const isActive = r.id === this.activeNodeId;
        const indentPx = 14 + r.depth * 13;
        const marker = r.depth === 0 ? '●' : r.hasChildren ? '▸' : '▪';

        return `
          <div class="list-record-item ${isActive ? 'active' : ''}" data-node-id="${r.id}" style="padding-left: ${indentPx}px;">
            <span class="list-record-marker">${marker}</span>
            <span class="list-record-title">${this.escape(r.name)}</span>
          </div>
        `;
      })
      .join('');
  }

  private bindEvents(allRecords: FlatNodeRecord[]): void {
    // Close button
    this.container.querySelector('#left-sidebar-close')?.addEventListener('click', () => this.close());

    // Search input
    const searchInput = this.container.querySelector('#left-list-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.filterQuery = searchInput.value.trim().toLowerCase();
        this.updateFilteredList(allRecords);
      });
    }

    // Clear search
    this.container.querySelector('#left-list-search-clear')?.addEventListener('click', () => {
      this.filterQuery = '';
      if (searchInput) searchInput.value = '';
      this.updateFilteredList(allRecords);
      searchInput?.focus();
    });

    // Record Click & Double Click
    this.bindRecordClickHandlers();

    // Keyboard Arrow Up / Down navigation inside list
    const scrollContainer = this.container.querySelector('#left-list-records') as HTMLElement;
    scrollContainer?.addEventListener('keydown', (e: KeyboardEvent) => {
      const activeEl = this.container.querySelector('.list-record-item.active') as HTMLElement;
      const allVisible = Array.from(this.container.querySelectorAll<HTMLElement>('.list-record-item'));
      if (allVisible.length === 0) return;

      const currentIndex = activeEl ? allVisible.indexOf(activeEl) : -1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, allVisible.length - 1);
        const target = allVisible[nextIndex];
        const id = target.getAttribute('data-node-id');
        if (id) {
          this.setActiveNode(id);
          this.callbacks.onLocateNode(id);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        const target = allVisible[prevIndex];
        const id = target.getAttribute('data-node-id');
        if (id) {
          this.setActiveNode(id);
          this.callbacks.onLocateNode(id);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this.activeNodeId) {
          this.callbacks.onOpenDetail?.(this.activeNodeId);
        }
      }
    });

    // Auto-scroll active item into view
    if (this.activeNodeId) {
      const activeEl = this.container.querySelector(`.list-record-item[data-node-id="${this.activeNodeId}"]`);
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }

  private updateFilteredList(allRecords: FlatNodeRecord[]): void {
    const listRecordsEl = this.container.querySelector('#left-list-records');
    const totalBadgeEl = this.container.querySelector('#left-total-badge');
    if (!listRecordsEl) return;

    const filteredRecords = this.filterQuery
      ? allRecords.filter(r => r.name.toLowerCase().includes(this.filterQuery))
      : allRecords;

    listRecordsEl.innerHTML = this.generateRecordsHtml(filteredRecords);
    if (totalBadgeEl) {
      totalBadgeEl.textContent = this.filterQuery
        ? `${filteredRecords.length} / ${allRecords.length}`
        : `${allRecords.length}`;
    }

    this.bindRecordClickHandlers();
  }

  private bindRecordClickHandlers(): void {
    const records = this.container.querySelectorAll<HTMLElement>('.list-record-item');
    records.forEach(el => {
      const id = el.getAttribute('data-node-id');
      if (!id) return;

      el.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        this.setActiveNode(id);
        this.callbacks.onLocateNode(id);
      });

      el.addEventListener('dblclick', (e: Event) => {
        e.stopPropagation();
        this.setActiveNode(id);
        this.callbacks.onOpenDetail?.(id);
      });
    });
  }

  private flattenTree(root: KnowledgeNode): FlatNodeRecord[] {
    const records: FlatNodeRecord[] = [];

    const traverse = (node: KnowledgeNode, depth = 0) => {
      const hasChildren = Boolean(node.children && node.children.length > 0);

      records.push({
        id: node.id,
        name: node.name,
        depth,
        hasChildren
      });

      if (node.children) {
        for (const child of node.children) {
          traverse(child, depth + 1);
        }
      }
    };

    traverse(root, 0);
    return records;
  }

  private escape(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
