"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error boundary caught error:", error);
  }, [error]);

  return (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <div className="glass-card flex max-w-md flex-col items-center p-8 text-center border-red-500/20 bg-red-500/5">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="mb-2 text-lg font-bold text-foreground">Terjadi Kesalahan</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba muat ulang.
        </p>
        <div className="flex gap-3">
          <button
            className="flex items-center rounded-md border border-red-500/20 bg-transparent px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            onClick={() => reset()}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Coba Lagi
          </button>
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={() => window.location.href = '/'}
          >
            Ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
