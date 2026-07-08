import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function Select({
  value,
  onValueChange,
  placeholder,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: ReactNode;
}) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500">
        <RadixSelect.Value placeholder={placeholder} className="min-w-0 flex-1 truncate text-left" />
        <RadixSelect.Icon className="shrink-0">
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content className="z-50 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
          <RadixSelect.Viewport className="p-1">{children}</RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

export function SelectItem({ value, children }: { value: string; children: ReactNode }) {
  return (
    <RadixSelect.Item
      value={value}
      className="relative flex h-9 cursor-pointer select-none items-center rounded-sm px-8 text-sm text-slate-700 outline-none data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-700"
    >
      <RadixSelect.ItemIndicator className="absolute left-2 inline-flex items-center">
        <Check className="h-4 w-4" />
      </RadixSelect.ItemIndicator>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}
