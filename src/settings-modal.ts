export interface ThemeOption {
  id: string;
  name: string;
  bgPreview: string;
  cardPreview: string;
  textPreview: string;
  borderPreview: string;
}

export interface FontOption {
  id: string;
  name: string;
  headingFont: string;
  bodyFont: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    name: 'Obsidian Minimal',
    bgPreview: '#0e131b',
    cardPreview: '#182232',
    textPreview: '#f8fafc',
    borderPreview: '#33445d'
  },
  {
    id: 'light',
    name: 'Paper White',
    bgPreview: '#ffffff',
    cardPreview: '#ffffff',
    textPreview: '#000000',
    borderPreview: '#000000'
  },
  {
    id: 'parchment',
    name: 'Warm Parchment',
    bgPreview: '#f4ecd8',
    cardPreview: '#fffdf7',
    textPreview: '#2b241c',
    borderPreview: '#8a7a60'
  },
  {
    id: 'nord',
    name: 'Nordic Frost',
    bgPreview: '#242933',
    cardPreview: '#3b4252',
    textPreview: '#eceff4',
    borderPreview: '#88c0d0'
  },
  {
    id: 'solarized',
    name: 'Solarized Teal',
    bgPreview: '#00212b',
    cardPreview: '#073642',
    textPreview: '#93a1a1',
    borderPreview: '#2aa198'
  },
  {
    id: 'monochrome',
    name: 'OLED Monochrome',
    bgPreview: '#000000',
    cardPreview: '#000000',
    textPreview: '#ffffff',
    borderPreview: '#ffffff'
  }
];

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'oswald-inter',
    name: 'Oswald + Inter',
    headingFont: "'Oswald', sans-serif",
    bodyFont: "'Inter', sans-serif"
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    headingFont: "'JetBrains Mono', monospace",
    bodyFont: "'JetBrains Mono', monospace"
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk + Inter',
    headingFont: "'Space Grotesk', sans-serif",
    bodyFont: "'Inter', sans-serif"
  },
  {
    id: 'playfair-editorial',
    name: 'Playfair + Inter',
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Inter', sans-serif"
  },
  {
    id: 'barlow-jakarta',
    name: 'Barlow + Jakarta',
    headingFont: "'Barlow Condensed', sans-serif",
    bodyFont: "'Plus Jakarta Sans', sans-serif"
  }
];

export interface SettingsModalCallbacks {
  onThemeChange: (themeId: string) => void;
  onFontChange: (fontId: string) => void;
}

export class SettingsModal {
  private container: HTMLElement;
  private callbacks: SettingsModalCallbacks;
  private currentTheme: string;
  private currentFont: string;
  private activeTab: 'themes' | 'fonts' = 'themes';

  constructor(containerId: string, callbacks: SettingsModalCallbacks) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Settings modal container #${containerId} not found`);
    this.container = el;
    this.callbacks = callbacks;

    this.currentTheme = localStorage.getItem('termgraph_theme') || 'dark';
    this.currentFont = localStorage.getItem('termgraph_font_pack') || 'oswald-inter';

    this.applyTheme(this.currentTheme, false);
    this.applyFont(this.currentFont, false);

    this.bindGlobalEvents();
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

  public applyTheme(themeId: string, triggerCallback = true): void {
    this.currentTheme = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('termgraph_theme', themeId);
    if (triggerCallback) {
      this.callbacks.onThemeChange(themeId);
    }
  }

  public applyFont(fontId: string, triggerCallback = true): void {
    this.currentFont = fontId;
    document.documentElement.setAttribute('data-font', fontId);
    localStorage.setItem('termgraph_font_pack', fontId);
    if (triggerCallback) {
      this.callbacks.onFontChange(fontId);
    }
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
    const themeCardsHtml = THEME_OPTIONS.map(theme => {
      const isSelected = theme.id === this.currentTheme;
      return `
        <div class="preset-card theme-option-card ${isSelected ? 'active-preset' : ''}" data-theme-id="${theme.id}">
          <div class="theme-swatch-box" style="background-color: ${theme.bgPreview}; border: 1.5px solid ${theme.borderPreview};">
            <div class="theme-swatch-inner" style="background-color: ${theme.cardPreview}; border: 1px solid ${theme.borderPreview};">
              <span class="theme-swatch-dot" style="background-color: ${theme.textPreview};"></span>
            </div>
          </div>
          <div class="preset-info">
            <div class="preset-header-row">
              <h3>${theme.name}</h3>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const fontCardsHtml = FONT_OPTIONS.map(font => {
      const isSelected = font.id === this.currentFont;
      return `
        <div class="preset-card font-option-card ${isSelected ? 'active-preset' : ''}" data-font-id="${font.id}">
          <div class="preset-header-row">
            <h3 style="font-family: ${font.headingFont}; font-size: 14px;">${font.name}</h3>
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="modal-dialog settings-modal-dialog">
        <div class="modal-header">
          <div class="modal-title-group">
            <h2 class="modal-title">Settings</h2>
          </div>
          <button class="modal-close-btn" id="settings-close-btn">✕</button>
        </div>

        <div class="modal-tabs">
          <button class="tab-btn ${this.activeTab === 'themes' ? 'active' : ''}" data-settings-tab="themes">Color Themes (${THEME_OPTIONS.length})</button>
          <button class="tab-btn ${this.activeTab === 'fonts' ? 'active' : ''}" data-settings-tab="fonts">Font Packs (${FONT_OPTIONS.length})</button>
        </div>

        <div class="modal-body settings-modal-body">
          <!-- Themes Tab -->
          <div class="tab-content ${this.activeTab === 'themes' ? 'active' : ''}" id="settings-tab-themes">
            <div class="themes-grid">
              ${themeCardsHtml}
            </div>
          </div>

          <!-- Fonts Tab -->
          <div class="tab-content ${this.activeTab === 'fonts' ? 'active' : ''}" id="settings-tab-fonts">
            <div class="fonts-grid">
              ${fontCardsHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindInteractions();
  }

  private bindInteractions(): void {
    // Close button
    this.container.querySelector('#settings-close-btn')?.addEventListener('click', () => this.close());

    // Tab switching
    const tabs = this.container.querySelectorAll<HTMLButtonElement>('.modal-tabs .tab-btn');
    const contents = this.container.querySelectorAll<HTMLElement>('.settings-modal-body .tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const tabKey = (tab.getAttribute('data-settings-tab') as 'themes' | 'fonts') || 'themes';
        this.activeTab = tabKey;
        const targetContent = this.container.querySelector<HTMLElement>(`#settings-tab-${tabKey}`);
        targetContent?.classList.add('active');
      });
    });

    // Theme selection: update active class in-place without re-rendering or tab switching
    this.container.querySelectorAll<HTMLElement>('.theme-option-card').forEach(card => {
      card.addEventListener('click', () => {
        const themeId = card.getAttribute('data-theme-id');
        if (themeId) {
          this.applyTheme(themeId, true);
          this.container.querySelectorAll<HTMLElement>('.theme-option-card').forEach(c => {
            c.classList.toggle('active-preset', c.getAttribute('data-theme-id') === themeId);
          });
        }
      });
    });

    // Font selection: update active class in-place without re-rendering or tab switching
    this.container.querySelectorAll<HTMLElement>('.font-option-card').forEach(card => {
      card.addEventListener('click', () => {
        const fontId = card.getAttribute('data-font-id');
        if (fontId) {
          this.applyFont(fontId, true);
          this.container.querySelectorAll<HTMLElement>('.font-option-card').forEach(c => {
            c.classList.toggle('active-preset', c.getAttribute('data-font-id') === fontId);
          });
        }
      });
    });
  }
}
