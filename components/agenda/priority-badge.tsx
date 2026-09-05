import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

const priorityConfig: Record<string, { label: string; className: string; showIcon: boolean }> = {
  RENDAH: {
    label: "Rendah",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
    showIcon: false,
  },
  SEDANG: {
    label: "Sedang",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
    showIcon: false,
  },
  TINGGI: {
    label: "Tinggi",
    className: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50",
    showIcon: true,
  },
  URGENT: {
    label: "Urgent",
    className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
    showIcon: true,
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const key = priority.toUpperCase();
  const config = priorityConfig[key] || {
    label: priority,
    className: "bg-slate-100 text-slate-700 border-slate-200",
    showIcon: false,
  };

  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", config.className, className)}>
      {config.showIcon ? <AlertTriangle className="h-3 w-3" /> : null}
      {config.label}
    </Badge>
  );
}