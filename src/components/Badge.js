export const Badge = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
}) => {
  const variants = {
    primary: "bg-blue-50 text-blue-700",
    secondary: "bg-teal-50 text-teal-700",
    success: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    outline:
      "border border-[var(--color-border)] bg-transparent text-[var(--color-muted)]",
  };

  const sizes = {
    sm: "px-2 py-1 text-[10px] rounded",
    md: "px-2.5 py-1 text-xs rounded-md",
    lg: "px-3 py-1.5 text-sm rounded-lg",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold ${
        variants[variant] || variants.primary
      } ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const Avatar = ({
  src = null,
  name = "User",
  size = "md",
  onClick = null,
}) => {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <div
        aria-label={name}
        role="img"
        className={`${sizes[size]} cursor-pointer rounded-full border border-white bg-cover bg-center shadow-sm transition hover:shadow-md`}
        onClick={onClick}
        style={{ backgroundImage: `url(${src})` }}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} flex cursor-pointer items-center justify-center rounded-full bg-[var(--color-primary)] font-bold text-white shadow-sm transition hover:shadow-md`}
      onClick={onClick}
      title={name}
    >
      {initials || "U"}
    </div>
  );
};

const badgeComponents = { Badge, Avatar };

export default badgeComponents;
