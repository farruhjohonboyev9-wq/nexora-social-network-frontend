export type NotificationType = "like" | "follow" | "comment" | "share" | "mention" | "story-view";

export type SocialNotification = {
  id: string;
  type: NotificationType;
  actor: {
    name: string;
    username: string;
    avatar: string;
  };
  action: string;
  targetContent?: string;
  timestamp: string;
  isRead: boolean;
  relatedId?: string;
};

export type SocialSyncEventType = "home-state-updated" | "notifications-updated";

export type SocialSyncEvent = {
  type: SocialSyncEventType;
  userId: string;
  source: string;
  at: string;
};
