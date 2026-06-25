import { Card, CardContent, CardHeader } from "../../../components/Card";

export const SectionCard = ({
  title,
  action,
  children,
  className = "",
  contentClassName = "",
}) => (
  <Card className={className}>
    <CardHeader className="flex items-center justify-between">
      <h2 className="text-sm font-black text-[var(--color-text)]">{title}</h2>
      {action}
    </CardHeader>
    <CardContent className={contentClassName}>{children}</CardContent>
  </Card>
);
