import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
