import { KnowledgeNode } from './types';

export interface HistoryState {
  data: KnowledgeNode;
  selectedNodeId: string | null;
}

export type HistoryChangeCallback = (canUndo: boolean, canRedo: boolean) => void;

/**
 * Lightweight, memory-bounded History Manager.
 * Uses compact serialized snapshots (max 25 entries) so RAM overhead remains < 300KB.
 */
export class HistoryManager {
  private undoStack: string[] = [];
  private undoMeta: (string | null)[] = [];
  private redoStack: string[] = [];
  private redoMeta: (string | null)[] = [];
  private maxStack: number = 25;

  private isEditingText: boolean = false;
  private textEditTimer: number | null = null;
  private preTextSnapshot: string | null = null;
  private preTextSelectedId: string | null = null;

  private onChangeCallback: HistoryChangeCallback | null = null;

  constructor(maxStack = 25, onChange?: HistoryChangeCallback) {
    this.maxStack = maxStack;
    if (onChange) {
      this.onChangeCallback = onChange;
    }
  }

  public setOnChange(cb: HistoryChangeCallback): void {
    this.onChangeCallback = cb;
    this.notify();
  }

  private notify(): void {
    if (this.onChangeCallback) {
      this.onChangeCallback(this.canUndo(), this.canRedo());
    }
  }

  /**
   * Push a completed discrete action (node added, node deleted, structure changed).
   */
  public push(currentData: KnowledgeNode, selectedNodeId: string | null): void {
    if (this.isEditingText) {
      this.commitTextEdit();
    }

    const serialized = JSON.stringify(currentData);

    // Skip if identical to top of undo stack
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === serialized) {
      return;
    }

    this.undoStack.push(serialized);
    this.undoMeta.push(selectedNodeId);

    if (this.undoStack.length > this.maxStack) {
      this.undoStack.shift();
      this.undoMeta.shift();
    }

    // New action invalidates redo history
    this.redoStack = [];
    this.redoMeta = [];

    this.notify();
  }

  /**
   * Batches rapid keystrokes from text inputs. Captures the state before editing begins,
   * then auto-commits 500ms after the user pauses typing.
   */
  public recordTextEdit(currentData: KnowledgeNode, selectedNodeId: string | null): void {
    if (!this.isEditingText) {
      this.isEditingText = true;
      this.preTextSnapshot = JSON.stringify(currentData);
      this.preTextSelectedId = selectedNodeId;
    }

    if (this.textEditTimer !== null) {
      window.clearTimeout(this.textEditTimer);
    }

    this.textEditTimer = window.setTimeout(() => {
      this.commitTextEdit();
    }, 500);
  }

  public commitTextEdit(): void {
    if (!this.isEditingText || !this.preTextSnapshot) {
      this.isEditingText = false;
      this.preTextSnapshot = null;
      return;
    }

    if (this.undoStack.length === 0 || this.undoStack[this.undoStack.length - 1] !== this.preTextSnapshot) {
      this.undoStack.push(this.preTextSnapshot);
      this.undoMeta.push(this.preTextSelectedId);
      if (this.undoStack.length > this.maxStack) {
        this.undoStack.shift();
        this.undoMeta.shift();
      }
      this.redoStack = [];
      this.redoMeta = [];
      this.notify();
    }

    this.isEditingText = false;
    this.preTextSnapshot = null;
    this.preTextSelectedId = null;
    if (this.textEditTimer !== null) {
      window.clearTimeout(this.textEditTimer);
      this.textEditTimer = null;
    }
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0 || this.isEditingText;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(currentData: KnowledgeNode, selectedNodeId: string | null): HistoryState | null {
    if (this.isEditingText) {
      this.commitTextEdit();
    }

    if (this.undoStack.length === 0) return null;

    // Save current state into redo stack
    this.redoStack.push(JSON.stringify(currentData));
    this.redoMeta.push(selectedNodeId);
    if (this.redoStack.length > this.maxStack) {
      this.redoStack.shift();
      this.redoMeta.shift();
    }

    const prevJson = this.undoStack.pop()!;
    const prevNodeId = this.undoMeta.pop()!;

    this.notify();

    return {
      data: JSON.parse(prevJson),
      selectedNodeId: prevNodeId
    };
  }

  public redo(currentData: KnowledgeNode, selectedNodeId: string | null): HistoryState | null {
    if (this.redoStack.length === 0) return null;

    // Save current state into undo stack
    this.undoStack.push(JSON.stringify(currentData));
    this.undoMeta.push(selectedNodeId);
    if (this.undoStack.length > this.maxStack) {
      this.undoStack.shift();
      this.undoMeta.shift();
    }

    const nextJson = this.redoStack.pop()!;
    const nextNodeId = this.redoMeta.pop()!;

    this.notify();

    return {
      data: JSON.parse(nextJson),
      selectedNodeId: nextNodeId
    };
  }

  public clear(): void {
    this.undoStack = [];
    this.undoMeta = [];
    this.redoStack = [];
    this.redoMeta = [];
    this.isEditingText = false;
    if (this.textEditTimer !== null) {
      window.clearTimeout(this.textEditTimer);
      this.textEditTimer = null;
    }
    this.notify();
  }
}
