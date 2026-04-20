import { useState, useEffect, useCallback, useRef } from "react";

interface UseResizablePanelProps {
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  storageKey?: string;
}

export const useResizablePanel = ({
  minWidth = 280,
  maxWidth = 500,
  defaultWidth = 360,
  storageKey = "chat-list-width",
}: UseResizablePanelProps = {}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Load saved width 
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const w = parseInt(saved, 10);
      if (!isNaN(w) && w >= minWidth && w <= maxWidth) {
        setWidth(w);
      } else if (w > maxWidth) {
        setWidth(maxWidth);
      }
    }
  }, [minWidth, maxWidth, storageKey]);

  // Save width when resizing ends
  const saveWidth = useCallback(
    (newWidth: number) => {
      localStorage.setItem(storageKey, newWidth.toString());
    },
    [storageKey],
  );
const handleMouseMove = useCallback(
  (e: MouseEvent) => {
    if (!isResizing) return;
    console.log("Mouse moving, isResizing:", isResizing);
    const delta = e.clientX - startXRef.current;
    let newWidth = startWidthRef.current + delta;
    newWidth = Math.min(maxWidth, Math.max(minWidth, newWidth));
    console.log("New width:", newWidth);
    setWidth(newWidth);
  },
  [isResizing, minWidth, maxWidth],
);

  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;
    setIsResizing(false);
    saveWidth(width);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [isResizing, width, saveWidth]);

  const startResizing = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      setIsResizing(true);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    },
    [width],
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return { width, isResizing, startResizing };
};
