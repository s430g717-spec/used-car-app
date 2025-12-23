// @ts-nocheck
import * as React from "react";
import { cn } from "../../lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => onOpenChange?.(false)}
    >
      <div className="absolute inset-0 bg-black/50" />
      {/* stop propagation for content */}
      <div
        className="relative w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("bg-white rounded-xl shadow-xl border", className)}>
      {children}
    </div>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pt-4 pb-2 border-b">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-base font-semibold text-slate-900">{children}</div>
  );
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-slate-600 mt-1">{children}</div>;
}
