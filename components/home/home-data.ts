export type MediaType = "image" | "video";

export type FeedPost = {
  id: string;
  user: {
    name: string;
    handle: string;
    avatar: string;
    verified?: boolean;
  };
  time: string;
  text: string;
  media?: {
    type: MediaType;
    title: string;
    accent: string;
  };
  likes: number;
  comments: number;
  shares: number;
};

export type StoryItem = {
  id: string;
  name: string;
  accent: string;
};

export type SuggestedUser = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  accent: string;
};

export type TrendItem = {
  id: string;
  title: string;
  posts: string;
};

export type ActivityItem = {
  id: string;
  label: string;
  value: string;
  delta: string;
};

export type NavItem = {
  id: string;
  label: string;
};

export const navItems: NavItem[] = [
  { id: "home", label: "Home" },
  { id: "explore", label: "Explore" },
  { id: "notifications", label: "Notifications" },
  { id: "messages", label: "Messages" },
  { id: "stories", label: "Stories" },
  { id: "profile", label: "Profile" },
  { id: "settings", label: "Settings" }
];

export const stories: StoryItem[] = [
  { id: "s1", name: "Nodira", accent: "from-rose-400 via-orange-300 to-amber-300" },
  { id: "s2", name: "Aziz", accent: "from-cyan-400 via-sky-300 to-indigo-300" },
  { id: "s3", name: "Kamron", accent: "from-emerald-400 via-lime-300 to-yellow-200" },
  { id: "s4", name: "Mubina", accent: "from-fuchsia-500 via-pink-400 to-rose-300" },
  { id: "s5", name: "Dilshod", accent: "from-violet-500 via-purple-400 to-sky-300" },
  { id: "s6", name: "Madina", accent: "from-amber-400 via-orange-300 to-rose-300" }
];

export const initialPosts: FeedPost[] = [
  {
    id: "p1",
    user: { name: "Nodira Karimova", handle: "@nodira.k", avatar: "NK", verified: true },
    time: "2 daqiqa oldin",
    text: "Creator dashboardning yangi varianti nihoyat premium ko'rinishga keldi. Tuzilish aniqroq, kartalar ixchamroq, yuklanish tezroq.",
    media: { type: "image", title: "Creator Studio ko'rinishi", accent: "from-sky-500 via-cyan-300 to-teal-200" },
    likes: 184,
    comments: 28,
    shares: 9
  },
  {
    id: "p2",
    user: { name: "Kamron Rustamov", handle: "@kamron.dev", avatar: "KR" },
    time: "18 daqiqa oldin",
    text: "Realtime chat, moderatsiya va bildirishnoma oqimi bir yo'nalishda ishlay boshladi. Endi butun tizim ancha yaxlit ko'rinmoqda.",
    likes: 96,
    comments: 14,
    shares: 11
  },
  {
    id: "p3",
    user: { name: "Mubina UX", handle: "@mubina.ui", avatar: "MU", verified: true },
    time: "42 daqiqa oldin",
    text: "Asosiy lenta uchun yangi animatsiya pass. Mayin transition, toza ritm va ortiqcha effektlarsiz.",
    media: { type: "video", title: "Mikro-animatsiya preview", accent: "from-slate-900 via-slate-700 to-slate-500" },
    likes: 302,
    comments: 47,
    shares: 21
  },
  {
    id: "p4",
    user: { name: "Bekzod Ops", handle: "@bekzod.ops", avatar: "BO" },
    time: "1 soat oldin",
    text: "Bildirishnomalar oqimi kengayganidan keyin ham latency barqaror qoldi. Keyingi featurelar uchun yaxshi signal.",
    likes: 71,
    comments: 8,
    shares: 6
  }
];

export const suggestedUsers: SuggestedUser[] = [
  { id: "u1", name: "Aziza Product", handle: "@aziza.pm", bio: "Ijtimoiy growth strategiyalarini quradi", accent: "from-pink-500 to-orange-300" },
  { id: "u2", name: "Jasur AI", handle: "@jasur.ai", bio: "Tavsiyalar va ranking tizimlari", accent: "from-sky-500 to-indigo-300" },
  { id: "u3", name: "Sardor Infra", handle: "@sardor.sre", bio: "Tez release va barqaror infratuzilma", accent: "from-emerald-500 to-lime-300" }
];

export const trends: TrendItem[] = [
  { id: "t1", title: "#creatorStudio", posts: "12.4K ta post" },
  { id: "t2", title: "#socialInfra", posts: "8.1K ta post" },
  { id: "t3", title: "#designSystems", posts: "6.8K ta post" }
];

export const activities: ActivityItem[] = [
  { id: "a1", label: "Profil tashriflari", value: "2.4K", delta: "+18%" },
  { id: "a2", label: "Engagement darajasi", value: "7.9%", delta: "+0.8" },
  { id: "a3", label: "O'qilmagan yangiliklar", value: "14", delta: "jonli" }
];

export function makeMorePosts(offset: number): FeedPost[] {
  return Array.from({ length: 4 }, (_, index) => ({
    id: `p-more-${offset}-${index}`,
    user: {
      name: ["Saida", "Abror", "Lola", "Umid"][index] + " Studio",
      handle: ["@saida.st", "@abror.ship", "@lola.feed", "@umid.live"][index],
      avatar: ["SS", "AS", "LF", "UL"][index]
    },
    time: `${offset + index + 2} soat oldin`,
    text:
      [
        "Lenta kartalarini oddiy blokdan ko'ra editorial uslubga yaqinlashtirdik.",
        "Foydalanuvchi soni oshganda eng muhim narsa - bildirishnoma yetkazilishining ishonchliligi.",
        "Creator flowni avval mobile da test qilish spacing qarorlarini ancha yaxshiladi.",
        "Bugungi fokus: infinite lentani layout sakrashlarisiz yanada silliq qilish."
      ][index],
    media:
      index % 2 === 0
        ? {
            type: index === 0 ? "image" : "video",
            title: ["Moodboard", "Prototype preview", "Growth snapshot", "Performance clip"][index],
            accent: [
              "from-rose-400 via-pink-300 to-orange-200",
              "from-sky-500 via-indigo-400 to-violet-300",
              "from-emerald-500 via-teal-300 to-cyan-200",
              "from-slate-800 via-slate-600 to-zinc-400"
            ][index]
          }
        : undefined,
    likes: 50 + offset * 3 + index * 17,
    comments: 9 + index * 3,
    shares: 4 + index * 2
  }));
}