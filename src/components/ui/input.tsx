import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      suppressHydrationWarning
      className={cn(
        "flex h-9 w-full rounded-[2px] border border-[#89919A] bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2]",
        className,
      )}
      {...props}
    />
  );
}
