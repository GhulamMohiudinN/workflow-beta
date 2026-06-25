export const Card = ({
  children,
  className = "",
  variant = "default",
  shadow = "md",
  hover = false,
  onClick = null,
}) => {
  const variantStyles = {
    default: "app-card",
    elevated: "bg-[var(--color-surface)] shadow-[var(--shadow-popover)]",
    outlined:
      "border border-[var(--color-border-strong)] bg-[var(--color-surface)]",
    transparent: "bg-transparent",
  };

  const shadowStyles = {
    none: "shadow-none",
    sm: "shadow-[var(--shadow-card)]",
    md: "shadow-[var(--shadow-card)]",
    lg: "shadow-[var(--shadow-popover)]",
    xl: "shadow-[var(--shadow-popover)]",
  };

  return (
    <div
      className={`overflow-hidden rounded-lg transition-all duration-200 ${
        variantStyles[variant] || variantStyles.default
      } ${shadowStyles[shadow] || shadowStyles.md} ${
        hover ? "cursor-pointer hover:shadow-[var(--shadow-popover)]" : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = "" }) => (
  <div className={`border-b border-[var(--color-border)] px-5 py-4 ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={`px-5 py-4 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = "" }) => (
  <div className={`border-t border-[var(--color-border)] px-5 py-4 ${className}`}>
    {children}
  </div>
);

export const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "primary",
  detail,
  children,
}) => {
  const colorClassMap = {
    primary: "bg-blue-50 text-blue-600",
    secondary: "bg-teal-50 text-teal-600",
    success: "bg-green-50 text-green-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
  };

  return (
    <Card className="min-h-[132px]">
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase text-[var(--color-muted)]">
              {title}
            </p>
            <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
              {value}
            </p>
            {detail && (
              <p className="mt-1 text-xs font-medium text-[var(--color-muted)]">
                {detail}
              </p>
            )}
          </div>
          {Icon && (
            <div
              className={`rounded-lg p-2.5 ${
                colorClassMap[color] || colorClassMap.primary
              }`}
            >
              <Icon size={18} />
            </div>
          )}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  );
};

export default Card;
