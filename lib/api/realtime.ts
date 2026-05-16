export type RealtimeConnectionState = "connecting" | "connected" | "disconnected" | "error";

export enum ChatType {
  ONE_TO_ONE = "ONE_TO_ONE",
  GROUP = "GROUP",
  CHANNEL = "CHANNEL",
}

export type ReceiptStatus = "sent" | "delivered" | "read";

export interface ChatRoom {
  id: string;
  name: string;
  type: ChatType;
  description: string;
  owner_id: string;
  members: string[];
  is_archived: boolean;
  created_at: string;
}

type PendingResolver = (ok: boolean) => void;

type PendingRequest = {
  resolve: PendingResolver;
  timerId: ReturnType<typeof setTimeout>;
};

export class RealtimeSocketClient {
  private socket: WebSocket | null = null;
  private readonly pending: PendingRequest[] = [];

  constructor(
    private readonly url: string,
    private readonly userId: string,
    private readonly onStateChange: (state: RealtimeConnectionState) => void
  ) {}

  async connect(): Promise<boolean> {
    if (typeof window === "undefined") {
      return false;
    }

    // Ensure a fresh socket lifecycle for explicit reconnect attempts.
    this.close();

    this.onStateChange("connecting");

    return new Promise<boolean>((resolve) => {
      let finished = false;

      const finish = (ok: boolean) => {
        if (finished) {
          return;
        }
        finished = true;
        resolve(ok);
      };

      try {
        this.socket = new WebSocket(this.url);
      } catch {
        this.onStateChange("error");
        finish(false);
        return;
      }

      const socket = this.socket;
      const openTimeout = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          socket.close();
          this.onStateChange("error");
          finish(false);
        }
      }, 8000);

      socket.onopen = async () => {
        clearTimeout(openTimeout);
        this.onStateChange("connected");
        const ok = await this.sendCommand(`CONNECT ${this.userId}`);
        finish(ok);
      };

      socket.onmessage = (event) => {
        const text = String(event.data ?? "").trim().toUpperCase();
        const pending = this.pending.shift();
        if (pending) {
          clearTimeout(pending.timerId);
          pending.resolve(text === "OK");
        }
      };

      socket.onerror = () => {
        clearTimeout(openTimeout);
        this.onStateChange("error");
        finish(false);
      };

      socket.onclose = () => {
        clearTimeout(openTimeout);
        this.onStateChange("disconnected");
        while (this.pending.length > 0) {
          const pending = this.pending.shift();
          if (pending) {
            clearTimeout(pending.timerId);
            pending.resolve(false);
          }
        }
        finish(false);
      };
    });
  }

  async sendCommand(frame: string, timeoutMs = 5000): Promise<boolean> {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      const timerId = setTimeout(() => {
        const idx = this.pending.findIndex((entry) => entry.resolve === resolve);
        if (idx >= 0) {
          this.pending.splice(idx, 1);
        }
        resolve(false);
      }, timeoutMs);

      this.pending.push({ resolve, timerId });
      socket.send(frame);
    });
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    while (this.pending.length > 0) {
      const pending = this.pending.shift();
      if (pending) {
        clearTimeout(pending.timerId);
        pending.resolve(false);
      }
    }
  }

  // Group and channel operations
  async createGroup(
    groupName: string,
    description: string,
    memberIds: string[]
  ): Promise<boolean> {
    const memberList = memberIds.join(",");
    return this.sendCommand(`CREATE_GROUP ${groupName} ${description} ${memberList}`);
  }

  async createChannel(channelName: string, description: string): Promise<boolean> {
    return this.sendCommand(`CREATE_CHANNEL ${channelName} ${description}`);
  }

  async addMember(roomId: string, userId: string): Promise<boolean> {
    return this.sendCommand(`ADD_MEMBER ${roomId} ${userId}`);
  }

  async removeMember(roomId: string, userId: string): Promise<boolean> {
    return this.sendCommand(`REMOVE_MEMBER ${roomId} ${userId}`);
  }

  async listRooms(): Promise<boolean> {
    return this.sendCommand(`LIST_ROOMS`);
  }

  async getRoom(roomId: string): Promise<boolean> {
    return this.sendCommand(`GET_ROOM ${roomId}`);
  }

  async sendReceipt(path: string, messageId: string, status: ReceiptStatus): Promise<boolean> {
    return this.sendCommand(`RECEIPT ${path} ${messageId} ${status}`);
  }

  async reply(path: string, parentMessageId: string, text: string): Promise<boolean> {
    return this.sendCommand(`REPLY ${path} ${parentMessageId} ${text}`);
  }

  async forward(sourcePath: string, targetPath: string, messageId: string): Promise<boolean> {
    return this.sendCommand(`FORWARD ${sourcePath} ${targetPath} ${messageId}`);
  }

  async pin(path: string, messageId: string): Promise<boolean> {
    return this.sendCommand(`PIN ${path} ${messageId}`);
  }

  async unpin(path: string, messageId: string): Promise<boolean> {
    return this.sendCommand(`UNPIN ${path} ${messageId}`);
  }

  async promote(roomId: string, targetUserId: string, role: "admin" | "moderator" | "member"): Promise<boolean> {
    return this.sendCommand(`PROMOTE ${roomId} ${targetUserId} ${role}`);
  }

  async mute(roomId: string, targetUserId: string): Promise<boolean> {
    return this.sendCommand(`MUTE ${roomId} ${targetUserId}`);
  }

  async unmute(roomId: string, targetUserId: string): Promise<boolean> {
    return this.sendCommand(`UNMUTE ${roomId} ${targetUserId}`);
  }

  async invite(roomId: string, targetUserId: string): Promise<boolean> {
    return this.sendCommand(`INVITE ${roomId} ${targetUserId}`);
  }

  async acceptInvite(inviteId: string): Promise<boolean> {
    return this.sendCommand(`ACCEPT_INVITE ${inviteId}`);
  }

  async block(targetUserId: string): Promise<boolean> {
    return this.sendCommand(`BLOCK ${targetUserId}`);
  }

  async unblock(targetUserId: string): Promise<boolean> {
    return this.sendCommand(`UNBLOCK ${targetUserId}`);
  }

  async report(path: string, messageId: string, reason: string): Promise<boolean> {
    return this.sendCommand(`REPORT ${path} ${messageId} ${reason}`);
  }

  async resolveReport(reportId: string, actionNote: string): Promise<boolean> {
    return this.sendCommand(`RESOLVE_REPORT ${reportId} ${actionNote}`);
  }
}

export function roomPathFromThreadId(threadId: string): string {
  if (threadId.startsWith("room:")) {
    return `/ws/chat/${threadId.slice("room:".length)}`;
  }

  return `/ws/chat/${threadId}`;
}

export function dmTargetFromThreadId(threadId: string, selfUserId: string): string | null {
  if (!threadId.startsWith("dm:")) {
    return null;
  }

  const parts = threadId.split(":");
  if (parts.length < 3) {
    return null;
  }

  const participants = parts.slice(1);
  const target = participants.find((id) => id !== selfUserId) ?? participants[participants.length - 1];
  return target ?? null;
}

export function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

// Room type detection helpers
export function getRoomType(roomId: string): ChatType {
  if (roomId.startsWith("dm:")) {
    return ChatType.ONE_TO_ONE;
  }
  if (roomId.startsWith("grp:")) {
    return ChatType.GROUP;
  }
  if (roomId.startsWith("ch:")) {
    return ChatType.CHANNEL;
  }
  return ChatType.ONE_TO_ONE;  // Default
}

export function isOneToOne(roomId: string): boolean {
  return getRoomType(roomId) === ChatType.ONE_TO_ONE;
}

export function isGroup(roomId: string): boolean {
  return getRoomType(roomId) === ChatType.GROUP;
}

export function isChannel(roomId: string): boolean {
  return getRoomType(roomId) === ChatType.CHANNEL;
}

export function getChatPath(roomId: string): string {
  if (roomId.startsWith("dm:")) {
    // Extract target user from dm:user1:user2 format
    const parts = roomId.split(":");
    if (parts.length >= 2) {
      return `/ws/dm/${parts[parts.length - 1]}`;
    }
  }
  // For groups and channels, use chat path
  return `/ws/chat/${roomId}`;
}
