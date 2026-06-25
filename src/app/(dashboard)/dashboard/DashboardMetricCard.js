import { Card, CardContent } from "../../../components/Card";
import { ProgressLine, ProgressTrack, Sparkline } from "./MiniCharts";

export const DashboardMetricCard = ({
  title,
  value,
  detail,
  icon: Icon,
  tone = "primary",
  chart = "bars",
  chartValues,
  progress = 72,
}) => {
  const iconTone = {
    primary: "bg-blue-50 text-blue-600",
    success: "bg-green-50 text-green-600",
    warning: "bg-amber-50 text-amber-600",
    secondary: "bg-teal-50 text-teal-600",
  };

  return (
    <Card className="min-h-[150px]">
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase text-[var(--color-muted)]">
              {title}
            </p>
            <p className="mt-3 text-2xl font-black text-[var(--color-text)]">
              {value}
            </p>
            <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">
              {detail}
            </p>
          </div>
          {Icon && (
            <div
              className={`rounded-lg p-2 ${iconTone[tone] || iconTone.primary}`}
            >
              <Icon size={17} />
            </div>
          )}
        </div>
        <div className="mt-4">
          {chart === "line" && (
            <Sparkline
              tone={tone}
              values={chartValues || [18, 44, 52, 38, 48, 60]}
            />
          )}
          {chart === "progress" && (
            <ProgressTrack tone={tone} value={progress} />
          )}
          {chart === "bars" && (
            <ProgressLine
              tone={tone}
              values={chartValues || [45, 58, 52, 68]}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
