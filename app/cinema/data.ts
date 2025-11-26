export interface Anime {
  id: string;
  title: string;
  description: string;
  color: string;
  playlistId: string; // YouTube Playlist ID
  icon?: string; // Optional emoji or icon
}

export const ANIME_LIST: Anime[] = [
  {
    id: "yeloli",
    title: "叶罗丽精灵梦",
    description: "普通女孩王默和叶罗丽仙子的奇幻冒险",
    color: "from-pink-400 to-rose-500",
    playlistId: "PLsg5t-Dfedc-hbW7sigPyq7j2pkdJy1Q-", // Season 1
    icon: "🧚‍♀️"
  },
  {
    id: "peppa",
    title: "小猪佩奇",
    description: "佩奇和乔治的快乐生活",
    color: "from-pink-300 to-red-400",
    playlistId: "PLJqCvvdEL3dFt4m0JOD3Z1gkLXRVMHCbL", // Full Collection
    icon: "🐷"
  },
  {
    id: "pawpatrol",
    title: "汪汪队立大功",
    description: "没有困难的工作，只有勇敢的狗狗",
    color: "from-blue-400 to-red-500",
    playlistId: "PL1IigiWrn-KraZrrZE67kROjYintiiju9", // Official Channel Playlist
    icon: "🐶"
  },
  {
    id: "ultraman",
    title: "奥特曼",
    description: "相信光！打败怪兽！",
    color: "from-red-500 to-stone-500",
    playlistId: "PL2RVYaVF_cv9V00WlGNC_2RA_ELTIRKhz", // Ultraman Z Chinese
    icon: "🦸"
  },
  {
    id: "babybus",
    title: "宝宝巴士",
    description: "快乐启蒙，奇妙世界",
    color: "from-green-400 to-teal-500",
    playlistId: "PLvoafAnklPju_TBm9fE2H1MJt9SZ0t5k1", // Popular Nursery Rhymes
    icon: "🚌"
  },
  {
    id: "superwings",
    title: "超级飞侠",
    description: "乐迪请回答！",
    color: "from-red-400 to-yellow-500",
    playlistId: "PLvoafAnklPjsN8bWNrYHjo-wsuYVb6G5h", // Placeholder (BabyBus) as no direct ID found
    icon: "✈️"
  }
];
