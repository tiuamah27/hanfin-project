"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useUIStore, ModalType } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface ModalProps {
  id: ModalType;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({ id, title, description, children, maxWidth = "md" }: ModalProps) {
  const { activeModal, closeModal } = useUIStore();
  const isOpen = activeModal === id;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn("relative w-full glass-card border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden", maxWidthClass)}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/50 shrink-0 bg-surface/50">
              <div>
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-card text-muted-foreground hover:text-foreground transition-colors bg-background/50 border border-border/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-5 overflow-y-auto custom-scrollbar bg-background/30">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
