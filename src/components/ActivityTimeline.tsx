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
  lead: "bg-primary/10 text-primary",
  deal: "bg-chart-2/10 text-chart-2",
  contact: "bg-chart-3/10 text-chart-3",
  note: "bg-chart-4/10 text-chart-4",
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
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
        Loading activity...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Activity className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No activity yet. Start adding leads, deals, or contacts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => {
        const Icon = ICON_MAP[activity.entity_type] || Activity;
        const colorClass = COLOR_MAP[activity.entity_type] || "bg-muted text-muted-foreground";

        return (
          <div key={activity.id} className="flex gap-3 py-3">
            {/* Timeline line + icon */}
            <div className="flex flex-col items-center">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              {index < activities.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-1">
              <p className="text-sm">
                <span className="font-medium">{activity.action}</span>
                {activity.entity_name && (
                  <span className="text-foreground font-semibold"> {activity.entity_name}</span>
                )}
              </p>
              {activity.details && (
                <p className="text-xs text-muted-foreground mt-0.5">{activity.details}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
