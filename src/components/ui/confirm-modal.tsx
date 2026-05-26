"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card w-full max-w-sm p-6 overflow-hidden border shadow-2xl border-border/50"
          >
            <h2 className="text-lg font-bold text-foreground mb-2">{title}</h2>
            <p className="text-sm text-muted-foreground mb-6">{message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-card text-muted-foreground hover:text-foreground transition-all">
                Batal
              </button>
              <button onClick={() => { onConfirm(); onCancel(); }} className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-red hover:bg-red/90 transition-all shadow-lg shadow-red/20">
                Hapus
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
