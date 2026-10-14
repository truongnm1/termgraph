import { KnowledgeNode, HierarchyPointNode, OrthogonalLink, GraphLayoutResult } from './types';

export interface NodeDimensions {
  width: number;
  height: number;
  fontSize: number;
}

export const MIN_NODE_WIDTH = 135;
export const MAX_NODE_WIDTH = 340;
export const MIN_NODE_HEIGHT = 56;
export const MAX_NODE_HEIGHT = 104;
export const HORIZONTAL_GAP = 40;
export const VERTICAL_ROW_GAP = 72;

export function calculateNodeDimensions(title: string): NodeDimensions {
  const cleanTitle = (title || 'UNTITLED').trim();
  const len = cleanTitle.length;

  if (len <= 5) {
    return { width: 135, height: 56, fontSize: 30 };
  }
  if (len <= 8) {
    return { width: 165, height: 56, fontSize: 27 };
  }
  if (len <= 14) {
    return { width: 215, height: 60, fontSize: 24 };
  }
  if (len <= 22) {
    return { width: 260, height: 68, fontSize: 21 };
  }
  if (len <= 35) {
    return { width: 300, height: 80, fontSize: 18 };
  }
  return { width: MAX_NODE_WIDTH, height: MAX_NODE_HEIGHT, fontSize: 15 };
}

interface InternalLayoutNode {
  data: KnowledgeNode;
  width: number;
  height: number;
  fontSize: number;
  depth: number;
  parent: InternalLayoutNode | null;
  children: InternalLayoutNode[];
  relX: number;
  absX: number;
  absY: number;
  top: number;
  bottom: number;
  contour: [number, number][]; // relative [minX, maxX] at each relative depth
}

/**
 * Clean, symmetric tree layout engine:
 * 1. Bottom-up subtree layout with symmetric child positioning:
 *    - For odd number of children: center child is EXACTLY aligned at parent X (zero jog!).
 *    - For even number of children: children are balanced symmetrically around parent X.
 *    - Outer siblings are placed symmetrically so the graph never looks crooked.
 * 2. Top-aligned rows: all cards on the same hierarchical depth have their top edge aligned.
 * 3. Orthogonal link routing:
 *    - Center child (same X as parent) gets a direct straight vertical line: M cx parentBottom V childTop.
 *    - Side children branch cleanly via a unified horizontal crossbar: M parentCX parentBottom V busY H childCX V childTop.
 */
export function computeTreeLayout(rootData: KnowledgeNode): GraphLayoutResult {
  // 1. Build internal tree representation (pruning collapsed branches)
  let maxDepth = 0;
  const maxHeightByDepth: Record<number, number> = {};

  function buildTree(data: KnowledgeNode, depth = 0, parent: InternalLayoutNode | null = null): InternalLayoutNode {
    if (depth > maxDepth) maxDepth = depth;
    const dims = calculateNodeDimensions(data.name);
    maxHeightByDepth[depth] = Math.max(maxHeightByDepth[depth] || 0, dims.height);

    const node: InternalLayoutNode = {
      data,
      width: dims.width,
      height: dims.height,
      fontSize: dims.fontSize,
      depth,
      parent,
      children: [],
      relX: 0,
      absX: 0,
      absY: 0,
      top: 0,
      bottom: 0,
      contour: [[-dims.width / 2, dims.width / 2]]
    };

    if (!data.collapsed && data.children && data.children.length > 0) {
      node.children = data.children.map(childData => buildTree(childData, depth + 1, node));
    }

    return node;
  }

  const root = buildTree(rootData);

  // 2. Bottom-up post-order layout: compute relative X coordinates and subtree contours
  function layoutSubtree(node: InternalLayoutNode): void {
    if (node.children.length === 0) {
      node.relX = 0;
      node.contour = [[-node.width / 2, node.width / 2]];
      return;
    }

    // Layout children first
    node.children.forEach(layoutSubtree);

    const n = node.children.length;
    // Compute minimum required distance between each adjacent child pair
    const neededDist: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const leftChild = node.children[i];
      const rightChild = node.children[i + 1];

      // Minimum gap between the two boxes directly
      let dist = (leftChild.width + rightChild.width) / 2 + HORIZONTAL_GAP;

      // Check contour overlap at all descendant depths
      const commonDepths = Math.min(leftChild.contour.length, rightChild.contour.length);
      for (let d = 0; d < commonDepths; d++) {
        const leftRightEdge = leftChild.contour[d][1];
        const rightLeftEdge = rightChild.contour[d][0];
        const overlap = (leftRightEdge - rightLeftEdge) + HORIZONTAL_GAP;
        if (overlap > dist) dist = overlap;
      }
      neededDist.push(dist);
    }

    // Position children symmetrically around parent center (0)
    const xs = new Array<number>(n);
    if (n === 1) {
      xs[0] = 0;
    } else if (n % 2 === 1) {
      // ODD: The middle child is placed at EXACTLY 0 (directly beneath parent)
      const m = Math.floor(n / 2);
      xs[m] = 0;
      for (let k = 1; k <= m; k++) {
        const leftDist = neededDist[m - k];
        const rightDist = neededDist[m + k - 1];
        const step = Math.max(leftDist, rightDist);
        xs[m - k] = xs[m - k + 1] - step;
        xs[m + k] = xs[m + k - 1] + step;
      }
    } else {
      // EVEN: The two center children are placed symmetrically around 0
      const mLeft = n / 2 - 1;
      const mRight = n / 2;
      const centerDist = neededDist[mLeft];
      xs[mLeft] = -centerDist / 2;
      xs[mRight] = centerDist / 2;
      for (let k = 1; mLeft - k >= 0; k++) {
        const leftDist = neededDist[mLeft - k];
        const rightDist = neededDist[mRight + k - 1];
        const step = Math.max(leftDist, rightDist);
        xs[mLeft - k] = xs[mLeft - k + 1] - step;
        xs[mRight + k] = xs[mRight + k - 1] + step;
      }
    }

    for (let i = 0; i < n; i++) {
      node.children[i].relX = xs[i];
    }

    // Compute merged contour for this node
    const contour: [number, number][] = [[-node.width / 2, node.width / 2]];
    let maxChildDepth = 0;
    node.children.forEach(c => {
      if (c.contour.length > maxChildDepth) maxChildDepth = c.contour.length;
    });

    for (let d = 0; d < maxChildDepth; d++) {
      let minX = Infinity;
      let maxX = -Infinity;
      for (let i = 0; i < n; i++) {
        const c = node.children[i];
        if (d < c.contour.length) {
          const l = xs[i] + c.contour[d][0];
          const r = xs[i] + c.contour[d][1];
          if (l < minX) minX = l;
          if (r > maxX) maxX = r;
        }
      }
      contour.push([minX, maxX]);
    }
    node.contour = contour;
  }

  layoutSubtree(root);

  // 3. Compute top-aligned row levels
  const rowTop: Record<number, number> = { 0: 0 };
  for (let depth = 1; depth <= maxDepth; depth++) {
    const prevTallest = maxHeightByDepth[depth - 1] || MIN_NODE_HEIGHT;
    rowTop[depth] = rowTop[depth - 1] + prevTallest + VERTICAL_ROW_GAP;
  }

  // 4. Assign absolute coordinates and collect all nodes
  const nodes: HierarchyPointNode[] = [];
  const nodeMap = new Map<string, HierarchyPointNode>();

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  function assignPositions(node: InternalLayoutNode, parentAbsX = 0): void {
    node.absX = parentAbsX + node.relX;
    node.top = rowTop[node.depth];
    node.bottom = node.top + node.height;
    node.absY = node.top + node.height / 2;

    const left = node.absX - node.width / 2;
    const right = node.absX + node.width / 2;
    if (left < minX) minX = left;
    if (right > maxX) maxX = right;
    if (node.top < minY) minY = node.top;
    if (node.bottom > maxY) maxY = node.bottom;

    const ptNode: HierarchyPointNode = {
      id: node.data.id,
      data: node.data,
      x: node.absX,
      y: node.absY,
      width: node.width,
      height: node.height,
      fontSize: node.fontSize,
      depth: node.depth,
      parent: null,
      children: undefined
    };

    nodeMap.set(node.data.id, ptNode);
    nodes.push(ptNode);

    node.children.forEach(c => assignPositions(c, node.absX));
  }

  assignPositions(root, 0);

  // Connect parent and children references
  function wireReferences(node: InternalLayoutNode): void {
    const pt = nodeMap.get(node.data.id);
    if (pt) {
      if (node.parent) {
        pt.parent = nodeMap.get(node.parent.data.id) || null;
      }
      if (node.children.length > 0) {
        pt.children = node.children.map(c => nodeMap.get(c.data.id)!);
      }
    }
    node.children.forEach(wireReferences);
  }

  wireReferences(root);

  // 5. Build clean orthogonal links
  const links: OrthogonalLink[] = [];

  function buildLinks(parent: InternalLayoutNode): void {
    if (parent.children.length === 0) return;

    const parentCX = Math.round(parent.absX);
    const parentBottomY = Math.round(parent.bottom);
    const childRowTop = Math.round(rowTop[parent.depth + 1]);
    const busY = Math.round((parentBottomY + childRowTop) / 2);
    const parentPt = nodeMap.get(parent.data.id)!;

    // Single child case
    if (parent.children.length === 1) {
      const child = parent.children[0];
      const childCX = Math.round(child.absX);
      const childTopY = Math.round(child.top);
      const childPt = nodeMap.get(child.data.id)!;

      const pathD = Math.abs(childCX - parentCX) < 1
        ? `M ${parentCX} ${parentBottomY} V ${childTopY}`
        : `M ${parentCX} ${parentBottomY} V ${busY} H ${childCX} V ${childTopY}`;

      links.push({
        id: `link-${parent.data.id}-${child.data.id}`,
        source: parentPt,
        target: childPt,
        d: pathD
      });

      buildLinks(child);
      return;
    }

    // Multiple children:
    // To ensure ZERO overlapping strokes (which causes stacked lines to appear 2x-3x bolder when zooming out):
    // 1. One parent stem down to busY + one horizontal crossbar from min(childX) to max(childX) (drawn ONCE)
    // 2. Individual vertical drop stems from busY down into each child (drawn ONCE)
    const allChildX = parent.children.map(c => Math.round(c.absX));
    const minChildX = Math.min(...allChildX);
    const maxChildX = Math.max(...allChildX);

    // Parent stem + unified crossbar (drawn exactly once)
    const busD = `M ${parentCX} ${parentBottomY} V ${busY} M ${minChildX} ${busY} H ${maxChildX}`;
    links.push({
      id: `bus-${parent.data.id}`,
      source: parentPt,
      target: parentPt,
      d: busD
    });

    // Individual child drop stems from busY down into each child (drawn exactly once)
    parent.children.forEach((child, idx) => {
      const childCX = Math.round(child.absX);
      const childTopY = Math.round(child.top);
      const childPt = nodeMap.get(child.data.id)!;

      links.push({
        id: `drop-${parent.data.id}-${child.data.id}-${idx}`,
        source: parentPt,
        target: childPt,
        d: `M ${childCX} ${busY} V ${childTopY}`
      });

      buildLinks(child);
    });
  }

  buildLinks(root);

  return {
    nodes,
    links,
    bounds: {
      minX: Number.isFinite(minX) ? minX : 0,
      maxX: Number.isFinite(maxX) ? maxX : 0,
      minY: Number.isFinite(minY) ? minY : 0,
      maxY: Number.isFinite(maxY) ? maxY : 0,
      width: Number.isFinite(maxX - minX) ? maxX - minX : 0,
      height: Number.isFinite(maxY - minY) ? maxY - minY : 0
    }
  };
}
