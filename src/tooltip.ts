export class Tooltip {
  private element: HTMLElement;
  private isVisible = false;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'term-tooltip';
    this.element.style.display = 'none';
    document.body.appendChild(this.element);
  }

  public show(title: string, description: string, x: number, y: number): void {
    const cleanDesc = description.trim() || 'No description provided.';
    const snippet = cleanDesc.length > 220 ? cleanDesc.slice(0, 220) + '...' : cleanDesc;

    this.element.innerHTML = `
      <div class="tooltip-title">${this.escapeHtml(title)}</div>
      ${snippet ? `<div class="tooltip-desc">${this.escapeHtml(snippet)}</div>` : ''}
    `;

    this.element.style.display = 'block';
    this.isVisible = true;
    this.updatePosition(x, y);
  }

  public updatePosition(x: number, y: number): void {
    if (!this.isVisible) return;

    const offset = 14;
    let posX = x + offset;
    let posY = y + offset;

    const rect = this.element.getBoundingClientRect();
    const padding = 12;

    // Prevent overflow right
    if (posX + rect.width + padding > window.innerWidth) {
      posX = x - rect.width - offset;
    }

    // Prevent overflow bottom
    if (posY + rect.height + padding > window.innerHeight) {
      posY = y - rect.height - offset;
    }

    // Ensure within top-left viewport
    if (posX < padding) posX = padding;
    if (posY < padding) posY = padding;

    this.element.style.left = `${posX}px`;
    this.element.style.top = `${posY}px`;
  }

  public hide(): void {
    if (!this.isVisible) return;
    this.element.style.display = 'none';
    this.isVisible = false;
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
