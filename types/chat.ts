// Chat types for Direct Messages, Groups, and Channels

export type ReceiptStatus = "pending" | "sent" | "delivered" | "read";
export type PresenceStatus = "online" | "away" | "offline";
export type ChatType = "dm" | "group" | "channel";

export type ChatMessage = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  receipt?: ReceiptStatus;
  replyToId?: string;
  forwardedFromId?: string;
  pinned?: boolean;
  edited?: boolean;
  deleted?: boolean;
  failed?: boolean;
  reactions?: Record<string, string[]>; // emoji -> userIds[]
};

export type BaseChatThread = {
  id: string;
  unread: number;
  typing: boolean;
  messages: ChatMessage[];
  lastMessage?: string;
  lastMessageAt?: string;
};

// Direct Message Thread
export type DMThread = BaseChatThread & {
  type: "dm";
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  presence: PresenceStatus;
  isBlocked?: boolean;
};

// Group Chat Thread
export type GroupThread = BaseChatThread & {
  type: "group";
  groupId: string;
  name: string;
  description?: string;
  icon?: string;
  members: GroupMember[];
  owner: string;
  isPrivate: boolean;
  notifications: "all" | "mentions" | "muted";
};

// Channel Thread
export type ChannelThread = BaseChatThread & {
  type: "channel";
  channelId: string;
  name: string;
  description?: string;
  icon?: string;
  members: ChannelMember[];
  moderators: string[];
  isPublic: boolean;
  notifications: "all" | "mentions" | "muted";
  pinned?: string[]; // message IDs
};

export type GroupMember = {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: "admin" | "member";
  joinedAt: string;
};

export type ChannelMember = {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  joinedAt: string;
};

export type ChatThread = DMThread | GroupThread | ChannelThread;

export type ChatListType = "dms" | "groups" | "channels";
