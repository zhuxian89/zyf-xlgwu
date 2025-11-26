"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useGameStore } from "../hooks/useGameStore";
import Link from "next/link";
import Image from "next/image";
import Toast, { ToastType } from "../components/Toast";

const FISHING_COST = 20;

async function getAllFish() {
    try {
        const res = await fetch('/api/fish');
        const data = await res.json();
        return data.fish || [];
    } catch (error) {
        console.error('Failed to fetch fish:', error);
        return [];
    }
}

async function getCatchLog() {
    try {
        const res = await fetch('/api/fish/catches');
        const data = await res.json();
        return data.catches || [];
    } catch (error) {
        console.error('Failed to fetch catches:', error);
        return [];
    }
}

export default function FishingPage() {
    const { coins, setCoins } = useGameStore();
    const [gameState, setGameState] = useState<'idle' | 'casting' | 'waiting' | 'biting' | 'fighting' | 'caught' | 'missed'>('idle');
    const [caughtFish, setCaughtFish] = useState<any>(null);
    const [showCollection, setShowCollection] = useState(false);

    const [fightProgress, setFightProgress] = useState(30);
    const [fishStrength, setFishStrength] = useState(0.5);

    const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([]);

    const fightIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const castRod = async () => {
        if (coins < FISHING_COST) {
            showToast(`金币不足！需要 ${FISHING_COST} 金币`, 'warning');
            return;
        }

        try {
            const res = await fetch('/api/coins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: -FISHING_COST }),
            });
            const data = await res.json();
            setCoins(data.coins);
        } catch (error) {
            console.error('Failed to update coins:', error);
            showToast('扣除金币失败！', 'error');
            return;
        }

        setGameState('casting');
        setTimeout(() => {
            setGameState('waiting');
            const waitTime = Math.random() * 3000 + 2000;
            setTimeout(() => {
                setGameState('biting');
                setTimeout(() => {
                    setGameState(prev => prev === 'biting' ? 'missed' : prev);
                }, 3000);
            }, waitTime);
        }, 1000);
    };

    const startFighting = () => {
        setGameState('fighting');
        setFightProgress(30);
        const strength = 0.3 + Math.random() * 0.5;
        setFishStrength(strength);

        if (fightIntervalRef.current) clearInterval(fightIntervalRef.current);
        fightIntervalRef.current = setInterval(() => {
            setFightProgress(prev => {
                const next = prev - strength;
                if (next <= 0) {
                    endFighting('missed');
                    return 0;
                }
                return next;
            });
        }, 50);
    };

    const pullRod = () => {
        if (gameState !== 'fighting') return;
        setFightProgress(prev => {
            const next = prev + 5;
            if (next >= 100) {
                endFighting('caught');
                return 100;
            }
            return next;
        });
    };

    const endFighting = async (result: 'caught' | 'missed') => {
        if (fightIntervalRef.current) {
            clearInterval(fightIntervalRef.current);
            fightIntervalRef.current = null;
        }

        if (result === 'missed') {
            setGameState('missed');
            setTimeout(() => setGameState('idle'), 2000);
        } else {
            try {
                const res = await fetch('/api/fish/catch', { method: 'POST' });
                const data = await res.json();
                setCaughtFish(data.fish);
                setGameState('caught');
            } catch (error) {
                console.error('Catch error:', error);
                setGameState('idle');
                showToast('钓鱼失败！', 'error');
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                if (gameState === 'biting') startFighting();
                else if (gameState === 'fighting') pullRod();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    useEffect(() => {
        return () => {
            if (fightIntervalRef.current) clearInterval(fightIntervalRef.current);
        };
    }, []);

    const closeFishModal = () => {
        setCaughtFish(null);
        setGameState('idle');
    };

    return (
        <div className="relative w-full h-full bg-gradient-to-b from-sky-300 to-blue-500 overflow-hidden select-none">
            <AnimatePresence>
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </AnimatePresence>

            <div className="absolute top-4 left-4 z-50 flex gap-4">
                <Link href="/" className="bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/40 transition-all border-2 border-white/50">
                    <ArrowLeft className="text-white w-8 h-8" />
                </Link>
                <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border-2 border-white/50 flex items-center gap-2">
                    <span className="text-3xl">💰</span>
                    <span className="text-2xl font-black text-white drop-shadow-md">{coins}</span>
                </div>
            </div>

            <button
                onClick={() => setShowCollection(true)}
                className="absolute top-4 right-4 z-50 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border-2 border-white/50 flex items-center gap-2 hover:bg-white/40 transition-all"
            >
                <span className="text-3xl">📖</span>
                <span className="text-xl font-bold text-white">图鉴</span>
            </button>

            {!showCollection && (
                <div className="relative w-full h-full flex items-center justify-center">
                    {gameState === 'fighting' && (
                        <div className="absolute inset-0 z-40 bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center">
                            <div className="text-6xl font-black text-white mb-8 animate-pulse">
                                🔥 疯狂点击！ 🔥
                            </div>

                            <div className="relative w-[600px] h-16 bg-gray-800 rounded-full border-4 border-white shadow-2xl overflow-hidden">
                                <div className="absolute inset-0 bg-red-500 opacity-50 animate-pulse"></div>
                                <motion.div
                                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-green-400 to-green-600"
                                    style={{ width: `${fightProgress}%` }}
                                />
                                <motion.div
                                    className="absolute top-1/2 -translate-y-1/2 text-4xl z-10"
                                    style={{ left: `${fightProgress}%`, x: '-50%' }}
                                >
                                    🎣
                                </motion.div>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl">🐟</div>
                            </div>

                            <div className="mt-12">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={pullRod}
                                    className="w-48 h-48 rounded-full bg-red-500 border-8 border-white shadow-xl flex items-center justify-center active:bg-red-600"
                                >
                                    <span className="text-4xl font-black text-white">收！</span>
                                </motion.button>
                            </div>
                            <p className="text-white mt-4 text-xl font-bold opacity-80">(或者狂按空格键)</p>
                        </div>
                    )}

                    <div className="relative mt-40">
                        <div className="text-[10rem] relative z-10">
                            🧑‍🌾
                            <motion.div
                                animate={
                                    gameState === 'casting' ? { rotate: [0, -45, 0] } :
                                        gameState === 'waiting' ? { rotate: 0 } :
                                            gameState === 'biting' ? { rotate: [0, 5, -5, 0], y: [0, 5, 0] } :
                                                gameState === 'fighting' ? { rotate: [-10, 10, -10], x: [-5, 5, -5] } :
                                                    gameState === 'caught' ? { rotate: -60 } :
                                                        { rotate: 0 }
                                }
                                transition={
                                    gameState === 'biting' ? { repeat: Infinity, duration: 0.1 } :
                                        gameState === 'fighting' ? { repeat: Infinity, duration: 0.1 } :
                                            { duration: 0.5 }
                                }
                                className="origin-bottom-right w-2 h-64 bg-gray-700 relative -rotate-12"
                            >
                                <motion.div
                                    animate={{
                                        height: gameState === 'idle' ? 0 :
                                            gameState === 'fighting' ? 250 :
                                                300
                                    }}
                                    className={`absolute top-0 left-1/2 w-0.5 origin-top ${gameState === 'fighting' ? 'bg-red-400 w-1' : 'bg-white/50'}`}
                                />
                                {gameState !== 'idle' && (
                                    <motion.div
                                        initial={{ y: 0 }}
                                        animate={
                                            gameState === 'waiting' ? { y: [300, 310, 300] } :
                                                gameState === 'biting' ? { y: [300, 350, 300], scale: [1, 1.2, 1] } :
                                                    gameState === 'fighting' ? { y: [250, 260, 240, 260], x: [-10, 10, -5, 5] } :
                                                        { y: 300 }
                                        }
                                        transition={
                                            gameState === 'waiting' ? { repeat: Infinity, duration: 2 } :
                                                gameState === 'fighting' ? { repeat: Infinity, duration: 0.1 } :
                                                    { repeat: Infinity, duration: 0.2 }
                                        }
                                        className="absolute left-1/2 -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg z-40"
                                    >
                                        <div className="w-full h-1/2 bg-white rounded-t-full"></div>
                                    </motion.div>
                                )}
                            </motion.div>
                        </div>

                        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 text-center w-full">
                            {gameState === 'idle' && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={castRod}
                                    className="bg-blue-600 text-white px-12 py-6 rounded-full text-4xl font-black shadow-2xl border-4 border-white hover:bg-blue-500"
                                >
                                    🎣 抛竿 ({FISHING_COST}💰)
                                </motion.button>
                            )}

                            {gameState === 'waiting' && (
                                <div className="bg-black/50 text-white px-8 py-4 rounded-full text-2xl font-bold backdrop-blur-md animate-pulse">
                                    🐟 等待鱼儿咬钩...
                                </div>
                            )}

                            {gameState === 'biting' && (
                                <motion.button
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 0.2 }}
                                    onClick={startFighting}
                                    className="bg-red-600 text-white px-12 py-6 rounded-full text-5xl font-black shadow-2xl border-4 border-yellow-400 animate-bounce"
                                >
                                    ⚡ 收杆！！！
                                </motion.button>
                            )}

                            {gameState === 'missed' && (
                                <div className="bg-gray-800 text-white px-8 py-4 rounded-full text-2xl font-bold">
                                    💨 哎呀，鱼跑了！
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showCollection && <FishCollection onClose={() => setShowCollection(false)} showToast={showToast} />}

            <AnimatePresence>
                {caughtFish && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]"
                    >
                        <motion.div
                            initial={{ scale: 0, y: 200 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0, y: 200 }}
                            className="relative w-full max-w-lg text-center"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: caughtFish.stars >= 4 ? 5 : 10, ease: "linear" }}
                                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] z-0 ${caughtFish.stars >= 4 ? 'bg-gradient-to-r from-yellow-300/0 via-yellow-400/50 to-yellow-300/0' : 'bg-gradient-to-r from-white/0 via-white/20 to-white/0'}`}
                            />

                            <div className="relative z-10 bg-white/90 backdrop-blur-md rounded-3xl p-8 border-4 border-white shadow-2xl">
                                <h2 className={`text-4xl font-black mb-3 ${caughtFish.stars >= 4 ? 'text-yellow-500' : 'text-blue-500'}`}>
                                    {caughtFish.stars >= 4 ? '🌟 传说巨物！' : '🎉 钓到了！'}
                                </h2>

                                <p className="text-xl font-bold text-gray-700 mb-4">
                                    {caughtFish.stars === 1 && '⭐ 普通鱼类'}
                                    {caughtFish.stars === 2 && '⭐⭐ 稀有鱼类'}
                                    {caughtFish.stars === 3 && '⭐⭐⭐ 珍贵鱼类'}
                                    {caughtFish.stars === 4 && '⭐⭐⭐⭐ 史诗鱼类'}
                                    {caughtFish.stars === 5 && '⭐⭐⭐⭐⭐ 传说鱼类'}
                                </p>

                                <div className="flex justify-center gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <motion.span
                                            key={i}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            className={`text-3xl ${i < (caughtFish.stars || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                        >
                                            ⭐
                                        </motion.span>
                                    ))}
                                </div>

                                <div className="mb-6 relative h-48 w-48 mx-auto">
                                    {caughtFish.image_url ? (
                                        <Image
                                            src={caughtFish.image_url}
                                            alt={caughtFish.name}
                                            fill
                                            className="object-cover rounded-2xl shadow-2xl"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="text-[12rem]">{caughtFish.emoji || '🐟'}</div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-gray-800">{caughtFish.name}</h3>
                                    <p className="text-lg text-gray-500 font-bold">{caughtFish.name_en}</p>
                                    <div className="inline-block px-6 py-2 rounded-full bg-green-500 text-white font-bold text-lg mt-2">
                                        💰 售价: {caughtFish.sell_price} 金币
                                    </div>
                                </div>

                                <p className="mt-4 text-sm text-gray-600 max-w-md mx-auto">
                                    {caughtFish.description}
                                </p>

                                <div className="mt-6 flex gap-3 justify-center">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={async (e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            try {
                                                const res = await fetch('/api/fish/sell', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ catchId: caughtFish.catch_id }),
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    setCoins(data.newCoins);
                                                    showToast(`成功卖出！获得 ${data.earned} 金币！`, 'success');
                                                    closeFishModal();
                                                }
                                            } catch (error) {
                                                console.error('Sell failed:', error);
                                                showToast('卖出失败！', 'error');
                                            }
                                        }}
                                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-full text-lg font-black shadow-xl border-2 border-white"
                                    >
                                        💰 卖掉 (+{caughtFish.sell_price})
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={closeFishModal}
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-full text-lg font-black shadow-xl border-2 border-white"
                                    >
                                        ✓ 收藏
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function FishCollection({ onClose, showToast }: { onClose: () => void; showToast: (msg: string, type: ToastType) => void }) {
    const { setCoins } = useGameStore();
    const [allFish, setAllFish] = useState<any[]>([]);
    const [caughtList, setCaughtList] = useState<any[]>([]);

    useEffect(() => {
        getAllFish().then(setAllFish);
        getCatchLog().then(setCaughtList);
    }, []);

    const refreshCatchLog = async () => {
        const catches = await getCatchLog();
        setCaughtList(catches);
    };

    const sellFish = async (catchId: number, fishName: string, price: number) => {
        try {
            const res = await fetch('/api/fish/sell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ catchId }),
            });
            const data = await res.json();
            if (data.success) {
                setCoins(data.newCoins);
                await refreshCatchLog();
                showToast(`成功卖出 ${fishName}！获得 ${price} 金币！`, 'success');
            }
        } catch (error) {
            console.error('Sell failed:', error);
            showToast('卖出失败！', 'error');
        }
    };

    const caughtIds = new Set(caughtList.map(f => f.fish_id));
    const fishCounts = caughtList.reduce((acc: any, item: any) => {
        if (!item.sold) {
            acc[item.fish_id] = (acc[item.fish_id] || 0) + 1;
        }
        return acc;
    }, {});

    const starThemes: Record<number, { bg: string; border: string; badge: string; button: string }> = {
        1: {
            bg: 'from-slate-200 via-gray-100 to-zinc-200',
            border: 'border-gray-400',
            badge: 'bg-gray-500',
            button: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
        },
        2: {
            bg: 'from-green-100 via-emerald-50 to-teal-100',
            border: 'border-green-400',
            badge: 'bg-green-500',
            button: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
        },
        3: {
            bg: 'from-blue-100 via-cyan-50 to-sky-100',
            border: 'border-blue-400',
            badge: 'bg-blue-500',
            button: 'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700'
        },
        4: {
            bg: 'from-purple-100 via-violet-50 to-fuchsia-100',
            border: 'border-purple-400',
            badge: 'bg-purple-500',
            button: 'from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700'
        },
        5: {
            bg: 'from-amber-100 via-yellow-50 to-orange-100',
            border: 'border-amber-500',
            badge: 'bg-gradient-to-r from-amber-500 to-orange-500',
            button: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
        }
    };

    return (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-600 z-40 overflow-y-auto p-10">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-5xl font-black text-white drop-shadow-lg">📖 鱼类图鉴</h2>
                    <button onClick={onClose} className="bg-white/20 p-4 rounded-full hover:bg-white/30 transition-colors shadow-lg backdrop-blur-sm">
                        <ArrowLeft className="w-8 h-8 text-white" />
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {allFish.map((fish) => {
                        const isCaught = caughtIds.has(fish.id);
                        const count = fishCounts[fish.id] || 0;
                        const unsoldCatches = caughtList.filter(c => c.fish_id === fish.id && !c.sold);
                        const theme = starThemes[fish.stars] || starThemes[1];

                        return (
                            <div key={fish.id} className={`relative rounded-3xl border-4 p-4 flex flex-col items-center justify-center text-center transition-all ${isCaught
                                ? `bg-gradient-to-br ${theme.bg} ${theme.border} shadow-xl hover:shadow-2xl hover:scale-105`
                                : 'bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400 opacity-50'
                                }`}>
                                {isCaught ? (
                                    <>
                                        <div className={`absolute top-2 right-2 ${theme.badge} text-white px-3 py-1 rounded-full text-sm font-bold shadow-md`}>
                                            x{count}
                                        </div>

                                        <div className="flex gap-1 mb-2">
                                            {[...Array(fish.stars || 0)].map((_, i) => (
                                                <span key={i} className="text-xl text-yellow-400 drop-shadow-md">⭐</span>
                                            ))}
                                        </div>

                                        <div className="relative w-32 h-32 mb-3">
                                            {fish.image_url ? (
                                                <Image
                                                    src={fish.image_url}
                                                    alt={fish.name}
                                                    fill
                                                    className="object-cover rounded-xl shadow-lg"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="text-6xl">{fish.emoji}</div>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-black text-gray-800">{fish.name}</h3>
                                        <p className="text-xs text-gray-600 font-semibold">{fish.name_en}</p>
                                        <p className="text-sm text-green-600 font-bold mt-1">💰 {fish.sell_price}</p>

                                        {count > 0 && unsoldCatches.length > 0 && (
                                            <button
                                                onClick={() => sellFish(unsoldCatches[0].catch_id || unsoldCatches[0].id, fish.name, fish.sell_price)}
                                                className={`mt-3 w-full bg-gradient-to-r ${theme.button} text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md`}
                                            >
                                                卖掉一条 (+{fish.sell_price})
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="text-6xl mb-4 opacity-30 grayscale">❓</div>
                                        <h3 className="text-2xl font-black text-gray-500">???</h3>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
