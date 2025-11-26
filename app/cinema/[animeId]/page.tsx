"use client";

import { useParams } from "next/navigation";
import { ANIME_LIST } from "../data";
import Link from "next/link";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AnimePlayerPage() {
    const params = useParams();
    const anime = ANIME_LIST.find((a) => a.id === params.animeId);

    if (!anime) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">未找到该动画</h1>
                    <Link href="/cinema" className="text-purple-400 hover:underline">
                        返回影院
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            {/* Header */}
            <div className="w-full max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
                <Link href="/cinema">
                    <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </Link>
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <span>{anime.icon}</span>
                    <span>{anime.title}</span>
                </h1>
            </div>

            {/* Player Container */}
            <div className="flex-1 w-full max-w-6xl mx-auto px-4 pb-8 flex flex-col">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-4 ring-white/5"
                >
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/videoseries?list=${anime.playlistId}`}
                        title={anime.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute inset-0"
                    />
                </motion.div>

                <div className="mt-6 bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <PlayCircle className="w-5 h-5 text-purple-400" />
                        简介
                    </h2>
                    <p className="text-slate-300 leading-relaxed">
                        {anime.description}
                    </p>
                </div>
            </div>
        </div>
    );
}
