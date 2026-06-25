export const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick = null,
  className = "",
  type = "button",
  icon: Icon = null,
  ...props
}) => {
  const baseClasses =
    "app-focus inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-[var(--color-primary)] text-white shadow-sm hover:bg-[var(--color-primary-hover)]",
    secondary: "bg-[var(--color-secondary)] text-white hover:brightness-95",
    success: "bg-green-600 text-white hover:bg-green-700",
    warning: "bg-amber-500 text-white hover:bg-amber-600",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline:
      "border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]",
    ghost:
      "border border-transparent bg-transparent text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
  };

  const sizes = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-base",
    xl: "px-6 py-3.5 text-lg",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      } ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon size={16} />
      )}
      {children}
    </button>
  );
};

export default Button;
