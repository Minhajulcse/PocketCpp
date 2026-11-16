import React, { useState, useRef } from 'react';

interface SplitterProps {
  direction: 'vertical' | 'horizontal'; // vertical = separates left/right; horizontal = separates top/bottom
  containerRef: React.RefObject<HTMLElement>;
  onResize: (newPercent: number) => void;
  onResizeEnd?: (finalPercent: number) => void;
  currentPercent: number;
  minPercent?: number;
  maxPercent?: number;
  onReset?: () => void;
}

export const Splitter: React.FC<SplitterProps> = ({
  direction,
  containerRef,
  onResize,
  onResizeEnd,
  currentPercent,
  minPercent = 20,
  maxPercent = 80,
  onReset,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const activePointerId = useRef<number | null>(null);

  const isCol = direction === 'vertical';

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    activePointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);

    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.cursor = isCol ? 'col-resize' : 'row-resize';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let newPercent: number;

    if (isCol) {
      const offsetX = e.clientX - rect.left;
      newPercent = (offsetX / rect.width) * 100;
    } else {
      const offsetY = e.clientY - rect.top;
      newPercent = (offsetY / rect.height) * 100;
    }

    const clamped = Math.min(maxPercent, Math.max(minPercent, newPercent));
    onResize(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      if (activePointerId.current !== null) {
        e.currentTarget.releasePointerCapture(activePointerId.current);
      }
    } catch {
      // Ignored
    }
    activePointerId.current = null;

    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.cursor = '';

    if (onResizeEnd) {
      onResizeEnd(currentPercent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isCol) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = Math.max(minPercent, currentPercent - 2);
        onResize(next);
        onResizeEnd?.(next);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = Math.min(maxPercent, currentPercent + 2);
        onResize(next);
        onResizeEnd?.(next);
      }
    } else {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = Math.max(minPercent, currentPercent - 2);
        onResize(next);
        onResizeEnd?.(next);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(maxPercent, currentPercent + 2);
        onResize(next);
        onResizeEnd?.(next);
      }
    }
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={isCol ? 'vertical' : 'horizontal'}
      aria-valuenow={Math.round(currentPercent)}
      aria-valuemin={minPercent}
      aria-valuemax={maxPercent}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
      title="Drag to resize panels (Double-click to reset)"
      className={`group relative z-30 flex items-center justify-center select-none outline-none transition-colors touch-none ${
        isCol
          ? 'w-2 sm:w-2.5 h-full cursor-col-resize hover:bg-blue-500/20 active:bg-blue-500/40 border-x border-ide-border/40'
          : 'w-full h-2 sm:h-2.5 cursor-row-resize hover:bg-blue-500/20 active:bg-blue-500/40 border-y border-ide-border/40'
      } ${isDragging ? 'bg-blue-500/50' : 'bg-ide-subpanel'}`}
    >
      {/* Visual Central Grip Bar */}
      <div
        className={`rounded-full transition-all duration-150 ${
          isCol
            ? 'w-[2px] h-8 group-hover:h-12 group-hover:w-[3px]'
            : 'h-[2px] w-8 group-hover:w-12 group-hover:h-[3px]'
        } ${isDragging ? 'bg-blue-400 w-[3px]' : 'bg-zinc-600 group-hover:bg-blue-400'}`}
      />
    </div>
  );
};
