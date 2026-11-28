'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Minus, Plus, Scan, Trash2 } from 'lucide-react';
import { DocumentRenderer } from '@/components/document/DocumentRenderer';
import {
  DEFAULT_TOKEN_SET,
  canHaveChildren,
  findNode,
  findParent,
  getChildren,
  type NodeId,
} from '@/lib/document-model';
import { IframeCanvas } from './IframeCanvas';
import { createDefaultNode, type InsertableBlockKind } from '@/lib/editor/createDefaultNode';
import { cloneNodeWithFreshIds } from '@/lib/editor/duplicateNode';
import { VIEWPORTS, type DocumentEditor } from '@/lib/editor/useDocumentEditor';

export const DRAG_BLOCK_MIME = 'application/x-ogmj-block';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

/** True while the given target is a text-editing control -- Delete/Backspace there must type, never delete the selected canvas element. */
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
