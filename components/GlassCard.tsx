import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Premium SoftCard for the new Medivault aesthetic.
 * Uses a clean white background, soft shadow, and high-fidelity rounded corners.
 */
export const GlassCard = ({ children, className = "", onClick }: CardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border border-indigo-100/50 shadow-soft rounded-[2rem] p-6 transition-all duration-500 hover:shadow-premium hover:-translate-y-1 group",
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  );
};
