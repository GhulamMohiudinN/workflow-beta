export const toneColors = {
  primary: "#2563eb",
  success: "#22c55e",
  warning: "#f59e0b",
  secondary: "#0d9488",
};

export const ProgressLine = ({
  tone = "primary",
  values = [30, 58, 44, 72],
}) => {
  const colors = {
    primary: "bg-[var(--color-primary)]",
    success: "bg-[var(--color-success)]",
    warning: "bg-[var(--color-warning)]",
    secondary: "bg-[var(--color-secondary)]",
  };

  return (
    <div className="flex h-7 items-end gap-1.5">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className={`w-full rounded-t ${colors[tone] || colors.primary}`}
          style={{ height: `${Math.max(value, 16)}%` }}
        />
      ))}
    </div>
  );
};

export const Sparkline = ({
  tone = "primary",
  values = [18, 44, 52, 36, 48, 62],
}) => {
  const color = toneColors[tone] || toneColors.primary;
  const width = 180;
  const height = 34;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className="h-8 w-full overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
};

export const ProgressTrack = ({ tone = "secondary", value = 72 }) => (
  <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
    <div
      className="h-full rounded-full"
      style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        backgroundColor: toneColors[tone] || toneColors.secondary,
      }}
    />
  </div>
);
