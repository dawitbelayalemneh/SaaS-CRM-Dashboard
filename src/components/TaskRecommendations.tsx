import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Phone, FileText, Calendar, Mail, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Task = {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
  related_to: string | null;
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

const CATEGORY_ICONS: Record<string, typeof Phone> = {
  "follow-up": Phone,
  proposal: FileText,
  meeting: Calendar,
  email: Mail,
  research: Search,
  update: RefreshCw,
};

interface TaskRecommendationsProps {
  leadId?: string;
  variant?: "card" | "inline";
}

export function TaskRecommendations({ leadId, variant = "inline" }: TaskRecommendationsProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in"); return; }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommend-tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ leadId: leadId || null }),
      });

      const result = await resp.json();
      if (!resp.ok) { toast.error(result.error || "Failed to get recommendations"); return; }
      setTasks(result.tasks || []);
      setLoaded(true);
    } catch {
      toast.error("Failed to get task recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (!loaded) {
    if (variant === "card") {
      return (
        <Card className="border-dashed">
          <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">AI Task Recommendations</p>
              <p className="text-xs text-muted-foreground mt-1">
                Get AI-suggested next actions based on your {leadId ? "lead" : "CRM"} activity.
              </p>
            </div>
            <Button onClick={fetchTasks} disabled={loading} variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              {loading ? "Analyzing..." : "Get Recommendations"}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Button variant="outline" size="sm" onClick={fetchTasks} disabled={loading} className="gap-1">
        <Sparkles className="h-3.5 w-3.5" />
        {loading ? "Analyzing..." : "AI Tasks"}
      </Button>
    );
  }

  const content = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Recommended Tasks
        </h4>
        <Button variant="ghost" size="sm" onClick={fetchTasks} disabled={loading} className="h-7 text-xs gap-1">
          <Sparkles className="h-3 w-3" /> {loading ? "..." : "Refresh"}
        </Button>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recommendations at this time.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task, i) => {
            const Icon = CATEGORY_ICONS[task.category] || Sparkles;
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="mt-0.5 shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{task.title}</p>
                    <Badge variant="outline" className={`shrink-0 text-[10px] ${PRIORITY_STYLES[task.priority]}`}>
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                  {task.related_to && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Related to: <span className="font-medium text-foreground">{task.related_to}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (variant === "card") {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI Task Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return content;
}
