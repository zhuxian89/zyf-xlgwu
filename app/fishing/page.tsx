'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, BookOpen, Anchor, Info } from "lucide-react";
import { useGameStore } from "../hooks/useGameStore";
import Link from "next/link";
import Toast, { useToast } from "../components/Toast";

const FISHING_COST = 20;

export default function FishingPage() {
    const { coins, setCoins } = useGameStore();
    const [gameState, setGameState] = useState<'idle' | 'casting' | 'waiting' | 'biting' | 'fighting' | 'caught' | 'missed'>('idle');
    const [lastCatch, setLastCatch] = useState<any>(null);
    const { toasts, showToast, removeToast } = useToast();

    // Fight Mechanics State
    const [tension, setTension] = useState(0);
    const [progress, setProgress] = useState(20);
    const [isHolding, setIsHolding] = useState(false);

    // Game Loop Refs
    const gameLoopRef = useRef<number | null>(null);
    const tensionRef = useRef(0);
    const progressRef = useRef(20);
    const isHoldingRef = useRef(false);

    // Sync refs
    useEffect(() => { tensionRef.current = tension; }, [tension]);
    useEffect(() => { isHoldingRef.current = isHolding; }, [isHolding]);
    useEffect(() => { return () => stopGameLoop(); }, []);

    const stopGameLoop = () => {
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null;
        }
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

            if (res.ok) {
                const data = await res.json();
                setCoins(data.coins);
                setGameState('casting');

                setTimeout(() => {
                    setGameState('waiting');
                    const waitTime = Math.random() * 3000 + 2000;
                    setTimeout(() => {
                        setGameState('biting');
                        setTimeout(() => {
                            setGameState(prev => {
                                if (prev === 'biting') {
                                    showToast('鱼跑了...', 'info');
                                    return 'missed';
                                }
                                return prev;
                            });
                        }, 4000);
                    }, waitTime);
                }, 1000);
            } else {
                showToast('操作失败', 'error');
            }
        } catch (error) {
            showToast('网络错误', 'error');
        }
    };

    const startFight = () => {
        if (gameState !== 'biting') return;

        setGameState('fighting');
        setTension(30);
        setProgress(25);
        tensionRef.current = 30;
        progressRef.current = 25;

        // Delay 1 second before starting the game loop to give player time to prepare
        setTimeout(() => {
            startGameLoop();
        }, 1000);
    };

    const startGameLoop = () => {
        if (gameLoopRef.current) return;

        let lastTime = performance.now();
        let fishPull = 0;
        let fishPullTimer = 0;

        const loop = (time: number) => {
            const deltaTime = (time - lastTime) / 1000;
            lastTime = time;

            fishPullTimer -= deltaTime;
            if (fishPullTimer <= 0) {
                fishPull = (Math.random() - 0.4) * 60;
                fishPullTimer = Math.random() * 1 + 0.5;
            }

            const userForce = isHoldingRef.current ? 70 : -50;
            let newTension = tensionRef.current + (userForce + fishPull) * deltaTime * 2;
            newTension = Math.max(0, Math.min(100, newTension));
            tensionRef.current = newTension;
            setTension(newTension);

            const isSafe = newTension >= 20 && newTension <= 80;
            const progressChange = isSafe ? 18 : -12;

            let newProgress = progressRef.current + progressChange * deltaTime;
            newProgress = Math.max(0, Math.min(100, newProgress));
            progressRef.current = newProgress;
            setProgress(newProgress);

            if (newProgress >= 100) {
                stopGameLoop();
                handleCatch();
                return;
            } else if (newProgress <= 0) {
                stopGameLoop();
                setGameState('missed');
                showToast('鱼跑了！', 'error');
                return;
            }

            gameLoopRef.current = requestAnimationFrame(loop);
        };

        gameLoopRef.current = requestAnimationFrame(loop);
    };

    const handleCatch = async () => {
        try {
            const res = await fetch('/api/fish/catch', { method: 'POST' });
            const data = await res.json();
            if (data.fish) {
                setLastCatch(data.fish);
                setGameState('caught');
                showToast(`钓到了 ${data.fish.name}！`, 'success');
            }
        } catch (error) {
            console.error('Catch error:', error);
            setGameState('idle');
        }
    };

    const sellFish = async (fish: any) => {
        try {
            const res = await fetch('/api/coins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: fish.sell_price }),
            });

            if (res.ok) {
                const data = await res.json();
                setCoins(data.coins);
                showToast(`出售成功！获得 ${fish.sell_price} 金币`, 'success');
                setLastCatch(null);
                setGameState('idle');
            } else {
                showToast('出售失败', 'error');
            }
        } catch (error) {
            showToast('网络错误', 'error');
        }
    };

    const keepFish = () => {
        showToast('已放入图鉴', 'success');
        setLastCatch(null);
        setGameState('idle');
    };

    const handleInteractionStart = () => {
        if (gameState === 'biting') startFight();
        else if (gameState === 'fighting') setIsHolding(true);
    };

    const handleInteractionEnd = () => {
        if (gameState === 'fighting') setIsHolding(false);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                if (gameState === 'biting') {
                    startFight();
                } else if (gameState === 'fighting') {
                    if (!e.repeat) setIsHolding(true);
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space' && gameState === 'fighting') {
                setIsHolding(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameState]);

    const isFishing = ['casting', 'waiting', 'biting', 'fighting'].includes(gameState);
    const fightMode = gameState === 'fighting';

    return (
        <div
            className="w-full h-screen bg-gradient-to-b from-sky-400 to-blue-600 overflow-hidden flex flex-col relative font-sans select-none"
            onMouseDown={handleInteractionStart}
            onMouseUp={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
        >
            <AnimatePresence>
                {toasts.map(t => (
                    <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
                ))}
            </AnimatePresence>

            {/* Header */}
            <div className="shrink-0 px-6 py-4 flex justify-between items-center bg-white/10 backdrop-blur-md z-50 absolute top-0 left-0 right-0 shadow-sm pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    <Link href="/">
                        <button className="p-3 bg-white/90 rounded-full shadow-lg hover:scale-105 transition-transform">
                            <ArrowLeft className="w-6 h-6 text-blue-700" />
                        </button>
                    </Link>
                    <h1 className="text-3xl font-black text-white drop-shadow-md flex items-center gap-2">
                        <Anchor className="w-8 h-8 text-yellow-300" />
                        欢乐钓鱼
                    </h1>
                </div>
                <div className="flex items-center gap-4 pointer-events-auto">
                    <div className="bg-yellow-400/90 px-6 py-2 rounded-full border-2 border-yellow-200 flex items-center gap-2 shadow-md">
                        <span className="text-2xl">💰</span>
                        <span className="text-xl font-bold text-yellow-900">{coins}</span>
                    </div>
                    <Link href="/fishing/collection">
                        <button className="px-6 py-2 bg-indigo-500/90 text-white rounded-full font-bold hover:bg-indigo-600 transition-colors flex items-center gap-2 shadow-md border-2 border-indigo-400">
                            <BookOpen className="w-5 h-5" />
                            图鉴
                        </button>
                    </Link>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 w-full h-full relative flex items-center justify-center">

                {/* Background Decor */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute bottom-0 w-full h-1/2 bg-blue-700/30 backdrop-blur-sm" />
                    <div className="absolute top-20 right-20 w-24 h-24 bg-yellow-200 rounded-full blur-xl opacity-60" />
                    <div className="absolute top-32 left-10 text-8xl opacity-20 text-white animate-pulse">☁️</div>
                </div>

                {/* Character & Fishing Rod - Unified SVG */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                    <svg width="600" height="400" viewBox="0 0 600 400" className="drop-shadow-2xl">
                        <defs>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Little Girl Character - Centered at x=200 */}
                        <g transform="translate(120, 150)">
                            {/* Back Hair */}
                            <path d="M60,80 Q50,150 40,180 L160,180 Q150,150 140,80" fill="#3E2723" />
                            {/* Body/Dress */}
                            <path d="M70,140 L60,200 L140,200 L130,140 Z" fill="#FF80AB" />
                            <path d="M70,140 Q100,160 130,140" fill="#F06292" />
                            {/* Head */}
                            <circle cx="100" cy="90" r="50" fill="#FFCCBC" />
                            {/* Bangs/Front Hair */}
                            <path d="M50,70 Q70,50 100,55 Q130,50 150,70" fill="#3E2723" />
                            <ellipse cx="75" cy="75" rx="15" ry="20" fill="#3E2723" />
                            <ellipse cx="125" cy="75" rx="15" ry="20" fill="#3E2723" />
                            {/* Eyes */}
                            <circle cx="80" cy="90" r="8" fill="#fff" />
                            <circle cx="120" cy="90" r="8" fill="#fff" />
                            <circle cx="82" cy="92" r="5" fill="#000" />
                            <circle cx="122" cy="92" r="5" fill="#000" />
                            <circle cx="83" cy="90" r="2" fill="#fff" filter="url(#glow)" />
                            <circle cx="123" cy="90" r="2" fill="#fff" filter="url(#glow)" />
                            {/* Blush */}
                            <ellipse cx="65" cy="100" rx="12" ry="8" fill="#FF8A80" opacity="0.5" />
                            <ellipse cx="135" cy="100" rx="12" ry="8" fill="#FF8A80" opacity="0.5" />
                            {/* Smile */}
                            <path d="M85,105 Q100,115 115,105" stroke="#FF6F61" strokeWidth="3" fill="none" strokeLinecap="round" />
                            {/* Arms */}
                            <ellipse cx="50" cy="150" rx="12" ry="30" fill="#FFCCBC" />
                            <ellipse cx="150" cy="150" rx="12" ry="30" fill="#FFCCBC" />
                            {/* Hands */}
                            <circle cx="50" cy="170" r="10" fill="#FFCCBC" />
                            <circle cx="150" cy="170" r="10" fill="#FFCCBC" />
                        </g>

                        {/* Fishing Rod & Line & Bobber - Integrated */}
                        <motion.g
                            animate={{
                                rotate: isFishing ? (fightMode ? [0, 2, -2, 0] : [0, 1, 0]) : 0,
                            }}
                            transition={{
                                duration: fightMode ? 0.2 : 2,
                                repeat: isFishing ? Infinity : 0,
                                ease: "easeInOut"
                            }}
                            style={{ transformOrigin: "340px 280px" }}
                        >
                            {/* Fishing Rod */}
                            <line
                                x1="340" y1="280"
                                x2="480" y2="140"
                                stroke="#8B4513"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />

                            {/* Fishing Line - only visible when fishing */}
                            {isFishing && (
                                <motion.path
                                    d="M 480 140 Q 500 200 520 260"
                                    stroke="rgba(255,255,255,0.7)"
                                    strokeWidth="2"
                                    fill="none"
                                    animate={{
                                        d: fightMode
                                            ? ["M 480 140 Q 500 200 520 260", "M 480 140 Q 505 200 520 260", "M 480 140 Q 500 200 520 260"]
                                            : "M 480 140 Q 500 200 520 260"
                                    }}
                                    transition={{
                                        duration: fightMode ? 0.15 : 1,
                                        repeat: fightMode ? Infinity : 0,
                                        ease: "easeInOut"
                                    }}
                                />
                            )}

                            {/* Bobber/Float - at the end of line */}
                            {isFishing && (
                                <motion.g
                                    animate={{ y: [0, 8, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <circle cx="520" cy="260" r="12" fill={gameState === 'biting' ? '#FFD700' : '#FF4444'} stroke="#fff" strokeWidth="2" />
                                    {gameState === 'biting' && (
                                        <text x="520" y="268" textAnchor="middle" fontSize="16" fill="#000">⚡</text>
                                    )}
                                </motion.g>
                            )}
                        </motion.g>
                    </svg>
                </div>

                {/* Biting Alert Overlay */}
                <AnimatePresence>
                    {gameState === 'biting' && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute top-1/3 left-0 right-0 z-40 flex flex-col items-center justify-center pointer-events-none"
                        >
                            <h2 className="text-6xl font-black text-yellow-300 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] animate-bounce">
                                🐟 咬钩了！
                            </h2>
                            <p className="text-white text-2xl font-bold mt-2 drop-shadow-md">快收竿！</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Controls Layer */}
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
                    <div className="mt-72 pointer-events-auto">
                        {!fightMode && !lastCatch && (
                            <div className="flex gap-6 flex-col items-center">
                                {!isFishing && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); castRod(); }}
                                        className="px-12 py-5 rounded-full font-black text-2xl shadow-xl transition-all border-4 border-white/50 bg-green-500 text-white hover:bg-green-600 hover:shadow-green-400/50"
                                    >
                                        🎣 抛竿 (20金币)
                                    </motion.button>
                                )}

                                {gameState === 'biting' && (
                                    <motion.button
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); startFight(); }}
                                        className="px-16 py-6 bg-red-500 text-white rounded-full font-black text-3xl shadow-2xl animate-pulse border-4 border-white hover:bg-red-600"
                                    >
                                        ⚡ 收竿！
                                    </motion.button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Fight Mode Overlay */}
                {fightMode && (
                    <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
                        <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl flex flex-col items-center gap-6">
                            <h2 className="text-4xl font-black text-white drop-shadow-md animate-pulse">
                                {isHolding ? "✊ 拉紧！" : "✋ 松开！"}
                            </h2>

                            {/* Tension Bar */}
                            <div className="relative w-24 h-80 bg-gray-800 rounded-full border-4 border-white shadow-inner overflow-hidden">
                                {/* Safe Zone */}
                                <div className="absolute top-[20%] bottom-[20%] left-0 right-0 bg-green-500/30 border-y-4 border-green-400/50 flex items-center justify-center">
                                    <span className="text-white/40 font-bold rotate-90 text-lg tracking-widest">安全区</span>
                                </div>

                                {/* Tension Level */}
                                <motion.div
                                    className={`absolute bottom-0 left-0 right-0 transition-colors duration-100 ${tension >= 20 && tension <= 80 ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                    style={{ height: `${tension}%` }}
                                />

                                {/* Indicator Line */}
                                <div className="absolute left-0 right-0 border-t-4 border-white shadow-sm transition-all duration-75" style={{ bottom: `${tension}%` }} />
                            </div>

                            {/* Progress Bar */}
                            <div className="w-80 h-10 bg-gray-700 rounded-full border-2 border-white/50 overflow-hidden relative">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                                    style={{ width: `${progress}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-md">
                                    捕获进度 {Math.round(progress)}%
                                </div>
                            </div>

                            <div className="text-white/80 font-bold text-lg flex items-center gap-2">
                                <Info className="w-5 h-5" />
                                <span>按住空格 / 鼠标控制力度</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Catch Result Overlay */}
                <AnimatePresence>
                    {lastCatch && (
                        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
                            <motion.div
                                initial={{ scale: 0, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0 }}
                                className="bg-white rounded-3xl p-8 shadow-2xl border-8 border-yellow-400 max-w-md w-full text-center relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-32 bg-yellow-100/50 -z-10 rounded-b-[50%]" />

                                {lastCatch.image_url ? (
                                    <div className="w-56 h-56 mx-auto mb-6 relative">
                                        <img
                                            src={lastCatch.image_url}
                                            alt={lastCatch.name}
                                            className="w-full h-full object-contain drop-shadow-xl"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-9xl mb-6 animate-bounce">{lastCatch.emoji}</div>
                                )}

                                <h3 className="text-4xl font-black text-gray-800 mb-2">{lastCatch.name}</h3>
                                <div className="flex justify-center gap-2 mb-6">
                                    {Array.from({ length: lastCatch.stars }).map((_, i) => (
                                        <span key={i} className="text-yellow-500 text-3xl filter drop-shadow-sm">⭐</span>
                                    ))}
                                </div>
                                <p className="text-gray-600 mb-8 text-lg font-medium bg-gray-50 p-4 rounded-xl">{lastCatch.description}</p>

                                <div className="flex gap-4">
                                    <button
                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); sellFish(lastCatch); }}
                                        className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-bold text-xl hover:bg-green-600 transition-colors shadow-lg border-b-4 border-green-700 active:border-b-0 active:translate-y-1"
                                    >
                                        💰 卖出 +{lastCatch.sell_price}
                                    </button>
                                    <button
                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); keepFish(); }}
                                        className="flex-1 bg-blue-500 text-white py-4 rounded-2xl font-bold text-xl hover:bg-blue-600 transition-colors shadow-lg border-b-4 border-blue-700 active:border-b-0 active:translate-y-1"
                                    >
                                        📦 收藏
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
