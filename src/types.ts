export interface KnowledgeNode {
  id: string;
  name: string;
  description: string;
  hasIpo?: boolean;
  inputs?: string;
  processing?: string;
  outputs?: string;
  example?: string;
  children?: KnowledgeNode[];
  collapsed?: boolean;
  color?: string;
}

export interface HierarchyPointNode {
  id: string;
  data: KnowledgeNode;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  depth: number;
  parent?: HierarchyPointNode | null;
  children?: HierarchyPointNode[];
}

export interface OrthogonalLink {
  id: string;
  source: HierarchyPointNode;
  target: HierarchyPointNode;
  d: string;
}

export interface GraphLayoutResult {
  nodes: HierarchyPointNode[];
  links: OrthogonalLink[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
}

export interface ViewportTransform {
  x: number;
  y: number;
  scale: number;
}
