"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    dismiss: (id: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: Toast["type"], message: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }, [dismiss]);

  const toast = React.useMemo(() => ({
    success: (msg: string, dur?: number) => addToast("success", msg, dur),
    error: (msg: string, dur?: number) => addToast("error", msg, dur),
    info: (msg: string, dur?: number) => addToast("info", msg, dur),
    warning: (msg: string, dur?: number) => addToast("warning", msg, dur),
    dismiss,
  }), [addToast, dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}

// Global hook export styled like react-hot-toast
export const toast = {
  success: (msg: string) => {
    console.warn("Global toast called outside context. Use useToast() hook within ToastProvider components.");
  },
  error: (msg: string) => {
    console.warn("Global toast called outside context. Use useToast() hook within ToastProvider components.");
  }
};

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(onDismiss, 300); // Wait for fade-out animation
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const bgStyles = {
    success: "bg-white border-emerald-100 shadow-[0_4px_20px_rgba(16,185,129,0.08)]",
    error: "bg-white border-rose-100 shadow-[0_4px_20px_rgba(239,68,68,0.08)]",
    warning: "bg-white border-amber-100 shadow-[0_4px_20px_rgba(245,158,11,0.08)]",
    info: "bg-white border-blue-100 shadow-[0_4px_20px_rgba(59,130,246,0.08)]",
  };

  return (
    <div
      role="alert"
      className={`
        pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl border bg-white/95 backdrop-blur-md shadow-lg
        transition-all duration-300 transform
        ${isExiting 
          ? "opacity-0 scale-95 translate-x-10" 
          : "opacity-100 scale-100 translate-x-0 animate-in slide-in-from-top-4 duration-300"
        }
        ${bgStyles[toast.type]}
      `}
    >
      {icons[toast.type]}
      <div className="flex-1 text-slate-700 text-xs font-semibold leading-relaxed">
        {toast.message}
      </div>
      <button
        onClick={handleDismiss}
        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
        aria-label="Fermer"
      >
        <X size={14} />
      </button>
    </div>
  );
}
