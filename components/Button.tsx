import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "premium";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-full font-bold transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-tight text-xs";

  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-premium",
    secondary: "bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 shadow-soft",
    outline: "border-2 border-indigo-100 hover:border-indigo-600 text-indigo-600 hover:bg-indigo-50",
    ghost: "hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600",
    premium: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-premium ring-2 ring-indigo-600/20",
  };

  const sizes = {
    sm: "px-5 py-2.5",
    md: "px-8 py-3.5",
    lg: "px-10 py-4.5 text-sm",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};
