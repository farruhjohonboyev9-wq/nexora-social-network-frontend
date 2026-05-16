"use client";

import { useEffect, useRef, useState } from "react";

import type { FeedPost, StoryItem } from "@/components/home/home-data";

type FeedColumnProps = {
  stories: StoryItem[];
  posts: FeedPost[];
  likedPostIds: Set<string>;
  followedHandles: Set<string>;
  commentsByPost: Record<string, string[]>;
  draft: string;
  uploadLabel: string;
  isLoadingMore: boolean;
  onDraftChange: (value: string) => void;
  onUpload: (fileName: string) => void;
  onCreatePost: () => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onToggleFollow: (handle: string) => void;
  onLoadMore: () => void;
};

function PostAction({
  label,
  value,
  isActive,
  onClick
}: {
  label: string;
  value: number;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm transition ${
        isActive
          ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      }`}
    >
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </button>
  );
}

function SkeletonPost() {
  return (
    <article className="nexora-panel overflow-hidden p-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-11/12 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="mt-4 h-56 rounded-[28px] bg-slate-200 dark:bg-slate-700" />
    </article>
  );
}

export function FeedColumn({
  stories,
  posts,
  likedPostIds,
  followedHandles,
  commentsByPost,
  draft,
  uploadLabel,
  isLoadingMore,
  onDraftChange,
  onUpload,
  onCreatePost,
  onToggleLike,
  onAddComment,
  onToggleFollow,
  onLoadMore
}: FeedColumnProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onLoadMore();
          }
        });
      },
      { rootMargin: "220px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [onLoadMore]);

  return (
    <section className="min-w-0 space-y-4">
      <div className="nexora-panel overflow-hidden p-4 sm:p-5">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {stories.map((story) => (
            <div key={story.id} className="flex min-w-[74px] flex-col items-center gap-2 text-center">
              <div className={`story-ring bg-gradient-to-br ${story.accent}`}>
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm font-bold text-slate-900 dark:bg-slate-900 dark:text-white">
                  {story.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{story.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="nexora-panel p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#06b6d4_100%)] text-sm font-bold text-white shadow-[0_18px_45px_rgba(8,47,73,0.35)]">
            ME
          </div>
          <div className="min-w-0 flex-1">
            <textarea
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder="Nimani bo'lishmoqchisiz?"
              rows={3}
              className="auth-ring w-full resize-none rounded-[26px] border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white">
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(event) => onUpload(event.target.files?.[0]?.name ?? "")}
                />
                <span>Upload image/video</span>
                {uploadLabel ? <span className="max-w-[180px] truncate text-xs text-slate-400">{uploadLabel}</span> : null}
              </label>

              <button
                type="button"
                onClick={onCreatePost}
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Joylash
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((post, index) => (
          <article key={post.id} className="nexora-panel overflow-hidden p-5 sm:p-6" style={{ animationDelay: `${index * 80}ms` }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                  {post.user.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-950 dark:text-white">{post.user.name}</p>
                    {post.user.verified ? <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">Tasdiqlangan</span> : null}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{post.user.handle} · {post.time}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleFollow(post.user.handle)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  followedHandles.has(post.user.handle)
                    ? "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                {followedHandles.has(post.user.handle) ? "Kuzatilmoqda" : "Kuzatish"}
              </button>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-200">{post.text}</p>

            {post.media ? (
              <div className={`mt-4 overflow-hidden rounded-[28px] bg-gradient-to-br ${post.media.accent} p-[1px] shadow-[0_24px_70px_rgba(15,23,42,0.12)]`}>
                <div className="relative flex h-72 items-end overflow-hidden rounded-[27px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.42))] p-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">{post.media.type}</p>
                    <h3 className="mt-2 font-[var(--font-display)] text-2xl font-bold text-white">{post.media.title}</h3>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="flex flex-wrap gap-1">
                <PostAction
                  label="Layk"
                  value={post.likes}
                  isActive={likedPostIds.has(post.id)}
                  onClick={() => onToggleLike(post.id)}
                />
                <PostAction
                  label="Izoh"
                  value={post.comments}
                  isActive={activeCommentPostId === post.id}
                  onClick={() =>
                    setActiveCommentPostId((current) => (current === post.id ? null : post.id))
                  }
                />
                <PostAction label="Ulashish" value={post.shares} />
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{post.likes + post.comments + post.shares} ta interaksiya</p>
            </div>

            {activeCommentPostId === post.id ? (
              <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentDrafts[post.id] ?? ""}
                    onChange={(event) =>
                      setCommentDrafts((current) => ({
                        ...current,
                        [post.id]: event.target.value
                      }))
                    }
                    placeholder="Izoh yozing..."
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const text = (commentDrafts[post.id] ?? "").trim();
                      if (!text) {
                        return;
                      }
                      onAddComment(post.id, text);
                      setCommentDrafts((current) => ({ ...current, [post.id]: "" }));
                    }}
                    className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    Yuborish
                  </button>
                </div>

                {(commentsByPost[post.id]?.length ?? 0) > 0 ? (
                  <div className="space-y-2">
                    {(commentsByPost[post.id] ?? []).slice(0, 3).map((comment, commentIndex) => (
                      <p
                        key={`${post.id}-comment-${commentIndex}`}
                        className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {comment}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Hali izoh yo'q. Birinchi bo'ling.</p>
                )}
              </div>
            ) : null}
          </article>
        ))}

        {isLoadingMore ? (
          <>
            <SkeletonPost />
            <SkeletonPost />
          </>
        ) : null}

        <div ref={sentinelRef} className="h-4" />
      </div>
    </section>
  );
}