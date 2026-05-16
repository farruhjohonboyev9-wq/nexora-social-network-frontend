"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { getStoryReactionSummary, isGuid, isMediaApiEnabled, reactToStory, type StoryReactionType } from "@/lib/api/stories";
import type { Story } from "@/types/stories";

const STORY_DURATION_MS = 5000;
const MAX_STORY_VIDEO_SECONDS = 60;
const STORY_REACTIONS = ["like", "love", "fire", "clap", "wow", "sad"] as const;
const REACTION_EMOJI: Record<(typeof STORY_REACTIONS)[number], string> = {
  like: "👍",
  love: "❤️",
  fire: "🔥",
  clap: "👏",
  wow: "😮",
  sad: "😢"
};

//live demo mode conculusion 

const isDemoMode = () => {"siz bizning kuzatuvimiz ostidasiz.... iltimoi oz ip port manzilingizni yashirmang...!"}

// Demo stories data
const demoStories: Story[] = [
  {
    storyId: "story-1",
    ownerId: "u1",
    ownerUsername: "ali",
    ownerDisplayName: "Ali Rakhmonov",
    ownerAvatar: "👨‍💼",
    mediaUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=888&fit=crop",
    mediaType: "image",
    caption: "Launch kuni! 🚀 Nexora bilan yangi bosqich!",
    createdAt: "10:30",
    expiresAt: "2026-04-03 10:30",
    viewCount: 45,
    isViewed: true,
    reactions: { like: 8, love: 4, fire: 3 },
    myReaction: null,
    viewers: [
      {
        viewerId: "u2",
        viewerUsername: "dilnoza",
        viewerDisplayName: "Dilnoza Zarifova",
        viewedAt: "10:32"
      },
      {
        viewerId: "u3",
        viewerUsername: "javohir",
        viewerDisplayName: "Javohir Mirzaev",
        viewedAt: "10:35"
      }
    ]
  },
  {
    storyId: "story-2",
    ownerId: "u2",
    ownerUsername: "dilnoza",
    ownerDisplayName: "Dilnoza Zarifova",
    ownerAvatar: "👩‍💻",
    mediaUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=888&fit=crop",
    mediaType: "image",
    caption: "Uchrashuvlar oralig'ida kichik coffee break ☕",
    createdAt: "09:15",
    expiresAt: "2026-04-03 09:15",
    viewCount: 28,
    isViewed: false,
    reactions: { like: 6, wow: 2 },
    myReaction: null,
    viewers: []
  },
  {
    storyId: "story-3",
    ownerId: "u3",
    ownerUsername: "javohir",
    ownerDisplayName: "Javohir Mirzaev",
    ownerAvatar: "👨‍🎨",
    mediaUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=888&fit=crop",
    mediaType: "image",
    caption: "UI dizayn mockuplari tayyor 🎨",
    createdAt: "14:20",
    expiresAt: "2026-04-03 14:20",
    viewCount: 62,
    isViewed: true,
    reactions: { fire: 11, clap: 5 },
    myReaction: null,
    viewers: [
      {
        viewerId: "u1",
        viewerUsername: "ali",
        viewerDisplayName: "Ali Rakhmonov",
        viewedAt: "14:22"
      }
    ]
  },
  {
    storyId: "story-4",
    ownerId: "u4",
    ownerUsername: "zainab",
    ownerDisplayName: "Zainab Shodmonova",
    ownerAvatar: "👩‍🔬",
    mediaUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=888&fit=crop",
    mediaType: "image",
    caption: "Yangi feature lar juda tez kunda! 🎉",
    createdAt: "11:45",
    expiresAt: "2026-04-03 11:45",
    viewCount: 89,
    isViewed: false,
    reactions: { love: 14, like: 9, wow: 3 },
    myReaction: null,
    viewers: []
  }
];

export default function StoriesPage() {
  const router = useRouter();
  const [session] = useState(() => getSession());
  const [stories, setStories] = useState<Story[]>(demoStories);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [newStoryCaption, setNewStoryCaption] = useState("");
  const [newStoryUrl, setNewStoryUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [isReactionSyncing, setIsReactionSyncing] = useState(false);

  useEffect(() => {
    if (!session?.userId) {
      router.replace("/login");
    }
  }, [router, session?.userId]);

  useEffect(() => {
    if (!session?.userId) {
      return;
    }

    const key = `nexora_stories_state_${session.userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Story[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setStories(parsed);
      }
    } catch {
      // Keep default stories when persisted payload is invalid.
    }
  }, [session?.userId]);

  useEffect(() => {
    if (!session?.userId) {
      return;
    }

    const key = `nexora_stories_state_${session.userId}`;
    localStorage.setItem(key, JSON.stringify(stories));
  }, [session?.userId, stories]);

  useEffect(() => {
    if (!session?.userId || stories.length === 0) {
      return;
    }

    const current = stories[currentStoryIndex];
    if (!current) {
      return;
    }

    setIsMediaReady(false);
    setProgress(0);
    setShowViewers(false);

    setStories((prev) => {
      let changed = false;
      const next = prev.map((story) => {
        if (story.storyId !== current.storyId || story.isViewed) {
          return story;
        }

        changed = true;
        return {
          ...story,
          isViewed: true,
          viewCount: story.viewCount + 1,
          viewers: [
            ...story.viewers,
            {
              viewerId: session.userId,
              viewerUsername: session.username,
              viewerDisplayName: session.username,
              viewedAt: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })
            }
          ]
        };
      });

      return changed ? next : prev;
    });
  }, [currentStoryIndex, session?.userId, session?.username, stories]);

  useEffect(() => {
    if (!isMediaReady || isPaused || showCreateDialog || showViewers || stories.length === 0) {
      return;
    }

    const tick = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / (STORY_DURATION_MS / 100));
        if (next >= 100) {
          setCurrentStoryIndex((current) => (current < stories.length - 1 ? current + 1 : 0));
          return 0;
        }

        return next;
      });
    }, 100);

    return () => window.clearInterval(tick);
  }, [isMediaReady, isPaused, showCreateDialog, showViewers, stories.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        setCurrentStoryIndex((current) => (current < stories.length - 1 ? current + 1 : 0));
      }
      if (event.key === "ArrowLeft") {
        setCurrentStoryIndex((current) => (current > 0 ? current - 1 : stories.length - 1));
      }
      if (event.key === " ") {
        event.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stories.length]);

  const activeStoryId = stories[currentStoryIndex]?.storyId;

  useEffect(() => {
    if (!session?.accessToken || !activeStoryId || !isMediaApiEnabled() || !isGuid(activeStoryId)) {
      return;
    }

    let cancelled = false;

    const syncReactionSummary = async () => {
      const summary = await getStoryReactionSummary(activeStoryId, session);
      if (cancelled || !summary.success) {
        return;
      }

      setStories((prev) => {
        let changed = false;
        const next = prev.map((entry) => {
          if (entry.storyId !== activeStoryId) {
            return entry;
          }

          const sameCounts = JSON.stringify(entry.reactions ?? {}) === JSON.stringify(summary.counts ?? {});
          const sameReaction = (entry.myReaction ?? null) === (summary.myReaction ?? null);
          if (sameCounts && sameReaction) {
            return entry;
          }

          changed = true;
          return {
            ...entry,
            reactions: summary.counts,
            myReaction: summary.myReaction
          };
        });

        return changed ? next : prev;
      });
    };

    void syncReactionSummary();

    return () => {
      cancelled = true;
    };
  }, [activeStoryId, session, currentStoryIndex]);

  if (!session?.userId) {
    return null;
  }

  const currentStory = stories[currentStoryIndex];
  const viewedCount = stories.filter((entry) => entry.isViewed).length;
  const unviewedCount = Math.max(0, stories.length - viewedCount);
  const canGoNext = currentStoryIndex < stories.length - 1;
  const canGoPrev = currentStoryIndex > 0;

  const progressSegments = useMemo(
    () =>
      stories.map((story, index) => {
        if (index < currentStoryIndex) {
          return { storyId: story.storyId, width: 100 };
        }
        if (index === currentStoryIndex) {
          return { storyId: story.storyId, width: progress };
        }
        return { storyId: story.storyId, width: 0 };
      }),
    [currentStoryIndex, progress, stories]
  );

  const handleNextStory = () => {
    if (canGoNext) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      setCurrentStoryIndex(0);
    }
  };

  const handlePrevStory = () => {
    if (canGoPrev) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      setCurrentStoryIndex(stories.length - 1);
    }
  };

  const isValidStoryUrl = (value: string): boolean => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const getVideoDurationSeconds = (url: string): Promise<number | null> =>
    new Promise((resolve) => {
      const video = document.createElement("video");
      let done = false;

      const finalize = (value: number | null) => {
        if (done) {
          return;
        }
        done = true;
        video.removeAttribute("src");
        video.load();
        resolve(value);
      };

      const timeout = window.setTimeout(() => {
        finalize(null);
      }, 8000);

      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        finalize(Number.isFinite(video.duration) ? video.duration : null);
      };

      video.onerror = () => {
        window.clearTimeout(timeout);
        finalize(null);
      };

      video.src = url;
    });

  const handleCreateStory = async () => {
    const url = newStoryUrl.trim();
    const caption = newStoryCaption.trim();

    if (!url || !caption) {
      setStoryError("Story uchun URL va matnni to'ldiring.");
      return;
    }

    if (!isValidStoryUrl(url)) {
      setStoryError("To'g'ri URL kiriting (http yoki https bilan). ");
      return;
    }

    const lower = url.toLowerCase();
    const mediaType = lower.endsWith(".mp4") || lower.includes("video") ? "video" : "image";

    if (mediaType === "video") {
      setIsCreatingStory(true);
      const duration = await getVideoDurationSeconds(url);
      setIsCreatingStory(false);

      if (duration === null) {
        setStoryError("Video davomiyligini aniqlab bo'lmadi. Iltimos, boshqa video URL kiriting.");
        return;
      }

      if (duration > MAX_STORY_VIDEO_SECONDS) {
        setStoryError("Video 60 sekunddan oshmasligi kerak.");
        return;
      }
    }

    const newStory: Story = {
      storyId: `story-${Date.now()}`,
      ownerId: session.userId,
      ownerUsername: session.username,
      ownerDisplayName: session.username,
      mediaUrl: url,
      mediaType,
      caption,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      viewCount: 0,
      isViewed: true,
      reactions: {},
      myReaction: null,
      viewers: []
    };

    setStories([newStory, ...stories]);
    setShowCreateDialog(false);
    setNewStoryCaption("");
    setNewStoryUrl("");
    setStoryError(null);
    setCurrentStoryIndex(0);
  };

  const handleReactToCurrentStory = async (reactionType: StoryReactionType) => {
    const story = stories[currentStoryIndex];
    if (!story) {
      return;
    }

    setStories((prev) =>
      prev.map((entry, idx) => {
        if (idx !== currentStoryIndex) {
          return entry;
        }

        const currentCounts = { ...(entry.reactions ?? {}) };
        const currentMyReaction = entry.myReaction ?? null;

        if (currentMyReaction === reactionType) {
          const updated = Math.max(0, (currentCounts[reactionType] ?? 1) - 1);
          if (updated === 0) {
            delete currentCounts[reactionType];
          } else {
            currentCounts[reactionType] = updated;
          }

          return {
            ...entry,
            reactions: currentCounts,
            myReaction: null
          };
        }

        if (currentMyReaction) {
          const prevCount = Math.max(0, (currentCounts[currentMyReaction] ?? 1) - 1);
          if (prevCount === 0) {
            delete currentCounts[currentMyReaction];
          } else {
            currentCounts[currentMyReaction] = prevCount;
          }
        }

        currentCounts[reactionType] = (currentCounts[reactionType] ?? 0) + 1;

        return {
          ...entry,
          reactions: currentCounts,
          myReaction: reactionType
        };
      })
    );

    if (!session?.accessToken || !isMediaApiEnabled() || !isGuid(story.storyId)) {
      return;
    }

    setIsReactionSyncing(true);
    const reactResult = await reactToStory(story.storyId, reactionType, session);
    if (!reactResult.success) {
      setStoryError(reactResult.message ?? "Reaction yuborilmadi.");
      setIsReactionSyncing(false);
      return;
    }

    const summary = await getStoryReactionSummary(story.storyId, session);
    if (summary.success) {
      setStories((prev) =>
        prev.map((entry) =>
          entry.storyId === story.storyId
            ? {
                ...entry,
                reactions: summary.counts,
                myReaction: summary.myReaction
              }
            : entry
        )
      );
      setStoryError(null);
    } else {
      setStoryError(summary.message ?? "Reaction holatini yangilab bo'lmadi.");
    }

    setIsReactionSyncing(false);
  };

  return (
    <main className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
        <Link href="/home" className="text-white font-bold text-lg">
          ← Nexora Stories
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300">Ko'rilmagan: {unviewedCount}</span>
          <button
            onClick={() => {
              setStoryError(null);
              setShowCreateDialog(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            + Story qo'shish
          </button>
        </div>
      </div>

      {/* Story Tray */}
      <div className="mx-auto flex max-w-5xl gap-3 overflow-x-auto px-4 py-4">
        {stories.map((story, index) => (
          <button
            key={story.storyId}
            type="button"
            onClick={() => setCurrentStoryIndex(index)}
            className={`flex min-w-[92px] flex-col items-center gap-2 rounded-xl px-2 py-2 transition ${
              index === currentStoryIndex ? "bg-slate-800" : "hover:bg-slate-900"
            }`}
          >
            <div
              className={`h-14 w-14 rounded-full p-[2px] ${
                story.isViewed ? "bg-slate-600" : "bg-gradient-to-tr from-pink-500 via-orange-400 to-yellow-300"
              }`}
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-2xl">
                {story.ownerAvatar ?? "👤"}
              </div>
            </div>
            <span className="max-w-[84px] truncate text-xs text-slate-300">{story.ownerDisplayName}</span>
          </button>
        ))}
      </div>

      {/* Main Story Viewer */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] gap-4">
        {/* Previous Button */}
        {stories.length > 1 && (
          <button
            onClick={handlePrevStory}
            className="text-white text-4xl hover:opacity-70 transition-opacity"
          >
            ❮
          </button>
        )}

        {/* Story Container */}
        {currentStory && (
          <div
            className="relative w-full max-w-sm h-[600px] bg-black rounded-2xl overflow-hidden shadow-2xl"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Progress Bar */}
            <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
              {progressSegments.map((segment) => (
                <div key={segment.storyId} className="h-1 flex-1 rounded bg-slate-700/70">
                  <div
                    className="h-full rounded bg-blue-500 transition-all duration-100"
                    style={{ width: `${segment.width}%` }}
                  />
                </div>
              ))}
            </div>

            {/* Story Header */}
            <div className="absolute top-6 left-4 right-4 z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{currentStory.ownerAvatar}</div>
                <div>
                  <p className="text-white font-semibold">{currentStory.ownerDisplayName}</p>
                  <p className="text-slate-300 text-xs">{currentStory.createdAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused((prev) => !prev)}
                  className="rounded-full bg-slate-900/60 px-2 py-1 text-xs text-white hover:bg-slate-900"
                >
                  {isPaused ? "Play" : "Pause"}
                </button>
                <button
                  onClick={() => setShowViewers(!showViewers)}
                  className="text-white text-xl hover:opacity-70"
                >
                  👁️
                </button>
              </div>
            </div>

            {/* Story Media */}
            {currentStory.mediaType === "video" ? (
              <video
                src={currentStory.mediaUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                onLoadedData={() => setIsMediaReady(true)}
              />
            ) : (
              <img
                src={currentStory.mediaUrl}
                alt={currentStory.caption}
                className="w-full h-full object-cover"
                onLoad={() => setIsMediaReady(true)}
                onError={() => {
                  setIsMediaReady(true);
                  setStoryError("Story media yuklanmadi. Boshqa storyga o'ting.");
                }}
              />
            )}

            {/* Story Caption */}
            {currentStory.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                <p className="text-white text-lg font-medium">{currentStory.caption}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {STORY_REACTIONS.map((reaction) => {
                    const active = currentStory.myReaction === reaction;
                    return (
                      <button
                        key={reaction}
                        type="button"
                        onClick={() => handleReactToCurrentStory(reaction)}
                        disabled={isReactionSyncing}
                        className={`rounded-full border px-2 py-1 text-xs transition ${
                          active
                            ? "border-blue-400 bg-blue-500/20 text-blue-200"
                            : "border-slate-500/60 bg-slate-900/50 text-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {REACTION_EMOJI[reaction]} {currentStory.reactions?.[reaction] ?? 0}
                      </button>
                    );
                  })}
                </div>
                {isReactionSyncing ? <p className="mt-2 text-xs text-slate-300">Reaction sync qilinmoqda...</p> : null}
                {storyError ? <p className="mt-2 text-xs text-rose-300">{storyError}</p> : null}
              </div>
            )}

            {/* Viewers Panel */}
            {showViewers && currentStory.viewers.length > 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-90 z-20 overflow-y-auto p-4">
                <h3 className="text-white font-bold text-lg mb-4">
                  {currentStory.viewCount} marta ko'rilgan
                </h3>
                <div className="space-y-3">
                  {currentStory.viewers.map((viewer) => (
                    <div key={viewer.viewerId} className="flex items-center gap-3">
                      <div className="text-3xl">👤</div>
                      <div>
                        <p className="text-white font-medium">{viewer.viewerDisplayName}</p>
                        <p className="text-slate-400 text-sm">@{viewer.viewerUsername}</p>
                        <p className="text-slate-500 text-xs">Ko'rilgan vaqt: {viewer.viewedAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowViewers(false)}
                  className="mt-6 w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                >
                  Yopish
                </button>
              </div>
            )}

            {/* Click Area for Next */}
            <button
              onClick={handleNextStory}
              className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
            />
          </div>
        )}

        {/* Next Button */}
        {stories.length > 1 && (
          <button
            onClick={handleNextStory}
            className="text-white text-4xl hover:opacity-70 transition-opacity"
          >
            ❯
          </button>
        )}
      </div>

      {/* Story Counter */}
      <div className="text-center pb-6 text-slate-400 text-sm">
        Story {currentStoryIndex + 1} / {stories.length} | Ko'rilgan: {viewedCount}
      </div>

      {/* Create Story Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl max-w-md w-full mx-4 border border-slate-700">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Yangi story qo'shish</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Media URL
                </label>
                <input
                  type="url"
                  value={newStoryUrl}
                  onChange={(e) => setNewStoryUrl(e.target.value)}
                  placeholder="https://example.com/rasm.jpg"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-2 text-xs text-slate-400">Video yuklasangiz, uzunligi 60 sekunddan oshmasligi kerak.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Matn
                </label>
                <textarea
                  value={newStoryCaption}
                  onChange={(e) => setNewStoryCaption(e.target.value)}
                  placeholder="Story uchun qisqa matn yozing..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {storyError ? (
                <p className="rounded bg-rose-950/40 px-3 py-2 text-sm text-rose-300">{storyError}</p>
              ) : null}

              <div className="bg-slate-800 p-3 rounded text-slate-400 text-sm">
                <p>💡 Tezkor test uchun:</p>
                <p className="text-xs mt-2">unsplash.com/photos (bepul rasmlar)</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-lg font-medium transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleCreateStory}
                  disabled={!newStoryUrl.trim() || !newStoryCaption.trim() || isCreatingStory}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
                >
                  {isCreatingStory ? "Tekshirilmoqda..." : "Story joylash"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


