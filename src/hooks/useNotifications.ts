import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export async function createNotification(
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error" = "info"
) {
  const { error } = await (supabase as any).from("notifications").insert({
    title,
    message,
    type,
  });
  if (error) console.error("Failed to create notification:", error);
}

export async function markNotificationRead(id: string) {
  await (supabase as any).from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllNotificationsRead() {
  await (supabase as any).from("notifications").update({ read: true }).eq("read", false);
}

export async function deleteNotification(id: string) {
  await (supabase as any).from("notifications").delete().eq("id", id);
}

export async function clearAllNotifications() {
  await (supabase as any).from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}
