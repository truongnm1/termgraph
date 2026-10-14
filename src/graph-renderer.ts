import { KnowledgeNode, HierarchyPointNode, ViewportTransform } from './types';
import { computeTreeLayout, MIN_NODE_WIDTH, MIN_NODE_HEIGHT } from './layout';

export interface GraphRendererCallbacks {
  onNodeClick: (nodeId: string) => void;
  onNodeDoubleClick: (nodeId: string) => void;
  onCanvasClick?: () => void;
  onNodeHover: (node: KnowledgeNode, clientX: number, clientY: number) => void;
  onNodeHoverMove: (clientX: number, clientY: number) => void;
  onNodeHoverEnd: () => void;
  onAddChildQuick: (parentId: string) => void;
  onAddSiblingQuick: (nodeId: string) => void;
  onToggleCollapse: (nodeId: string) => void;
}

export class GraphRenderer {
  private svg: SVGSVGElement;
  private viewportG: SVGGElement;
  private linksG: SVGGElement;
  private nodesG: SVGGElement;
  private callbacks: GraphRendererCallbacks;

  private currentData: KnowledgeNode | null = null;
  private selectedNodeId: string | null = null;
  private currentNodes: HierarchyPointNode[] = [];

  // Viewport Pan/Zoom state
  private transform: ViewportTransform = { x: 0, y: 0, scale: 1 };
  private isPanning = false;
  private didPan = false;
  private startPoint = { x: 0, y: 0 };
  private startTransform = { x: 0, y: 0 };

  constructor(svgId: string, callbacks: GraphRendererCallbacks) {
    const el = document.getElementById(svgId) as unknown as SVGSVGElement;
    if (!el) throw new Error(`SVG element #${svgId} not found`);
    this.svg = el;
    this.callbacks = callbacks;

    // Viewport group
    this.viewportG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.viewportG.setAttribute('class', 'viewport-layer');

    this.linksG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.linksG.setAttribute('class', 'links-layer');

    this.nodesG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.nodesG.setAttribute('class', 'nodes-layer');

    this.viewportG.appendChild(this.linksG);
    this.viewportG.appendChild(this.nodesG);
    this.svg.appendChild(this.viewportG);

    this.bindEvents();
  }

  public setData(data: KnowledgeNode, preserveView = true): void {
    this.currentData = data;
    this.render();

    if (!preserveView || (this.transform.x === 0 && this.transform.y === 0)) {
      this.fitToScreen();
    }
  }

  public setSelectedNode(nodeId: string | null): void {
    this.selectedNodeId = nodeId;
    const nodeElements = this.nodesG.querySelectorAll('.graph-node');
    nodeElements.forEach(el => {
      const id = el.getAttribute('data-id');
      if (id === nodeId) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  public render(): void {
    if (!this.currentData) return;

    const layout = computeTreeLayout(this.currentData);
    this.currentNodes = layout.nodes;

    // 1. Render Orthogonal Links (stem down -> crossbar -> stem to child)
    let linksHtml = '';
    for (const link of layout.links) {
      linksHtml += `<path class="tree-link" d="${link.d}" />`;
    }
    this.linksG.innerHTML = linksHtml;

    // 2. Render Node Cards: Dynamic box size per title length, Name ONLY
    let nodesHtml = '';

    for (const node of layout.nodes) {
      const isSelected = node.id === this.selectedNodeId;
      const isRoot = !node.parent;
      const title = this.escape(node.data.name);
      const halfW = node.width / 2;
      const halfH = node.height / 2;

      nodesHtml += `
        <g class="graph-node ${isSelected ? 'selected' : ''} ${isRoot ? 'root-node' : ''}"
           data-id="${node.id}"
           transform="translate(${node.x}, ${node.y})">
          
          <!-- Card Body: Dynamic width & height based on title length -->
          <rect class="node-rect"
                x="${-halfW}" y="${-halfH}"
                width="${node.width}" height="${node.height}"
                rx="0" ry="0" />

          <!-- Name ONLY in the node (smart multi-line carriage return & auto-scaled) -->
          <foreignObject x="${-halfW + 8}" y="${-halfH + 4}" width="${node.width - 16}" height="${node.height - 8}">
            <div xmlns="http://www.w3.org/1999/xhtml" class="node-title-container" style="font-size: ${node.fontSize}px;">
              ${title}
            </div>
          </foreignObject>
        </g>
      `;
    }

    this.nodesG.innerHTML = nodesHtml;
    this.bindNodeInteractions();
  }

  private bindNodeInteractions(): void {
    const nodeGroups = this.nodesG.querySelectorAll<SVGGElement>('.graph-node');

    nodeGroups.forEach(group => {
      const id = group.getAttribute('data-id');
      if (!id) return;

      const ptNode = this.currentNodes.find(n => n.id === id);

      // Stop pointerdown from bubbling to SVG canvas panning
      group.addEventListener('pointerdown', (e: Event) => {
        e.stopPropagation();
      });

      // Node Click (immediately opens right detail sidebar without moving canvas)
      group.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        this.callbacks.onNodeClick(id);
      });

      // Node Double-Click (immediately focuses on name changing without moving cursor to panel)
      group.addEventListener('dblclick', (e: Event) => {
        e.stopPropagation();
        this.callbacks.onNodeDoubleClick(id);
      });

      // Node Hover (cursor hint box)
      group.addEventListener('mouseenter', ((e: MouseEvent) => {
        if (ptNode) {
          this.callbacks.onNodeHover(ptNode.data, e.clientX, e.clientY);
        }
      }) as EventListener);

      group.addEventListener('mousemove', ((e: MouseEvent) => {
        this.callbacks.onNodeHoverMove(e.clientX, e.clientY);
      }) as EventListener);

      group.addEventListener('mouseleave', () => {
        this.callbacks.onNodeHoverEnd();
      });
    });
  }

  private bindEvents(): void {
    // 1. Panning canvas background via pointer events
    this.svg.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0 && e.button !== 1) return;

      const target = e.target as HTMLElement;
      // If clicking directly on a node or button, do NOT initiate canvas pan
      if (target.closest('.graph-node') || target.closest('.quick-add-btn')) {
        return;
      }

      this.isPanning = true;
      this.didPan = false;
      this.startPoint = { x: e.clientX, y: e.clientY };
      this.startTransform = { x: this.transform.x, y: this.transform.y };
      this.svg.setPointerCapture(e.pointerId);
      this.svg.classList.add('panning');
    });

    this.svg.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isPanning) return;

      const dx = e.clientX - this.startPoint.x;
      const dy = e.clientY - this.startPoint.y;

      if (Math.hypot(dx, dy) > 3) {
        this.didPan = true;
      }

      this.transform.x = this.startTransform.x + dx;
      this.transform.y = this.startTransform.y + dy;
      this.applyTransform();
    });

    const stopPan = (e: PointerEvent) => {
      if (this.isPanning) {
        this.isPanning = false;
        try {
          this.svg.releasePointerCapture(e.pointerId);
        } catch (_) {}
        this.svg.classList.remove('panning');

        const dist = Math.hypot(e.clientX - this.startPoint.x, e.clientY - this.startPoint.y);
        // Only trigger canvas click if there was truly zero/negligible pan movement
        if (!this.didPan && dist < 4) {
          this.callbacks.onCanvasClick?.();
        }

        // Keep didPan active briefly to swallow trailing native click event
        if (this.didPan) {
          setTimeout(() => {
            this.didPan = false;
          }, 100);
        }
      }
    };

    this.svg.addEventListener('pointerup', stopPan);
    this.svg.addEventListener('pointercancel', stopPan);

    // Capture-phase click interceptor on SVG: kill click event if user was panning
    this.svg.addEventListener(
      'click',
      (e: MouseEvent) => {
        if (this.didPan) {
          e.stopPropagation();
          e.stopImmediatePropagation();
          e.preventDefault();
          this.didPan = false;
        }
      },
      true // capture phase: runs before any other handlers or bubbling
    );

    // 2. Mouse Wheel Zoom centered on cursor
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest('.modal-dialog') ||
        target?.closest('#right-sidebar') ||
        target?.closest('.search-dropdown')
      ) {
        return;
      }

      e.preventDefault();

      if (Math.abs(e.deltaY) < 0.1) return;

      const rect = this.svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomDelta = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const oldScale = this.transform.scale;
      const newScale = Math.min(Math.max(oldScale * zoomDelta, 0.12), 3.5);

      if (newScale === oldScale) return;

      this.transform.x = mouseX - ((mouseX - this.transform.x) / oldScale) * newScale;
      this.transform.y = mouseY - ((mouseY - this.transform.y) / oldScale) * newScale;
      this.transform.scale = newScale;

      this.applyTransform();
    };

    this.svg.addEventListener('wheel', handleWheel, { passive: false });
    this.svg.parentElement?.addEventListener('wheel', handleWheel, { passive: false });

    window.addEventListener('resize', () => {
      this.applyTransform();
    });
  }

  public applyTransform(): void {
    this.viewportG.setAttribute(
      'transform',
      `translate(${this.transform.x}, ${this.transform.y}) scale(${this.transform.scale})`
    );

    const readout = document.getElementById('zoom-readout');
    if (readout) {
      readout.textContent = `${Math.round(this.transform.scale * 100)}%`;
    }
  }

  public zoomIn(): void {
    this.zoomBy(1.2);
  }

  public zoomOut(): void {
    this.zoomBy(1 / 1.2);
  }

  public resetZoom(): void {
    this.transform.scale = 1;
    this.applyTransform();
  }

  private zoomBy(factor: number): void {
    const rect = this.svg.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const oldScale = this.transform.scale;
    const newScale = Math.min(Math.max(oldScale * factor, 0.12), 3.5);

    this.transform.x = centerX - ((centerX - this.transform.x) / oldScale) * newScale;
    this.transform.y = centerY - ((centerY - this.transform.y) / oldScale) * newScale;
    this.transform.scale = newScale;
    this.applyTransform();
  }

  public fitToScreen(): void {
    if (!this.currentData || this.currentNodes.length === 0) return;

    const layout = computeTreeLayout(this.currentData);
    const bounds = layout.bounds;
    const rect = this.svg.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) return;

    const padding = 50;
    const rightSidebar = document.getElementById('right-sidebar');
    const isPanelOpen = rightSidebar?.classList.contains('open');
    const rightPanelW = isPanelOpen && window.innerWidth > 900 ? 380 : 0;
    const availableW = rect.width - padding * 2 - rightPanelW;
    const availableH = rect.height - padding * 2;

    const graphW = bounds.width || MIN_NODE_WIDTH;
    const graphH = bounds.height || MIN_NODE_HEIGHT;

    const scaleX = availableW / graphW;
    const scaleY = availableH / graphH;
    const targetScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.15);

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    this.transform.scale = targetScale;
    this.transform.x = (rect.width - rightPanelW) / 2 - centerX * targetScale;
    this.transform.y = rect.height / 2 - centerY * targetScale;

    this.applyTransform();
  }

  public centerNode(nodeId: string): void {
    const node = this.currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = this.svg.getBoundingClientRect();
    const targetScale = Math.max(this.transform.scale, 0.9);

    this.transform.scale = targetScale;
    const sidebarOffset = window.innerWidth > 768 ? -180 : 0;
    this.transform.x = rect.width / 2 - node.x * targetScale + sidebarOffset;
    this.transform.y = rect.height / 2 - node.y * targetScale;

    this.applyTransform();
  }

  public getNodes(): HierarchyPointNode[] {
    return this.currentNodes;
  }

  private escape(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
