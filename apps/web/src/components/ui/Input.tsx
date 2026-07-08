import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
