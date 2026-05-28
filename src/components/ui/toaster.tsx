"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let addToastFn: ((message: string, type: ToastType) => void) | null = null;

export const toast = {
  success: (message: string) => addToastFn?.(message, "success"),
  error: (message: string) => addToastFn?.(message, "error"),
  warning: (message: string) => addToastFn?.(message, "warning"),
  info: (message: string) => addToastFn?.(message, "info"),
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: "border-green/20 bg-green-dim text-green",
  error: "border-red/20 bg-red-dim text-red",
  warning: "border-amber/20 bg-amber-dim text-amber",
  info: "border-primary/20 bg-primary-dim text-primary",
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    addToastFn = (message: string, type: ToastType) => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      
      // Also push to notification history if it's not a generic error
      if (type !== 'error') {
        const { addNotification } = require('@/stores/notification-store').useNotificationStore.getState();
        let notifType: "system" | "transaction" | "wallet" | "bill" | "goal" | "budget" = "system";
        if (message.toLowerCase().includes('transaksi')) notifType = "transaction";
        else if (message.toLowerCase().includes('wallet') || message.toLowerCase().includes('transfer')) notifType = "wallet";
        else if (message.toLowerCase().includes('tagihan')) notifType = "bill";
        else if (message.toLowerCase().includes('goal') || message.toLowerCase().includes('kontribusi')) notifType = "goal";
        else if (message.toLowerCase().includes('budget') || message.toLowerCase().includes('item')) notifType = "budget";

        addNotification({
          type: notifType,
          title: message,
        });
      }

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl",
              "animate-slide-down",
              styles[t.type]
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
