"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Clapperboard, Play, Lock, Coins, X } from "lucide-react";
import { ANIME_LIST } from "./data";
import { useEffect, useState } from "react";
import { useGameStore } from "../hooks/useGameStore";
import { getUserCoins } from "../lib/db";
import Toast, { useToast } from "../components/Toast";

export default function CinemaHub() {
    const { coins, setCoins } = useGameStore();
    const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
    const [ticketPrice, setTicketPrice] = useState(50);
    const [selectedAnime, setSelectedAnime] = useState<string | null>(null);
    const { toasts, showToast, removeToast } = useToast();
    const activeToast = toasts[toasts.length - 1];

    useEffect(() => {
        getUserCoins().then(setCoins);
        fetch("/api/cinema/status")
            .then((res) => res.json())
            .then((data) => {
                if (data.unlockedIds) setUnlockedIds(data.unlockedIds);
                if (data.price) setTicketPrice(data.price);
            });
    }, [setCoins]);

    const handleAnimeClick = (animeId: string, e: React.MouseEvent) => {
        if (unlockedIds.includes(animeId)) return; // Allow navigation
        e.preventDefault(); // Prevent navigation
        setSelectedAnime(animeId);
    };

    const handleUnlock = async () => {
        if (!selectedAnime) return;

        if (coins < ticketPrice) {
            showToast("金币不足，快去玩游戏赚金币吧！", "error");
            return;
        }

        try {
            const res = await fetch("/api/cinema/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ animeId: selectedAnime }),
            });
            const data = await res.json();

            if (data.success) {
                setCoins(data.newCoins);
                setUnlockedIds((prev) => [...prev, selectedAnime]);
                showToast("解锁成功！", "success");
                setSelectedAnime(null);
            } else {
                showToast(data.error || "解锁失败", "error");
            }
        } catch (error) {
            showToast("网络错误", "error");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white overflow-hidden flex flex-col relative">
            <AnimatePresence>
                {activeToast && (
                    <Toast
                        key={activeToast.id}
                        message={activeToast.message}
                        type={activeToast.type}
                        onClose={() => removeToast(activeToast.id)}
                    />
                )}
            </AnimatePresence>

            {/* Unlock Modal */}
            <AnimatePresence>
                {selectedAnime && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-800 rounded-3xl p-6 max-w-sm w-full border border-white/10 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setSelectedAnime(null)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>

                            <div className="text-center">
                                <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-10 h-10 text-purple-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">解锁动画</h3>
                                <p className="text-slate-400 mb-6">
                                    需要支付 <span className="text-amber-400 font-bold">{ticketPrice}</span> 金币来解锁此动画系列。
                                    <br />
                                    <span className="text-xs mt-1 block text-red-300">每次解锁可观看 15 分钟</span>
                                </p>

                                <button
                                    onClick={handleUnlock}
                                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Coins className="w-5 h-5" />
                                    支付 {ticketPrice} 金币
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-purple-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 to-transparent" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black flex items-center gap-3">
                                <Clapperboard className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                                    动漫影院
                                </span>
                            </h1>
                            <p className="text-slate-400 mt-1">精选优质动画，陪伴快乐成长</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                        <Coins className="w-5 h-5 text-amber-400" />
                        <span className="font-bold text-xl text-amber-400">{coins}</span>
                    </div>
                </div>

                {/* Anime Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                    {ANIME_LIST.map((anime, index) => {
                        const isUnlocked = unlockedIds.includes(anime.id);
                        return (
                            <Link
                                key={anime.id}
                                href={isUnlocked ? `/cinema/${anime.id}` : "#"}
                                onClick={(e) => handleAnimeClick(anime.id, e)}
                                className="group block"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className="relative h-64 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-800 group-hover:shadow-purple-500/20 transition-all"
                                >
                                    {/* Background Gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${anime.color} opacity-80 group-hover:opacity-100 transition-opacity duration-500 ${!isUnlocked ? 'grayscale-[0.5]' : ''}`} />

                                    {/* Lock Overlay */}
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center">
                                            <div className="p-4 bg-black/40 rounded-full mb-2 backdrop-blur-md border border-white/10">
                                                <Lock className="w-8 h-8 text-white/80" />
                                            </div>
                                            <div className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                                                <Coins className="w-3 h-3" />
                                                {ticketPrice}
                                            </div>
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="absolute inset-0 p-6 flex flex-col justify-between text-white z-10">
                                        <div className="flex justify-between items-start">
                                            <span className="text-4xl filter drop-shadow-lg">{anime.icon}</span>
                                            {isUnlocked && (
                                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white group-hover:text-purple-600 transition-colors">
                                                    <Play className="w-5 h-5 fill-current" />
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h2 className="text-2xl font-black mb-2 drop-shadow-md">{anime.title}</h2>
                                            <p className="text-sm text-white/90 font-medium line-clamp-2 drop-shadow-sm">
                                                {anime.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div >
    );
}
