"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedColumn } from "@/components/home/FeedColumn";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { RightRail } from "@/components/home/RightRail";
import { SidebarNav } from "@/components/home/SidebarNav";
import { initialPosts, makeMorePosts, navItems, stories, suggestedUsers, trends, type FeedPost } from "@/components/home/home-data";
import { clearSession, getLastLoginAt, getSession } from "@/lib/session";
import { logout } from "@/lib/api/auth";
import {
  emitSocialSyncEvent,
  loadSocialNotifications,
  loadSocialState,
  openSocialSyncSocket,
  saveSocialNotifications,
  saveSocialState,
  subscribeSocialSyncEvents
} from "@/lib/api/social";
import type { UserSessionData } from "@/types/auth";
import type { SocialNotification } from "@/types/social";

const HOME_SOCIAL_STATE_VERSION = 1;

type PersistedHomeSocialState = {
  version: number;
  posts: FeedPost[];
  likedPostIds: string[];
  followedHandles: string[];
  commentsByPost: Record<string, string[]>;
  socialStats: {
    follows: number;
    likesGiven: number;
    commentsSent: number;
  };
};

export default function HomePage() {
  const router = useRouter();
  const sourceIdRef = useRef(`home-${Math.random().toString(36).slice(2, 10)}`);
  const socialSocketRef = useRef<{ publish: (event: { type: "notifications-updated"; userId: string; source: string; at: string }) => void; close: () => void } | null>(null);
  const [session, setSession] = useState<UserSessionData | null>(null);
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [followedHandles, setFollowedHandles] = useState<Set<string>>(new Set());
  const [commentsByPost, setCommentsByPost] = useState<Record<string, string[]>>({});
  const [socialStats, setSocialStats] = useState({
    follows: 0,
    likesGiven: 0,
    commentsSent: 0
  });
  const [draft, setDraft] = useState("");
  const [uploadLabel, setUploadLabel] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace("/login");
      return;
    }

    setSession(current);
    setLastLoginAt(getLastLoginAt());
  }, [router]);

  useEffect(() => {
    if (!session?.userId) {
      return;
    }

    let alive = true;

    const refreshCount = async () => {
      const notifications = await loadSocialNotifications(session.userId);
      if (!alive) {
        return;
      }
      setNotificationCount(notifications.filter((entry) => !entry.isRead).length);
    };

    void refreshCount();

    const handleSync = (event: { type: string; userId: string; source: string }) => {
      if (
        event.userId !== session.userId
        || event.type !== "notifications-updated"
        || event.source === sourceIdRef.current
      ) {
        return;
      }

      void refreshCount();
    };

    const unsubscribe = subscribeSocialSyncEvents(handleSync);
    const socket = openSocialSyncSocket(session.userId, handleSync);
    socialSocketRef.current = socket;

    return () => {
      alive = false;
      unsubscribe();
      socket.close();
      socialSocketRef.current = null;
    };
  }, [session?.userId]);

  useEffect(() => {
    if (!session?.userId) {
      return;
    }

    let alive = true;

    const hydrate = async () => {
      const parsed = await loadSocialState<Partial<PersistedHomeSocialState>>(session.userId);
      if (!alive || !parsed) {
        return;
      }

      if (parsed.version !== HOME_SOCIAL_STATE_VERSION) {
        return;
      }

      if (Array.isArray(parsed.posts)) {
        setPosts(parsed.posts);
      }

      setLikedPostIds(new Set(Array.isArray(parsed.likedPostIds) ? parsed.likedPostIds : []));
      setFollowedHandles(new Set(Array.isArray(parsed.followedHandles) ? parsed.followedHandles : []));
      setCommentsByPost(
        typeof parsed.commentsByPost === "object" && parsed.commentsByPost !== null
          ? parsed.commentsByPost
          : {}
      );

      setSocialStats({
        follows: parsed.socialStats?.follows ?? 0,
        likesGiven: parsed.socialStats?.likesGiven ?? 0,
        commentsSent: parsed.socialStats?.commentsSent ?? 0
      });
    };

    void hydrate();

    return () => {
      alive = false;
    };
  }, [session?.userId]);

  useEffect(() => {
    if (!session?.userId) {
      return;
    }

    const payload: PersistedHomeSocialState = {
      version: HOME_SOCIAL_STATE_VERSION,
      posts,
      likedPostIds: Array.from(likedPostIds),
      followedHandles: Array.from(followedHandles),
      commentsByPost,
      socialStats
    };

    void saveSocialState(session.userId, payload);
  }, [
    session?.userId,
    posts,
    likedPostIds,
    followedHandles,
    commentsByPost,
    socialStats
  ]);

  const pushSelfNotification = (type: SocialNotification["type"], action: string, targetContent?: string) => {
    if (!session?.userId) {
      return;
    }

    void (async () => {
      const current = await loadSocialNotifications(session.userId);
      const next: SocialNotification[] = [
        {
          id: `self-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type,
          actor: {
            name: session.username,
            username: session.username.toLowerCase(),
            avatar: (session.username.slice(0, 2).toUpperCase() || "ME")
          },
          action,
          targetContent,
          timestamp: "Just now",
          isRead: false
        },
        ...current
      ].slice(0, 120);

      await saveSocialNotifications(session.userId, next);
      setNotificationCount(next.filter((entry) => !entry.isRead).length);

      const event = {
        type: "notifications-updated" as const,
        userId: session.userId,
        source: sourceIdRef.current,
        at: new Date().toISOString()
      };
      emitSocialSyncEvent(event);

      socialSocketRef.current?.publish(event);
    })();
  };

  const onLogout = async () => {
    try {
      await logout();
    } finally {
      clearSession();
      router.replace("/login");
    }
  };

  const filteredPosts = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) {
      return posts;
    }

    return posts.filter((post) => {
      return (
        post.text.toLowerCase().includes(query)
        || post.user.name.toLowerCase().includes(query)
        || post.user.handle.toLowerCase().includes(query)
      );
    });
  }, [deferredSearch, posts]);

  const createPost = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    const nextPost: FeedPost = {
      id: `draft-${Date.now()}`,
      user: {
        name: session?.username ?? "You",
        handle: session?.username ? `@${session.username.toLowerCase()}` : "@you",
        avatar: (session?.username ?? "YO").slice(0, 2).toUpperCase(),
        verified: session?.role === "Admin"
      },
      time: "Just now",
      text,
      media: uploadLabel
        ? {
            type: uploadLabel.match(/\.(mp4|mov|avi|webm)$/i) ? "video" : "image",
            title: uploadLabel,
            accent: "from-cyan-500 via-sky-400 to-indigo-300"
          }
        : undefined,
      likes: 0,
      comments: 0,
      shares: 0
    };

    setPosts((current) => [nextPost, ...current]);
    setDraft("");
    setUploadLabel("");
  };

  const loadMorePosts = () => {
    if (isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    window.setTimeout(() => {
      setPosts((current) => [...current, ...makeMorePosts(current.length)]);
      setIsLoadingMore(false);
    }, 900);
  };

  const toggleLike = (postId: string) => {
    const wasLiked = likedPostIds.has(postId);
    setLikedPostIds((current) => {
      const next = new Set(current);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, likes: Math.max(0, post.likes + (wasLiked ? -1 : 1)) }
          : post
      )
    );

    setSocialStats((current) => ({
      ...current,
      likesGiven: Math.max(0, current.likesGiven + (wasLiked ? -1 : 1))
    }));

    if (!wasLiked) {
      const target = posts.find((entry) => entry.id === postId)?.text;
      pushSelfNotification("like", "liked a post", target?.slice(0, 120));
    }
  };

  const addComment = (postId: string, text: string) => {
    const value = text.trim();
    if (!value) {
      return;
    }

    setCommentsByPost((current) => ({
      ...current,
      [postId]: [value, ...(current[postId] ?? [])]
    }));

    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, comments: post.comments + 1 } : post
      )
    );

    setSocialStats((current) => ({
      ...current,
      commentsSent: current.commentsSent + 1
    }));

    pushSelfNotification("comment", "commented on a post", value.slice(0, 120));
  };

  const toggleFollow = (handle: string) => {
    const wasFollowing = followedHandles.has(handle);
    setFollowedHandles((current) => {
      const next = new Set(current);
      if (next.has(handle)) {
        next.delete(handle);
      } else {
        next.add(handle);
      }
      return next;
    });

    setSocialStats((current) => ({
      ...current,
      follows: Math.max(0, current.follows + (wasFollowing ? -1 : 1))
    }));

    if (!wasFollowing) {
      pushSelfNotification("follow", `started following ${handle}`);
    }
  };

  return (
    <main className="px-3 py-4 sm:px-5 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-4 lg:gap-6">
        <HomeNavbar
          search={search}
          onSearchChange={setSearch}
          notificationCount={notificationCount}
          username={session?.username ?? "you"}
          onLogout={onLogout}
        />

        <section className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_330px]">
          <SidebarNav items={navItems} activeItem="home" />

          <div className="space-y-4">
            {!session?.profileCompleted ? (
              <section className="nexora-panel border border-amber-200/70 bg-amber-50/90 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-900/20 dark:text-amber-200">
                Profile hali to‘liq emas. Full reach va creator tools uchun profile setup’ni yakunlang.
              </section>
            ) : null}

            <FeedColumn
              stories={stories}
              posts={filteredPosts}
              likedPostIds={likedPostIds}
              followedHandles={followedHandles}
              commentsByPost={commentsByPost}
              draft={draft}
              uploadLabel={uploadLabel}
              isLoadingMore={isLoadingMore}
              onDraftChange={setDraft}
              onUpload={setUploadLabel}
              onCreatePost={createPost}
              onToggleLike={toggleLike}
              onAddComment={addComment}
              onToggleFollow={toggleFollow}
              onLoadMore={loadMorePosts}
            />
          </div>

          <RightRail
            session={session}
            lastLoginAt={lastLoginAt}
            suggestedUsers={suggestedUsers}
            trends={trends}
            followedHandles={followedHandles}
            onToggleFollow={toggleFollow}
            socialStats={socialStats}
          />
        </section>
      </div>
    </main>
  );
}
