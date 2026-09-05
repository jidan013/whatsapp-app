import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: {
    name: string;
    colorHex: string;
    isTerminal?: boolean;
  };
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const color = status.colorHex || "#6b7280";

  return (
    <Badge
      variant="outline"
      className={cn(className)}
      style={{
        borderColor: color,
        color: color,
        backgroundColor: `${color}10`,
      }}
    >
      {status.name}
    </Badge>
  );
}