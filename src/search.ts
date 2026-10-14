import { KnowledgeNode } from './types';

export interface FlatSearchItem {
  id: string;
  name: string;
  description: string;
  pathString: string;
}

export class SearchController {
  private inputEl: HTMLInputElement;
  private resultsEl: HTMLElement;
  private onSelect: (nodeId: string) => void;
  private items: FlatSearchItem[] = [];
  private selectedIndex = -1;

  constructor(
    inputId: string,
    resultsId: string,
    onSelect: (nodeId: string) => void
  ) {
    const input = document.getElementById(inputId) as HTMLInputElement;
    const results = document.getElementById(resultsId);
    if (!input || !results) throw new Error('Search elements not found');

    this.inputEl = input;
    this.resultsEl = results;
    this.onSelect = onSelect;

    this.bindEvents();
  }

  public updateData(root: KnowledgeNode): void {
    this.items = [];
    const traverse = (node: KnowledgeNode, currentPath: string[]) => {
      const nextPath = [...currentPath, node.name];
      this.items.push({
        id: node.id,
        name: node.name,
        description: node.description || '',
        pathString: nextPath.join(' › ')
      });
      if (node.children) {
        for (const child of node.children) {
          traverse(child, nextPath);
        }
      }
    };
    traverse(root, []);
  }

  private bindEvents(): void {
    this.inputEl.addEventListener('input', () => {
      this.handleSearch(this.inputEl.value.trim());
    });

    this.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
      const resultItems = this.resultsEl.querySelectorAll('.search-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (resultItems.length > 0) {
          this.selectedIndex = (this.selectedIndex + 1) % resultItems.length;
          this.highlightSelectedItem(resultItems);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (resultItems.length > 0) {
          this.selectedIndex = (this.selectedIndex - 1 + resultItems.length) % resultItems.length;
          this.highlightSelectedItem(resultItems);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < resultItems.length) {
          const selected = resultItems[this.selectedIndex] as HTMLElement;
          const id = selected.getAttribute('data-id');
          if (id) this.choose(id);
        }
      } else if (e.key === 'Escape') {
        this.clear();
      }
    });

    // Close results when clicking outside
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!this.inputEl.contains(target) && !this.resultsEl.contains(target)) {
        this.hideResults();
      }
    });

    // Global shortcut Ctrl+K or /
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.inputEl.focus();
        this.inputEl.select();
      } else if (e.key === '/' && document.activeElement !== this.inputEl && !this.isEditingInput()) {
        e.preventDefault();
        this.inputEl.focus();
        this.inputEl.select();
      }
    });
  }

  private isEditingInput(): boolean {
    const tag = document.activeElement?.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea';
  }

  private handleSearch(query: string): void {
    if (!query) {
      this.hideResults();
      return;
    }

    const lower = query.toLowerCase();
    const matches = this.items
      .filter(item => {
        return (
          item.name.toLowerCase().includes(lower) ||
          item.description.toLowerCase().includes(lower)
        );
      })
      .slice(0, 15);

    if (matches.length === 0) {
      this.resultsEl.innerHTML = `<div class="search-empty">No terms match "${this.escape(query)}"</div>`;
      this.resultsEl.style.display = 'block';
      this.selectedIndex = -1;
      return;
    }

    this.selectedIndex = 0;
    this.resultsEl.innerHTML = matches
      .map(
        (m, idx) => `
        <div class="search-item ${idx === 0 ? 'selected' : ''}" data-id="${m.id}">
          <div class="search-item-title">${this.highlightMatch(m.name, query)}</div>
          <div class="search-item-path">${this.escape(m.pathString)}</div>
          <div class="search-item-desc">${this.highlightMatch(this.truncate(m.description, 100), query)}</div>
        </div>
      `
      )
      .join('');

    this.resultsEl.style.display = 'block';

    // Click handlers
    this.resultsEl.querySelectorAll('.search-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        if (id) this.choose(id);
      });
    });
  }

  private highlightSelectedItem(items: NodeListOf<Element>): void {
    items.forEach((item, idx) => {
      if (idx === this.selectedIndex) {
        item.classList.add('selected');
        (item as HTMLElement).scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  private choose(nodeId: string): void {
    this.onSelect(nodeId);
    this.hideResults();
    this.inputEl.blur();
  }

  public clear(): void {
    this.inputEl.value = '';
    this.hideResults();
  }

  private hideResults(): void {
    this.resultsEl.style.display = 'none';
    this.selectedIndex = -1;
  }

  private truncate(str: string, len: number): string {
    if (str.length <= len) return str;
    return str.slice(0, len) + '...';
  }

  private highlightMatch(text: string, query: string): string {
    if (!query) return this.escape(text);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    return parts
      .map((part, i) =>
        i % 2 === 1
          ? `<mark class="search-highlight">${this.escape(part)}</mark>`
          : this.escape(part)
      )
      .join('');
  }

  private escape(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
