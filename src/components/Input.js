"use client";

import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { colors } from "../theme";

/**
 * Input Component
 * Reusable input field with variants
 */
export const Input = ({
  type = "text",
  label = null,
  placeholder = "",
  value = "",
  onChange = null,
  error = null,
  disabled = false,
  icon: Icon = null,
  size = "md",
  fullWidth = false,
  className = "",
  helperText = null,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-5 py-3 text-lg",
  };

  const baseClasses = `rounded-lg border-2 transition-all duration-200 font-medium outline-none`;

  const normalClasses = `border-[${colors.neutral[200]}] focus:border-[${colors.primary[600]}] focus:bg-blue-50 bg-white`;

  const errorClasses = `border-red-500 focus:border-red-600 focus:bg-red-50 bg-white`;

  const disabledClasses = `bg-gray-100 text-gray-500 cursor-not-allowed opacity-50`;

  const borderColor = error
    ? `border-[${colors.danger[600]}]`
    : `border-[${colors.neutral[200]}]`;
  const focusColor = error
    ? "focus:border-red-600"
    : `focus:border-[${colors.primary[600]}]`;

  const inputType =
    type === "password" && showPassword ? "text" : type;

  return (
    <div className={`flex flex-col gap-2 ${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-900">{label}</label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon size={20} />
          </div>
        )}

        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`${baseClasses} ${sizes[size]} ${
            error ? errorClasses : normalClasses
          } ${disabled ? disabledClasses : ""} ${Icon ? "pl-10" : ""} ${
            type === "password" ? "pr-10" : ""
          } w-full ${className}`}
        />

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

/**
 * Textarea Component
 */
export const Textarea = ({
  label = null,
  placeholder = "",
  value = "",
  onChange = null,
  error = null,
  disabled = false,
  rows = 4,
  fullWidth = true,
  className = "",
}) => {
  return (
    <div className={`flex flex-col gap-2 ${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-900">{label}</label>
      )}

      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`rounded-lg border-2 px-4 py-2.5 text-base font-medium outline-none transition-all duration-200 resize-none
          ${
            error
              ? "border-red-500 focus:border-red-600"
              : "border-gray-200 focus:border-blue-600"
          }
          ${disabled ? "bg-gray-100 text-gray-500 opacity-50 cursor-not-allowed" : "bg-white"}
          w-full ${className}`}
      />

      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
};

/**
 * Select Component
 */
export const Select = ({
  label = null,
  value = "",
  onChange = null,
  options = [],
  error = null,
  disabled = false,
  placeholder = "Select an option",
  className = "",
}) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-sm font-semibold text-gray-900">{label}</label>
      )}

      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`rounded-lg border-2 px-4 py-2.5 text-base font-medium outline-none transition-all duration-200
          ${
            error
              ? "border-red-500 focus:border-red-600"
              : "border-gray-200 focus:border-blue-600"
          }
          ${disabled ? "bg-gray-100 text-gray-500 opacity-50 cursor-not-allowed" : "bg-white"}
          w-full ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
};

export default { Input, Textarea, Select };
