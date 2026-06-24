"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  pixelSize?: number;
  className?: string;
  label?: string;
}

const SIZE_MAP = {
  xs: 14,
  sm: 20,
  md: 32,
  lg: 48,
  xl: 64,
};

export function Loader({
  size = "md",
  pixelSize,
  className,
  label = "Loading",
}: LoaderProps) {
  const currentSize = pixelSize ?? SIZE_MAP[size];

  return (
    <div
      role="status"
      className={cn("lilla-loader-container flex items-center justify-center select-none", className)}
      style={{
        width: currentSize,
        height: currentSize,
      }}
    >
      <div
        className="lilla-spinner"
        style={{
          width: currentSize,
          height: currentSize,
        }}
      >
        {Array.from({ length: 10 }).map((_, i) => {
          const rotation = (i + 1) * 36;
          const delay = (i + 1) * 0.1;
          return (
            <div
              key={i}
              style={
                {
                  "--rotation": rotation,
                  "--translation": 150,
                  "--delay": delay,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default Loader;
