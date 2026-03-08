import { supabase } from "@/integrations/supabase/client";

type LogActivityParams = {
  action: string;
  entityType: "lead" | "contact" | "deal" | "note";
  entityId?: string;
  entityName?: string;
  details?: string;
};

export async function logActivity({ action, entityType, entityId, entityName, details }: LogActivityParams) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("activities").insert({
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName || null,
    details: details || null,
  });
}
