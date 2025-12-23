// @ts-nocheck
import * as React from "react";
import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils"; // src/lib/utils.ts を参照 (2階層上)

// ボタンのスタイル定義 (cvaを使用)
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-linear-to-b from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-600 hover:to-emerald-700",
        destructive:
          "bg-linear-to-b from-red-500 to-red-600 text-white shadow-md hover:from-red-600 hover:to-red-700",
        outline:
          "border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
        secondary:
          "bg-linear-to-b from-slate-700 to-slate-800 text-white shadow-md hover:from-slate-800 hover:to-slate-900",
        ghost: "hover:bg-slate-100 text-slate-700",
        link: "text-emerald-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// 名前付きエクスポートを使用
export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

// variants の外部エクスポートはHMR不安定化のため一旦停止
