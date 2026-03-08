import { useState, useCallback } from "react";
import { Bell, Check, Trash2, Clock, AlertCircle, Info, CheckCircle2, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotif,
  clearAllNotifications,
  type Notification,
} from "@/hooks/useNotifications";

const typeIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle,
};

const typeColors = {
  info: "text-blue-500 bg-blue-500/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  error: "text-destructive bg-destructive/10",
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationDropdown() {
  const { data: notifications = [], isLoading } = useNotifications();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [trashedItems, setTrashedItems] = useState<Notification[]>([]);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = async (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (notif && !notif.read) await markNotificationRead(id);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
  };

  // Move to trash (soft delete from view, keep in local state)
  const handleMoveToTrash = useCallback(async (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (notif) {
      setTrashedItems((prev) => [notif, ...prev.filter((t) => t.id !== id)]);
    }
    await deleteNotif(id);
    if (expandedId === id) setExpandedId(null);
  }, [notifications, expandedId]);

  // Restore from trash - re-insert into DB
  const handleRestore = useCallback(async (id: string) => {
    const item = trashedItems.find((t) => t.id === id);
    if (item) {
      // Re-insert to database
      const { supabase } = await import("@/integrations/supabase/client");
      await (supabase as any).from("notifications").insert({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type,
        read: item.read,
        created_at: item.created_at,
      });
      setTrashedItems((prev) => prev.filter((t) => t.id !== id));
    }
    // If trash is now empty, go back to main view
    if (trashedItems.length <= 1) setShowTrash(false);
  }, [trashedItems]);

  // Permanently delete from trash
  const handlePermanentDelete = useCallback((id: string) => {
    setTrashedItems((prev) => prev.filter((t) => t.id !== id));
    if (trashedItems.length <= 1) setShowTrash(false);
  }, [trashedItems]);

  // Delete all trashed permanently
  const handleDeleteAllTrashed = useCallback(() => {
    setTrashedItems([]);
    setShowTrash(false);
  }, []);

  // Restore all trashed
  const handleRestoreAll = useCallback(async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    for (const item of trashedItems) {
      await (supabase as any).from("notifications").insert({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type,
        read: item.read,
        created_at: item.created_at,
      });
    }
    setTrashedItems([]);
    setShowTrash(false);
  }, [trashedItems]);

  const handleClearAll = async () => {
    // Move all to trash first
    setTrashedItems((prev) => [...notifications, ...prev]);
    await clearAllNotifications();
    setExpandedId(null);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setShowTrash(false); setExpandedId(null); } }}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
          {showTrash ? (
            /* ===== TRASH VIEW ===== */
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowTrash(false)}>
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                  <h4 className="text-sm font-semibold text-foreground">Trash</h4>
                  {trashedItems.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {trashedItems.length}
                    </Badge>
                  )}
                </div>
                {trashedItems.length > 0 && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      onClick={handleRestoreAll}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore all
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                      onClick={handleDeleteAllTrashed}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete all
                    </Button>
                  </div>
                )}
              </div>
              {trashedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <Trash2 className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Trash is empty</p>
                </div>
              ) : (
                <ScrollArea className="max-h-80">
                  <div className="divide-y divide-border">
                    {trashedItems.map((notification) => {
                      const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Info;
                      return (
                        <div
                          key={notification.id}
                          className="flex gap-3 p-3 group hover:bg-muted/50"
                        >
                          <div
                            className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 opacity-50",
                              typeColors[notification.type as keyof typeof typeColors] || typeColors.info
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-tight text-foreground/60 line-through">
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-1 mt-1.5">
                              <Clock className="h-3 w-3 text-muted-foreground/60" />
                              <span className="text-[10px] text-muted-foreground/60">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              title="Restore"
                              onClick={() => handleRestore(notification.id)}
                            >
                              <RotateCcw className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              title="Delete permanently"
                              onClick={() => handlePermanentDelete(notification.id)}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </>
          ) : (
            /* ===== MAIN NOTIFICATIONS VIEW ===== */
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      onClick={handleMarkAllRead}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7 relative", trashedItems.length > 0 && "text-foreground")}
                    onClick={() => setShowTrash(true)}
                    title="View trash"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {trashedItems.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground flex items-center justify-center">
                        {trashedItems.length}
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <Bell className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? "Loading..." : "No notifications"}
                  </p>
                  {!isLoading && (
                    <p className="text-xs text-muted-foreground/60">You're all caught up!</p>
                  )}
                </div>
              ) : (
                <ScrollArea className="max-h-80">
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => {
                      const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Info;
                      const isExpanded = expandedId === notification.id;
                      return (
                        <Tooltip key={notification.id}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "flex gap-3 p-3 transition-all cursor-pointer group hover:bg-muted/50 active:scale-[0.99]",
                                !notification.read && "bg-primary/5",
                                isExpanded && "bg-muted/30"
                              )}
                              onClick={() => handleClick(notification.id)}
                            >
                              <div
                                className={cn(
                                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                                  typeColors[notification.type as keyof typeof typeColors] || typeColors.info
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className={cn(
                                      "text-sm leading-tight transition-colors",
                                      notification.read
                                        ? "text-foreground/80"
                                        : "text-foreground font-medium"
                                    )}
                                  >
                                    {notification.title}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveToTrash(notification.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                </div>
                                <div
                                  className={cn(
                                    "overflow-hidden transition-all duration-200",
                                    isExpanded ? "max-h-20 opacity-100 mt-1" : "max-h-0 opacity-0"
                                  )}
                                >
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {notification.message}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 mt-1.5">
                                  <Clock className="h-3 w-3 text-muted-foreground/60" />
                                  <span className="text-[10px] text-muted-foreground/60">
                                    {formatTimeAgo(notification.created_at)}
                                  </span>
                                  {!notification.read && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary ml-1" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="max-w-[220px] text-xs"
                            sideOffset={8}
                          >
                            <p className="font-medium mb-0.5">{notification.title}</p>
                            <p className="text-muted-foreground">{notification.message}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              {/* Footer */}
              {notifications.length > 0 && (
                <>
                  <Separator />
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground hover:text-destructive"
                      onClick={handleClearAll}
                    >
                      <Trash2 className="h-3 w-3 mr-1.5" />
                      Clear all notifications
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
