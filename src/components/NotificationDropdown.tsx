import { useState } from "react";
import { Bell, Check, Trash2, Clock, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
}

const defaultNotifications: Notification[] = [
  {
    id: "1",
    title: "Payroll Processed",
    message: "March 2026 payroll has been successfully processed for 5 employees.",
    type: "success",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    read: false,
  },
  {
    id: "2",
    title: "Loan Payment Due",
    message: "Employee Juan Dela Cruz has a loan payment due in 3 days.",
    type: "warning",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
  },
  {
    id: "3",
    title: "New Employee Added",
    message: "Maria Santos has been added to the employee database.",
    type: "info",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
  },
  {
    id: "4",
    title: "System Maintenance",
    message: "Scheduled maintenance completed successfully.",
    type: "info",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    read: true,
  },
];

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

function formatTimeAgo(date: Date): string {
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
  const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    setExpandedId(expandedId === id ? null : id);
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={markAllAsRead}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No notifications</p>
            <p className="text-xs text-muted-foreground/60">You're all caught up!</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex gap-3 p-3 transition-colors hover:bg-muted/50 cursor-pointer group",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                        typeColors[notification.type]
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm leading-tight",
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
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary ml-1" />
                        )}
                      </div>
                    </div>
                  </div>
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
                onClick={clearAll}
              >
                <Trash2 className="h-3 w-3 mr-1.5" />
                Clear all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
