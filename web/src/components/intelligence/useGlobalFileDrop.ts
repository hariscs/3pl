"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
  onDropFiles: (files: File[]) => void;
};

export function useGlobalFileDrop({ onDropFiles }: Props) {
  const [isDragActive, setIsDragActive] = useState(false);
  const counterRef = useRef(0);
  const onDropRef = useRef(onDropFiles);
  onDropRef.current = onDropFiles;

  useEffect(() => {
    function hasFiles(e: DragEvent): boolean {
      return e.dataTransfer?.types?.includes("Files") ?? false;
    }

    function handleDragEnter(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      counterRef.current++;
      if (counterRef.current === 1) {
        setIsDragActive(true);
      }
    }

    function handleDragLeave(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      counterRef.current--;
      if (counterRef.current <= 0) {
        counterRef.current = 0;
        setIsDragActive(false);
      }
    }

    function handleDragOver(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
    }

    function handleDrop(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      counterRef.current = 0;
      setIsDragActive(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        onDropRef.current(Array.from(e.dataTransfer.files));
      }
    }

    function reset() {
      counterRef.current = 0;
      setIsDragActive(false);
    }

    function handleDragEnd() {
      reset();
    }

    function handleWindowBlur() {
      reset();
    }

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("dragend", handleDragEnd);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("dragend", handleDragEnd);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  return isDragActive;
}
