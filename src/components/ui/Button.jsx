import React from "react";

const variants = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-500 border-blue-500 shadow-blue-900/20",
  secondary:
    "bg-slate-800 text-slate-100 hover:bg-slate-700 border-slate-700",
  danger:
    "bg-red-600 text-white hover:bg-red-500 border-red-500 shadow-red-900/20",
  ghost:
    "bg-transparent text-slate-300 hover:bg-slate-800 border-transparent",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-500 border-emerald-500",
};

const sizes = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl border
        font-semibold transition active:scale-[0.98]
        disabled:cursor-not-allowed disabled:opacity-50
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}