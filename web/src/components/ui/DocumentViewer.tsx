"use client";

import { type DocumentProps, PDFViewer, pdf } from "@react-pdf/renderer";
import { Download, Loader2, Printer, X } from "lucide-react";
import { type ReactElement, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./Button";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fileName: string;
  documentNode: ReactElement<DocumentProps>; // The @react-pdf/renderer <Document> element
};

export function DocumentViewer({
  open,
  onClose,
  title,
  subtitle,
  fileName,
  documentNode,
}: Props) {
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const generateBlob = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await pdf(documentNode).toBlob();
      return blob;
    } catch (e) {
      toast.error("Failed to generate PDF");
      throw e;
    } finally {
      setGenerating(false);
    }
  }, [documentNode]);

  async function handleDownload() {
    try {
      const blob = await generateBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      /* toast already shown */
    }
  }

  async function handlePrint() {
    try {
      const blob = await generateBlob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (!printWindow) {
        URL.revokeObjectURL(url);
        toast.error("Pop-up blocked. Please allow pop-ups for this site.");
        return;
      }
      printWindow.addEventListener("load", () => {
        printWindow.focus();
        printWindow.print();
      });
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch {
      /* toast already shown */
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      {/* Toolbar */}
      <div className="flex flex-none items-center justify-between border-b border-ink-line/30 px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close document preview"
            className="rounded-lg p-1.5 text-steel-light transition-colors hover:bg-ink-soft hover:text-cream"
          >
            <X className="h-5 w-5" />
          </button>
          <div>
            <p className="text-sm font-semibold text-cream">{title}</p>
            {subtitle && <p className="text-xs text-steel-light">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleDownload}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Download
          </Button>
          <Button onClick={handlePrint} disabled={generating}>
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Printer className="h-3.5 w-3.5" />
            )}
            Print
          </Button>
        </div>
      </div>

      {/* PDF Preview */}
      <div className="flex-1">
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          {documentNode}
        </PDFViewer>
      </div>
    </div>
  );
}
