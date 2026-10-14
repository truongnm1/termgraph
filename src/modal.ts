import { KnowledgeNode } from './types';
import {
  exportToJsonString,
  exportToMarkdown,
  importFromMarkdown,
  saveKnowledgeBase,
  countTotalNodes,
  getMaxDepth
} from './storage';
import { initialKnowledgeBase, generateLargeKnowledgeBase } from './demo-data';

export interface ModalCallbacks {
  onLoadData: (newData: KnowledgeNode) => void;
}

export class DataModal {
  private container: HTMLElement;
  private callbacks: ModalCallbacks;
  private currentData: KnowledgeNode;

  constructor(containerId: string, callbacks: ModalCallbacks, initialData: KnowledgeNode) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Modal container #${containerId} not found`);
    this.container = el;
    this.callbacks = callbacks;
    this.currentData = initialData;
    this.bindGlobalEvents();
  }

  public setData(data: KnowledgeNode): void {
    this.currentData = data;
  }

  public open(): void {
    this.container.classList.add('open');
    this.render();
  }

  public close(): void {
    this.container.classList.remove('open');
  }

  public isOpen(): boolean {
    return this.container.classList.contains('open');
  }

  private bindGlobalEvents(): void {
    this.container.addEventListener('click', (e: MouseEvent) => {
      if (e.target === this.container) {
        this.close();
      }
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  private render(): void {
    const jsonStr = exportToJsonString(this.currentData);
    const mdStr = exportToMarkdown(this.currentData);
    const count = countTotalNodes(this.currentData);
    const depth = getMaxDepth(this.currentData);

    this.container.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title-group">
            <h2 class="modal-title">Knowledge Base Import / Export</h2>
            <span class="status-pill" id="tree-status-pill" title="Permanently saved on disk: data/knowledge-base.json">${count} Terms • ${depth} Levels</span>
          </div>
          <button class="modal-close-btn" id="modal-close-btn">✕</button>
        </div>

        <div class="modal-tabs">
          <button class="tab-btn active" data-tab="json">JSON Format</button>
          <button class="tab-btn" data-tab="markdown">Markdown Outline</button>
          <button class="tab-btn" data-tab="presets">Presets & Benchmark</button>
        </div>

        <div class="modal-body">
          <!-- JSON Tab -->
          <div class="tab-content active" id="tab-json">
            <p class="tab-desc">Export or import the full hierarchical graph structure with node IDs and attributes.</p>
            <div class="modal-btn-row">
              <button class="action-btn primary" id="btn-download-json">Download JSON File</button>
              <button class="action-btn secondary" id="btn-copy-json">Copy JSON</button>
              <label class="action-btn secondary file-input-label">
                Upload JSON File
                <input type="file" id="input-file-json" accept=".json" style="display:none;" />
              </label>
            </div>
            <div class="form-group" style="margin-top: 14px;">
              <label class="form-label">Raw JSON Data</label>
              <textarea class="form-textarea code-area" id="textarea-json" rows="12" spellcheck="false">${this.escape(jsonStr)}</textarea>
            </div>
            <div class="modal-footer-row">
              <button class="action-btn primary" id="btn-apply-json">Apply & Load JSON</button>
              <span class="status-msg" id="json-status"></span>
            </div>
          </div>

          <!-- Markdown Tab -->
          <div class="tab-content" id="tab-markdown">
            <p class="tab-desc">Export or import clean markdown outlines using headings (<code>#</code>, <code>##</code>, <code>###</code>).</p>
            <div class="modal-btn-row">
              <button class="action-btn primary" id="btn-download-md">Download Markdown</button>
              <button class="action-btn secondary" id="btn-copy-md">Copy Markdown</button>
            </div>
            <div class="form-group" style="margin-top: 14px;">
              <label class="form-label">Markdown Outline</label>
              <textarea class="form-textarea code-area" id="textarea-md" rows="12" spellcheck="false">${this.escape(mdStr)}</textarea>
            </div>
            <div class="modal-footer-row">
              <button class="action-btn primary" id="btn-apply-md">Parse & Build Graph</button>
              <span class="status-msg" id="md-status"></span>
            </div>
          </div>

          <!-- Presets Tab -->
          <div class="tab-content" id="tab-presets">
            <div class="preset-card">
              <div class="preset-info">
                <h3>Networking Knowledge Base</h3>
                <p>Default tree matching the reference top-to-bottom architecture sketch (~15 key protocols across 4 layers).</p>
              </div>
              <button class="action-btn secondary" id="btn-load-networking">Load Networking Tree</button>
            </div>

            <div class="preset-card">
              <div class="preset-info">
                <h3>Performance Benchmark (190+ Nodes)</h3>
                <p>Deep multi-tiered architecture tree with 7 levels of vertical depth and controlled 2-sibling branching (190+ terms) to test vertical layout and deep navigation.</p>
              </div>
              <button class="action-btn primary" id="btn-load-scale-test">Load Scale Benchmark</button>
            </div>

            <div class="preset-card">
              <div class="preset-info">
                <h3>Reset Local Storage</h3>
                <p>Clears current browser cache and restores initial state.</p>
              </div>
              <button class="action-btn danger" id="btn-clear-storage">Reset to Factory Demo</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindTabEvents();
    this.bindActionEvents();
  }

  private bindTabEvents(): void {
    const tabs = this.container.querySelectorAll('.tab-btn');
    const contents = this.container.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const targetId = `tab-${tab.getAttribute('data-tab')}`;
        const targetContent = this.container.querySelector(`#${targetId}`);
        targetContent?.classList.add('active');
      });
    });

    const closeBtn = this.container.querySelector('#modal-close-btn');
    closeBtn?.addEventListener('click', () => this.close());
  }

  private bindActionEvents(): void {
    // Download JSON
    this.container.querySelector('#btn-download-json')?.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportToJsonString(this.currentData));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `termgraph-${this.currentData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    // Copy JSON
    this.container.querySelector('#btn-copy-json')?.addEventListener('click', () => {
      navigator.clipboard.writeText(exportToJsonString(this.currentData)).then(() => {
        const status = this.container.querySelector('#json-status');
        if (status) status.textContent = 'JSON copied to clipboard!';
      });
    });

    // Upload JSON
    const fileInput = this.container.querySelector('#input-file-json') as HTMLInputElement;
    fileInput?.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const parsed = JSON.parse(e.target?.result as string);
            if (parsed && parsed.name) {
              this.callbacks.onLoadData(parsed);
              this.close();
            } else {
              alert('Invalid format: Knowledge base root must have a name.');
            }
          } catch (err: any) {
            alert('JSON parse error: ' + err.message);
          }
        };
        reader.readAsText(fileInput.files[0]);
      }
    });

    // Apply JSON
    this.container.querySelector('#btn-apply-json')?.addEventListener('click', () => {
      const area = this.container.querySelector('#textarea-json') as HTMLTextAreaElement;
      try {
        const parsed = JSON.parse(area.value);
        if (parsed && parsed.name) {
          this.callbacks.onLoadData(parsed);
          this.close();
        } else {
          alert('Root node requires a name property.');
        }
      } catch (err: any) {
        alert('Invalid JSON: ' + err.message);
      }
    });

    // Download Markdown
    this.container.querySelector('#btn-download-md')?.addEventListener('click', () => {
      const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(exportToMarkdown(this.currentData));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `termgraph-${this.currentData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    // Copy Markdown
    this.container.querySelector('#btn-copy-md')?.addEventListener('click', () => {
      navigator.clipboard.writeText(exportToMarkdown(this.currentData)).then(() => {
        const status = this.container.querySelector('#md-status');
        if (status) status.textContent = 'Markdown copied to clipboard!';
      });
    });

    // Apply Markdown
    this.container.querySelector('#btn-apply-md')?.addEventListener('click', () => {
      const area = this.container.querySelector('#textarea-md') as HTMLTextAreaElement;
      try {
        const tree = importFromMarkdown(area.value);
        this.callbacks.onLoadData(tree);
        this.close();
      } catch (err: any) {
        alert('Markdown Import Error: ' + err.message);
      }
    });

    // Preset Networking
    this.container.querySelector('#btn-load-networking')?.addEventListener('click', () => {
      this.callbacks.onLoadData(JSON.parse(JSON.stringify(initialKnowledgeBase)));
      this.close();
    });

    // Preset Scale Test
    this.container.querySelector('#btn-load-scale-test')?.addEventListener('click', () => {
      const largeTree = generateLargeKnowledgeBase(160);
      this.callbacks.onLoadData(largeTree);
      this.close();
    });

    // Reset
    this.container.querySelector('#btn-clear-storage')?.addEventListener('click', () => {
      if (confirm('Reset to initial default knowledge tree?')) {
        saveKnowledgeBase(initialKnowledgeBase);
        this.callbacks.onLoadData(JSON.parse(JSON.stringify(initialKnowledgeBase)));
        this.close();
      }
    });
  }

  private escape(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
