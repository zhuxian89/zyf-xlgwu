"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, BatteryCharging, Clock3, Gamepad2, Hammer, Brain, Music2, Sparkles, Blocks, Waves, Puzzle } from "lucide-react";
import { useEffect, useState } from "react";
import type { ElementType } from "react";
import { useGameStore } from "../hooks/useGameStore";
import { getUserCoins } from "../lib/db";

type GameKey = "whac" | "memory" | "rhythm";

const GAME_CONFIG: Record<GameKey, { title: string; subtitle: string; color: string; icon: ElementType; href: string }> = {
    whac: { title: "打地鼠", subtitle: "反应力挑战", color: "from-amber-400 to-orange-500", icon: Hammer, href: "/gameroom/whac" },
    memory: { title: "翻牌配对", subtitle: "记忆力挑战", color: "from-emerald-400 to-teal-500", icon: Brain, href: "/gameroom/memory" },
    rhythm: { title: "节奏敲击", subtitle: "节奏感挑战", color: "from-indigo-400 to-purple-500", icon: Music2, href: "/gameroom/rhythm" },
    tetris: { title: "俄罗斯方块", subtitle: "下落消除", color: "from-blue-500 to-cyan-500", icon: Blocks, href: "/gameroom/tetris" },
    snake: { title: "贪吃蛇", subtitle: "躲避与吞噬", color: "from-lime-500 to-green-500", icon: Waves, href: "/gameroom/snake" },
    puzzle: { title: "数字拼图", subtitle: "排序与思考", color: "from-pink-500 to-rose-500", icon: Puzzle, href: "/gameroom/puzzle" },
};

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
            <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-100 via-rose-50 to-orange-50">
                <motion.div animate={{ scale: [0.9, 1.1, 0.9] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                    <Gamepad2 className="w-20 h-20 text-purple-600" />
                </motion.div>
                <p className="mt-4 text-2xl font-black text-purple-700">游戏室加载中...</p>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen bg-gradient-to-b from-purple-100 via-rose-50 to-orange-50 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-pink-300 to-orange-200 blur-3xl top-10 left-6" />
                <div className="absolute w-80 h-80 rounded-full bg-gradient-to-br from-indigo-200 to-cyan-200 blur-3xl bottom-10 right-6" />
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 relative z-10">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                    <Link href="/">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="glass rounded-full p-4 shadow-xl border-2 border-white/70">
                            <ArrowLeft className="w-6 h-6 text-gray-700" />
                        </motion.button>
                    </Link>
                    <div className="flex flex-wrap gap-3 items-center">
                        <InfoCard icon={<Sparkles className="w-6 h-6 text-amber-500" />} title="金币" value={`${coins}`} accent="text-amber-600" />
                        <InfoCard
                            icon={<BatteryCharging className="w-6 h-6 text-emerald-500" />}
                            title="体力"
                            value={`${energy.current} / ${energy.max}`}
                            extra={energy.current < energy.max ? `+1 倒计时 ${Math.max(0, Math.floor(energy.next))}s` : undefined}
                        />
                        <InfoCard
                            icon={<Clock3 className="w-6 h-6 text-sky-500" />}
                            title="每日时长"
                            value={`${Math.floor(daily.used / 60)} / ${Math.floor(daily.limit / 60)} 分钟`}
                            progress={progressDaily}
                        />
                    </div>
                </div>

                <div className="text-center mb-8 md:mb-10">
                    <motion.h1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl sm:text-5xl font-black text-purple-700 drop-shadow font-[var(--font-fredoka)]">
                        🎮 游戏室 Arcade
                    </motion.h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">选择小游戏进入专属页面，全屏体验更流畅的操作与布局</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(Object.keys(GAME_CONFIG) as GameKey[]).map((key) => {
                        const cfg = GAME_CONFIG[key];
                        const Icon = cfg.icon;
                        return (
                            <Link key={key} href={cfg.href} className="group">
                                <motion.div
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    className="glass rounded-3xl p-5 sm:p-6 shadow-2xl border-4 border-white/80 h-full flex flex-col gap-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${cfg.color} text-white shadow-lg`}>
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-xl sm:text-2xl font-black text-gray-800">{cfg.title}</p>
                                            <p className="text-sm text-gray-600">{cfg.subtitle}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        - 独立页面，避免主界面过长<br />
                                        - 支持平板/手机全屏显示<br />
                                        - 进入即开始专注单个小游戏
                                    </div>
                                    <div className="mt-auto">
                                        <div className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-3 font-black text-lg shadow-lg border-2 border-white/70">
                                            进入 {cfg.title}
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function InfoCard({ icon, title, value, extra, accent, progress }: { icon: React.ReactNode; title: string; value: string; extra?: string; accent?: string; progress?: number }) {
    return (
        <div className="glass rounded-2xl px-4 sm:px-6 py-3 shadow-lg border-2 border-white/70 min-w-[180px]">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">{icon}</div>
                <div className="text-sm">
                    <p className="text-gray-500 font-semibold">{title}</p>
                    <p className={`text-xl sm:text-2xl font-black ${accent ?? "text-gray-800"}`}>{value}</p>
                    {extra && <p className="text-xs text-gray-500">{extra}</p>}
                </div>
            </div>
            {typeof progress === "number" && (
                <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-gradient-to-r from-sky-400 to-blue-500" style={{ width: `${progress * 100}%` }} />
                </div>
            )}
        </div>
    );
}
