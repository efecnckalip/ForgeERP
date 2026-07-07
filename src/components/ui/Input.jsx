import React from "react";

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  name,
  id,
  required = false,
  disabled = false,
  error = "",
  helperText = "",
  leftIcon = null,
  rightIcon = null,
  className = "",
  fullWidth = true,
  ...props
}) {
  return (
    <div className={`${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label
          htmlFor={id || name}
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}

        <input
          id={id || name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full
            rounded-xl
            border
            bg-slate-900
            text-slate-100
            placeholder:text-slate-500
            border-slate-700
            px-4
            py-2.5
            transition-all
            duration-200
            focus:border-blue-500
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500/20
            disabled:cursor-not-allowed
            disabled:opacity-60
            ${leftIcon ? "pl-11" : ""}
            ${rightIcon ? "pr-11" : ""}
            ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-sm text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}