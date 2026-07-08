import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({
  children,
  title,
  description,
  className,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-40 bg-slate-900/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl focus:outline-none",
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <RadixDialog.Title className="text-lg font-semibold text-slate-900">{title}</RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="mt-1 text-sm text-slate-500">
                {description}
              </RadixDialog.Description>
            ) : null}
          </div>
          <RadixDialog.Close className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </RadixDialog.Close>
        </div>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
