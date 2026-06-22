"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ChartSize = {
  width: number;
  height: number;
};

type DashboardChartContainerProps = {
  minHeight?: number;
  children: (size: ChartSize) => ReactNode;
};

export function DashboardChartContainer({ minHeight = 220, children }: DashboardChartContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ChartSize>({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setSize({
        width: Math.max(0, Math.round(rect.width)),
        height: Math.max(minHeight, Math.round(rect.height) || minHeight)
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);

    return () => observer.disconnect();
  }, [minHeight]);

  return (
    <div ref={ref} className="h-full min-h-0 min-w-0">
      {size.width > 0 && size.height > 0 ? children(size) : <div className="h-full rounded-2xl bg-slate-50/70" />}
    </div>
  );
}
