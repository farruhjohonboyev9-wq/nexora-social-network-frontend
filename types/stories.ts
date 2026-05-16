// Stories types

export type Story = {
  storyId: string;
  ownerId: string;
  ownerUsername: string;
  ownerDisplayName: string;
  ownerAvatar?: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  isViewed: boolean;
  viewers: StoryViewer[];
  reactions?: Record<string, number>;
  myReaction?: string | null;
};

export type StoryViewer = {
  viewerId: string;
  viewerUsername: string;
  viewerDisplayName: string;
  viewerAvatar?: string;
  viewedAt: string;
};

export type CreateStoryRequest = {
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  expiresInHours: number;
};
