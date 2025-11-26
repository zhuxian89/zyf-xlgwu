"use client";

import { motion } from "framer-motion";
import { useGameStore } from "./hooks/useGameStore";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, GraduationCap, Fish, Clapperboard, Shovel, Gamepad2 } from "lucide-react";
import { getUserCoins } from "./lib/db";
import Image from "next/image";

export default function Home() {
    const { coins, setCoins } = useGameStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        getUserCoins().then(setCoins);
    }, [setCoins]);

    if (!mounted) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-sky-400 to-green-300">
                <div className="text-6xl font-black text-white animate-bounce">🎮</div>
            </div>
        );
    }

    const buildings = [
        { name: "学校", icon: GraduationCap, color: "from-orange-400 to-orange-600", href: "/school", x: "20%", y: "25%" },
        { name: "钓鱼小屋", icon: Fish, color: "from-blue-400 to-blue-600", href: "/fishing", x: "70%", y: "60%" },
        { name: "动漫影院", icon: Clapperboard, color: "from-purple-400 to-purple-600", href: "/cinema", x: "65%", y: "20%" },
        { name: "农场", icon: Shovel, color: "from-green-400 to-green-600", href: "/farm", x: "25%", y: "65%" },
        { name: "游戏室", icon: Gamepad2, color: "from-pink-400 to-pink-600", href: "/gameroom", x: "50%", y: "45%" },
    ];

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* 背景 */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-green-200">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-10 left-20 text-8xl">☁️</div>
                    <div className="absolute top-32 right-40 text-6xl">☁️</div>
                    <div className="absolute top-20 right-20 text-7xl animate-pulse">☀️</div>
                    <div className="absolute bottom-20 left-10 text-5xl">🌸</div>
                    <div className="absolute bottom-32 right-60 text-5xl">🌸</div>
                    <div className="absolute bottom-10 left-1/3 text-6xl">🌳</div>
                    <div className="absolute bottom-10 right-1/4 text-6xl">🌳</div>
                </div>
            </div>

            {/* HUD - 金币显示 */}
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="absolute top-6 left-6 z-50"
            >
                <div className="glass rounded-3xl p-5 pr-8 shadow-2xl border-4 border-white flex items-center gap-4">
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="bg-gradient-to-br from-yellow-300 to-yellow-500 p-3 rounded-full shadow-lg"
                    >
                        <Coins className="w-10 h-10 text-white drop-shadow-md" />
                    </motion.div>
                    <div>
                        <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">我的金币</p>
                        <motion.p
                            key={coins}
                            initial={{ scale: 1.5, color: "#fbbf24" }}
                            animate={{ scale: 1, color: "#d97706" }}
                            className="text-5xl font-black"
                        >
                            {coins}
                        </motion.p>
                    </div>
                </div>
            </motion.div>

            {/* 标题 */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                className="absolute top-6 left-1/2 -translate-x-1/2 z-40"
            >
                <div className="relative">
                    <h1 className="text-7xl font-black text-white text-stroke drop-shadow-2xl font-[var(--font-fredoka)]">
                        🌟 我的学习冒险 🌟
                    </h1>
                </div>
            </motion.div>

            {/* 建筑图标 */}
            <div className="absolute inset-0">
                {buildings.map((building, i) => (
                    <motion.div
                        key={building.name}
                        initial={{ scale: 0, y: -100, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        transition={{
                            delay: 0.3 + i * 0.15,
                            type: "spring",
                            stiffness: 120,
                            damping: 10,
                        }}
                        style={{ left: building.x, top: building.y }}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                    >
                        <Link href={building.href}>
                            <motion.div
                                whileHover={{ scale: 1.15, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                className="cursor-pointer flex flex-col items-center gap-3 group"
                            >
                                {/* 3D 建筑卡片 */}
                                <div className="relative">
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        className={`bg-gradient-to-br ${building.color} w-36 h-36 rounded-3xl 
                              shadow-[0_15px_0_rgba(0,0,0,0.2)] 
                              group-hover:shadow-[0_20px_0_rgba(0,0,0,0.25)]
                              border-4 border-white 
                              flex items-center justify-center
                              transition-all duration-300`}
                                    >
                                        <building.icon className="w-20 h-20 text-white drop-shadow-lg" strokeWidth={2.5} />
                                    </motion.div>
                                </div>

                                {/* 名称标签 */}
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    className="glass px-6 py-2 rounded-full shadow-xl border-2 border-white"
                                >
                                    <span className="text-xl font-black text-gray-800 font-[var(--font-fredoka)]">
                                        {building.name}
                                    </span>
                                </motion.div>
                            </motion.div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* 装饰云朵 */}
            <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute top-40 text-9xl opacity-40"
            >
                ☁️
            </motion.div>
        </div>
    );
}
