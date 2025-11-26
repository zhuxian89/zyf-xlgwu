"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    ArrowLeft, BatteryCharging, Clock3, Gamepad2, Hammer,
    Brain,
    Blocks,
    Waves,
    Sparkles,
    ShieldCheck,
    BookOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ElementType } from "react";
import { useGameStore } from "../hooks/useGameStore";
import { getUserCoins } from "../lib/db";

type GameKey = "whac" | "memory" | "tetris" | "snake" | "puzzle" | "school";

const GAME_CONFIG: { id: GameKey; title: string; subtitle: string; color: string; icon: ElementType; href: string; desc: string }[] = [
    {
        id: "whac",
        title: "打地鼠",
        subtitle: "反应力挑战",
        icon: Hammer,
        color: "from-amber-400 to-orange-500",
        href: "/gameroom/whac",
        desc: "独立页面全屏体验，沉浸式操作，支持触屏与键盘。",
    },
    {
        id: "memory",
        title: "翻牌配对",
        subtitle: "记忆力挑战",
        icon: Brain,
        color: "from-emerald-400 to-teal-500",
        href: "/gameroom/memory",
        desc: "独立页面全屏体验，沉浸式操作，支持触屏与键盘。",
    },
    {
        id: "tetris",
        title: "俄罗斯方块",
        subtitle: "下落消除",
        icon: Blocks,
        color: "from-blue-500 to-cyan-500",
        href: "/gameroom/tetris",
        desc: "独立页面全屏体验，沉浸式操作，支持触屏与键盘。",
    },
    {
        id: "snake",
        title: "贪吃蛇",
        subtitle: "躲避与吞噬",
        icon: Waves,
        color: "from-lime-500 to-green-500",
        href: "/gameroom/snake",
        desc: "独立页面全屏体验，沉浸式操作，支持触屏与键盘。",
    },
    {
        id: "puzzle",
        title: "叶罗丽拼图",
        subtitle: "拼出美丽的仙子",
        icon: Sparkles,
        color: "from-pink-500 to-rose-500",
        href: "/gameroom/puzzle",
        desc: "独立页面全屏体验，沉浸式操作，支持触屏与键盘。",
    },
    {
        id: "school",
        title: "快乐学校",
        subtitle: "学习与阅读",
        icon: BookOpen,
        color: "from-sky-400 to-blue-500",
        href: "/school",
        desc: "完成数学挑战和每日阅读，赚取金币！",
    },
];

export default function GameRoomHub() {
    const { coins, setCoins } = useGameStore();
    const [energy, setEnergy] = useState({ current: 5, max: 5, next: 0 });
    const [daily, setDaily] = useState({ used: 0, limit: 1800 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        getUserCoins().then(setCoins);
        fetch("/api/game/stats")
            .then((res) => res.json())
            .then((data) => {
                setEnergy({ current: data.energy ?? 5, max: data.maxEnergy ?? 5, next: data.nextEnergySeconds ?? 0 });
                setDaily({ used: data.dailyUsed ?? 0, limit: data.dailyLimit ?? 1800 });
            })
            .catch(() => { /* ignore */ });
    }, [setCoins]);

    const progressDaily = Math.min(1, daily.used / (daily.limit || 1));

    if (!mounted) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-100 via-rose-50 to-orange-50">
                <motion.div animate={{ scale: [0.9, 1.1, 0.9] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                    <Gamepad2 className="w-20 h-20 text-purple-600" />
                </motion.div>
                <p className="mt-4 text-2xl font-black text-purple-700">游戏室加载中...</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-gradient-to-b from-purple-100 via-rose-50 to-orange-50 overflow-hidden flex flex-col">
            <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-pink-300 to-orange-200 blur-3xl top-10 left-6" />
                <div className="absolute w-80 h-80 rounded-full bg-gradient-to-br from-indigo-200 to-cyan-200 blur-3xl bottom-10 right-6" />
            </div>

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 flex flex-col min-h-0 relative z-10">
                {/* 顶部导航栏 */}
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <Link href="/">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="glass rounded-full p-3 shadow-xl border-2 border-white/70">
                                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                            </motion.button>
                        </Link>
                        <Link href="/gameroom/admin">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="glass rounded-full px-4 py-2 shadow-xl border-2 border-white/70 flex items-center gap-2 text-purple-700 font-bold">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="hidden sm:inline">家长管理</span>
                            </motion.button>
                        </Link>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                        <InfoCard icon={<Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />} title="金币" value={`${coins} `} accent="text-amber-600" />
                        <InfoCard
                            icon={<BatteryCharging className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />}
                            title="体力"
                            value={`${energy.current} / ${energy.max}`}
                            extra={energy.current < energy.max ? `+1 倒计时 ${Math.max(0, Math.floor(energy.next))}s` : undefined}
                        />
                        <InfoCard
                            icon={<Clock3 className="w-5 h-5 sm:w-6 sm:h-6 text-sky-500" />}
                            title="每日时长"
                            value={`${Math.floor(daily.used / 60)} / ${Math.floor(daily.limit / 60)} 分钟`}
                            progress={progressDaily}
                        />
                    </div >
                </div >

                {/* 标题区域 */}
                < div className="text-center mb-4 sm:mb-6 shrink-0" >
                    <motion.h1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-3xl sm:text-5xl font-black text-purple-700 drop-shadow font-[var(--font-fredoka)]">
                        🎮 游戏室 Arcade
                    </motion.h1>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">选择小游戏进入专属页面，全屏体验更流畅的操作与布局</p>
                </div >

                {/* 游戏列表 Grid - 自适应高度 */}
                < div className="flex-1 min-h-0 overflow-y-auto pb-4" >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 h-full content-start">
                        {GAME_CONFIG.map((cfg) => {
                            const Icon = cfg.icon;
                            return (
                                <Link key={cfg.id} href={cfg.href} className="group h-full">
                                    <motion.div
                                        whileHover={{ y: -4, scale: 1.01 }}
                                        className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg border-4 border-white/80 h-full flex flex-col gap-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${cfg.color} text-white shadow-md`}>
                                                <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                                            </div>
                                            <div>
                                                <p className="text-lg sm:text-xl font-black text-gray-800">{cfg.title}</p>
                                                <p className="text-xs sm:text-sm text-gray-600">{cfg.subtitle}</p>
                                            </div>
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-500 leading-relaxed flex-1">
                                            {cfg.desc}
                                        </div>
                                        <div className="mt-auto">
                                            <div className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 sm:py-3 font-black text-sm sm:text-base shadow-md border-2 border-white/70 group-hover:brightness-110 transition-all">
                                                开始游戏
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </div >
            </div >
        </div >
    );
}

function InfoCard({ icon, title, value, extra, accent, progress }: { icon: React.ReactNode; title: string; value: string; extra?: string; accent?: string; progress?: number }) {
    return (
        <div className="glass rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2 sm:py-3 shadow-md border-2 border-white/70 min-w-[140px] sm:min-w-[160px]">
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-shrink-0">{icon}</div>
                <div className="text-xs sm:text-sm">
                    <p className="text-gray-500 font-semibold">{title}</p>
                    <p className={`text-lg sm:text-xl font-black ${accent ?? "text-gray-800"}`}>{value}</p>
                    {extra && <p className="text-[10px] sm:text-xs text-gray-500">{extra}</p>}
                </div>
            </div>
            {typeof progress === "number" && (
                <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-gradient-to-r from-sky-400 to-blue-500" style={{ width: `${progress * 100}%` }} />
                </div>
            )}
        </div>
    );
}
