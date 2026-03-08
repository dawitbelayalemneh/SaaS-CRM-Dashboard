import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Users, DollarSign, UserCheck, StickyNote, Activity } from "lucide-react";

type ActivityItem = {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string | null;
  details: string | null;
  created_at: string;
};

const ICON_MAP: Record<string, typeof Users> = {
  lead: Users,
  deal: DollarSign,
  contact: UserCheck,
  note: StickyNote,
};

const COLOR_MAP: Record<string, string> = {
  lead: "bg-primary/10 text-primary ring-1 ring-primary/15",
  deal: "bg-accent/10 text-accent ring-1 ring-accent/15",
  contact: "bg-chart-3/10 text-chart-3 ring-1 ring-chart-3/15",
  note: "bg-chart-4/10 text-chart-4 ring-1 ring-chart-4/15",
};

export function ActivityTimeline({ limit = 20 }: { limit?: number }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      setActivities(data || []);
      setLoading(false);
    }
    fetch();
  }, [limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
        <span className="text-sm">Loading activity...</span>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
          <Activity className="h-5 w-5 opacity-50" />
        </div>
        <p className="text-sm font-medium">No activity yet</p>
        <p className="text-xs mt-1">Actions will appear here as you use the CRM</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, index) => {
        const Icon = ICON_MAP[activity.entity_type] || Activity;
        const colorClass = COLOR_MAP[activity.entity_type] || "bg-muted text-muted-foreground";

        return (
          <div key={activity.id} className="flex gap-3 group">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass} transition-transform duration-150 group-hover:scale-110`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              {index < activities.length - 1 && (
                <div className="w-px flex-1 bg-border/60 my-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-4">
              <p className="text-[13px] leading-snug">
                <span className="font-medium text-foreground">{activity.action}</span>
                {activity.entity_name && (
                  <span className="font-semibold text-foreground"> {activity.entity_name}</span>
                )}
              </p>
              {activity.details && (
                <p className="text-xs text-muted-foreground mt-0.5">{activity.details}</p>
              )}
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
