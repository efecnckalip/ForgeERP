import React from "react";

export default function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Seçiniz",
  name,
  id,
  required = false,
  disabled = false,
  error = "",
  helperText = "",
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

      <select
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full rounded-xl border bg-slate-900 px-4 py-2.5
          text-slate-100 transition-all duration-200
          border-slate-700
          focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
          disabled:cursor-not-allowed disabled:opacity-60
          ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
          ${className}
        `}
        {...props}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error ? (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-sm text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}