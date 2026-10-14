import { KnowledgeNode } from './types';
import { initialKnowledgeBase } from './demo-data';

const STORAGE_KEY = 'termgraph_kb_data_v1';
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Loads the permanent knowledge base from the disk API (/api/data -> data/knowledge-base.json).
 * This ensures identical, synchronized data across ALL browsers and sessions.
 */
export async function fetchServerKnowledgeBase(): Promise<KnowledgeNode | null> {
  try {
    const res = await fetch('/api/data', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.name === 'string') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (_) {}
        return data;
      }
    }
  } catch (err) {
    console.info('Server API not reachable, falling back to local copy', err);
  }
  return null;
}

/**
 * Synchronous initial load so the graph renders with zero flicker on page load.
 */
export function loadKnowledgeBase(): KnowledgeNode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.name === 'string') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load from local storage mirror', err);
  }
  return JSON.parse(JSON.stringify(initialKnowledgeBase));
}

/**
 * Permanently saves the tree to disk via POST /api/data (data/knowledge-base.json)
 * and maintains an instant local mirror for instantaneous feedback.
 */
export function saveKnowledgeBase(data: KnowledgeNode): void {
  // 1. Instant local mirror
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}

  // 2. Debounced permanent write to data/knowledge-base.json on disk
  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(async () => {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('termgraph:saved-to-disk', { detail: { ok: true } }));
      }
    } catch (err) {
      console.warn('Could not save to /api/data on disk', err);
      window.dispatchEvent(new CustomEvent('termgraph:saved-to-disk', { detail: { ok: false } }));
    }
  }, 120);
}

export interface NodeSearchResult {
  node: KnowledgeNode | null;
  parent: KnowledgeNode | null;
  index: number;
  path: KnowledgeNode[];
}

export function findNode(root: KnowledgeNode, targetId: string): NodeSearchResult {
  function search(
    current: KnowledgeNode,
    parent: KnowledgeNode | null,
    index: number,
    currentPath: KnowledgeNode[]
  ): NodeSearchResult | null {
    const nextPath = [...currentPath, current];
    if (current.id === targetId) {
      return { node: current, parent, index, path: nextPath };
    }
    if (current.children && current.children.length > 0) {
      for (let i = 0; i < current.children.length; i++) {
        const found = search(current.children[i], current, i, nextPath);
        if (found) return found;
      }
    }
    return null;
  }

  const result = search(root, null, 0, []);
  return result || { node: null, parent: null, index: -1, path: [] };
}

export function addChildNode(
  root: KnowledgeNode,
  parentId: string,
  newNodeData?: Partial<KnowledgeNode>
): { root: KnowledgeNode; newNode: KnowledgeNode } {
  const clonedRoot: KnowledgeNode = JSON.parse(JSON.stringify(root));
  const { node: parent } = findNode(clonedRoot, parentId);

  const newNode: KnowledgeNode = {
    id: 'node-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
    name: newNodeData?.name || 'New Sub-Term',
    description: newNodeData?.description || 'Add a clear description for this term...',
    children: []
  };

  if (parent) {
    if (!parent.children) parent.children = [];
    parent.children.push(newNode);
    parent.collapsed = false; // ensure parent is expanded to see child
  }

  return { root: clonedRoot, newNode };
}

export function addSiblingNode(
  root: KnowledgeNode,
  targetId: string
): { root: KnowledgeNode; newNode: KnowledgeNode | null } {
  const clonedRoot: KnowledgeNode = JSON.parse(JSON.stringify(root));
  const { parent } = findNode(clonedRoot, targetId);

  if (!parent) {
    return { root: clonedRoot, newNode: null }; // Cannot add sibling to root
  }

  const newNode: KnowledgeNode = {
    id: 'node-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
    name: 'New Sibling Term',
    description: 'Add a clear description for this term...',
    children: []
  };

  if (!parent.children) parent.children = [];
  parent.children.push(newNode);

  return { root: clonedRoot, newNode };
}

export function deleteNode(
  root: KnowledgeNode,
  targetId: string
): { root: KnowledgeNode; success: boolean } {
  if (root.id === targetId) {
    return { root, success: false }; // Cannot delete root
  }

  const clonedRoot: KnowledgeNode = JSON.parse(JSON.stringify(root));
  const { parent, index } = findNode(clonedRoot, targetId);

  if (parent && parent.children && index >= 0) {
    parent.children.splice(index, 1);
    return { root: clonedRoot, success: true };
  }

  return { root: clonedRoot, success: false };
}

export function updateNode(
  root: KnowledgeNode,
  targetId: string,
  updates: Partial<KnowledgeNode>
): KnowledgeNode {
  const clonedRoot: KnowledgeNode = JSON.parse(JSON.stringify(root));
  const { node } = findNode(clonedRoot, targetId);

  if (node) {
    Object.assign(node, updates);
  }

  return clonedRoot;
}

export function toggleCollapse(root: KnowledgeNode, targetId: string): KnowledgeNode {
  const clonedRoot: KnowledgeNode = JSON.parse(JSON.stringify(root));
  const { node } = findNode(clonedRoot, targetId);

  if (node && node.children && node.children.length > 0) {
    node.collapsed = !node.collapsed;
  }

  return clonedRoot;
}

export function setAllCollapsed(root: KnowledgeNode, collapsed: boolean): KnowledgeNode {
  const clonedRoot: KnowledgeNode = JSON.parse(JSON.stringify(root));

  function walk(node: KnowledgeNode, isRoot: boolean) {
    if (!isRoot && node.children && node.children.length > 0) {
      node.collapsed = collapsed;
    }
    if (node.children) {
      node.children.forEach(c => walk(c, false));
    }
  }

  walk(clonedRoot, true);
  return clonedRoot;
}

export function hasAnyCollapsedBranch(node: KnowledgeNode, isRoot = true): boolean {
  if (!isRoot && node.collapsed && node.children && node.children.length > 0) {
    return true;
  }
  if (node.children) {
    for (const child of node.children) {
      if (hasAnyCollapsedBranch(child, false)) return true;
    }
  }
  return false;
}

export function countTotalNodes(node: KnowledgeNode): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countTotalNodes(child);
    }
  }
  return count;
}

export function getMaxDepth(node: KnowledgeNode, currentDepth = 1): number {
  if (!node.children || node.children.length === 0) return currentDepth;
  let max = currentDepth;
  for (const child of node.children) {
    const depth = getMaxDepth(child, currentDepth + 1);
    if (depth > max) max = depth;
  }
  return max;
}

// Export / Import helpers
export function exportToJsonString(root: KnowledgeNode): string {
  return JSON.stringify(root, null, 2);
}

export function exportToMarkdown(root: KnowledgeNode): string {
  const lines: string[] = [];

  function walk(node: KnowledgeNode, depth: number) {
    const prefix = '#'.repeat(Math.min(depth, 6));
    lines.push(`${prefix} ${node.name}`);
    if (node.description && node.description.trim()) {
      lines.push('');
      lines.push(node.description.trim());
      lines.push('');
    }
    if (node.children) {
      for (const child of node.children) {
        walk(child, depth + 1);
      }
    }
  }

  walk(root, 1);
  return lines.join('\n');
}

export function importFromMarkdown(md: string): KnowledgeNode {
  const lines = md.split(/\r?\n/);
  let root: KnowledgeNode | null = null;
  const stack: { node: KnowledgeNode; level: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(#{1,6})\s+(.*)$/);

    if (match) {
      const level = match[1].length;
      const title = match[2].trim();

      // Collect description text following this heading until next heading
      const descLines: string[] = [];
      while (i + 1 < lines.length && !lines[i + 1].match(/^#{1,6}\s+/)) {
        i++;
        descLines.push(lines[i]);
      }

      const description = descLines.join('\n').trim();

      const newNode: KnowledgeNode = {
        id: 'node-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
        name: title,
        description: description || 'No description provided.',
        children: []
      };

      if (!root) {
        root = newNode;
        stack.push({ node: newNode, level });
      } else {
        // Find parent with level < current level
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        const parent = stack.length > 0 ? stack[stack.length - 1].node : root;
        if (!parent.children) parent.children = [];
        parent.children.push(newNode);
        stack.push({ node: newNode, level });
      }
    }
  }

  if (!root) {
    throw new Error('No markdown headings found (e.g. # Title, ## Subtitle)');
  }

  return root;
}
