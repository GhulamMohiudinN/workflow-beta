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

// Smooth cubic-bezier path through a set of points — plain polylines read as
// jagged/cheap; this is what gives the sparkline its "designed" look.
const buildSmoothPath = (points) => {
  if (points.length < 2) return "";
  let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = ((p0.x + p1.x) / 2).toFixed(1);
    d += ` C ${midX},${p0.y.toFixed(1)} ${midX},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
  }
  return d;
};

export const Sparkline = ({
  tone = "primary",
  values = [18, 44, 52, 36, 48, 62],
  gradientId,
}) => {
  const color = toneColors[tone] || toneColors.primary;
  const width = 180;
  const height = 40;
  const padX = 4;
  const padY = 6;
  const gid = gradientId || `sparkline-${tone}`;

  const series = values.length > 1 ? values : [...values, values[0] ?? 0];
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = max - min || 1;

  const points = series.map((value, index) => ({
    x: padX + (index / (series.length - 1)) * (width - padX * 2),
    y: height - padY - ((value - min) / range) * (height - padY * 2),
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)},${height} L ${points[0].x.toFixed(1)},${height} Z`;
  const last = points[points.length - 1];

  return (
    <svg
      className="h-10 w-full overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gid})`} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r="3" fill={color} stroke="#ffffff" strokeWidth="1.5" />
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
