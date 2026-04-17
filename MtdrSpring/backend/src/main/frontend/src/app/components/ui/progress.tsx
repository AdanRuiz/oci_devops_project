"use client";

import * as React from "react";
import { cn } from "./utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export function Progress({ className, value = 0, ...props }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className={cn("w-full bg-muted-foreground/10 rounded-full overflow-hidden", className)} {...props}>
      <div style={{ width: `${pct}%` }} className="h-full bg-primary transition-all" />
    </div>
  );
}

export default Progress;
