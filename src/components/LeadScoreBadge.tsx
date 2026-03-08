import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface LeadScoreBadgeProps {
  score: number | null;
  size?: "sm" | "md";
  className?: string;
}

function getScoreColor(score: number) {
  if (score >= 75) return "bg-success/15 text-success border-success/30";
  if (score >= 50) return "bg-warning/15 text-warning border-warning/30";
  if (score >= 25) return "bg-orange-500/15 text-orange-600 border-orange-500/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
}

function getScoreLabel(score: number) {
  if (score >= 75) return "Hot";
  if (score >= 50) return "Warm";
  if (score >= 25) return "Cool";
  return "Cold";
}

export function LeadScoreBadge({ score, size = "sm", className }: LeadScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground border-border bg-muted/50",
        className
      )}>
        <Sparkles className="h-3 w-3" /> Unscored
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold",
      size === "sm" ? "text-xs" : "text-sm px-3 py-1",
      getScoreColor(score),
      className
    )}>
      <Sparkles className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      {score} · {getScoreLabel(score)}
    </span>
  );
}
