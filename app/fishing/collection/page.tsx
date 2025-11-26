'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Lock, X, DollarSign } from 'lucide-react';
import Link from 'next/link';
import Toast, { useToast } from '../../components/Toast';
import { useGameStore } from '../../hooks/useGameStore';

interface Fish {
    id: number;
    name: string;
    name_en: string;
    stars: number;
    sell_price: number;
    image_url: string;
    emoji: string;
    description: string;
    caught?: boolean;
    count?: number;
}

export default function FishCollectionPage() {
    const [fishes, setFishes] = useState<Fish[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'caught' | 'missing'>('all');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const { toasts, showToast, removeToast } = useToast();
    const { coins, setCoins } = useGameStore();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const fishRes = await fetch('/api/fish');
            const fishData = await fishRes.json();

            const catchRes = await fetch('/api/fish/catches');
            const catchData = await catchRes.json();

            const catchMap = new Map();
            if (catchData.catches) {
                catchData.catches.forEach((c: any) => {
                    const current = catchMap.get(c.fish_id) || 0;
                    catchMap.set(c.fish_id, current + 1);
                });
            }

            const merged = fishData.fish.map((f: Fish) => ({
                ...f,
                caught: catchMap.has(f.id),
                count: catchMap.get(f.id) || 0
            }));

            setFishes(merged);
        } catch (error) {
            console.error('Failed to load collection:', error);
        } finally {
            setLoading(false);
        }
    };

    const sellFish = async (fish: Fish, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!fish.count || fish.count <= 0) {
            showToast('没有可出售的鱼', 'warning');
            return;
        }

        try {
            const res = await fetch('/api/fish/sell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fishId: fish.id }),
            });

            if (res.ok) {
                const data = await res.json();
                setCoins(data.coins);
                showToast(`出售成功！获得 ${data.sellPrice} 金币`, 'success');
                // Refresh the collection data
                await fetchData();
            } else {
                const error = await res.json();
                showToast(error.error || '出售失败', 'error');
            }
        } catch (error) {
            console.error('Sell error:', error);
            showToast('网络错误', 'error');
        }
    };

    const filteredFishes = fishes.filter(f => {
        if (filter === 'caught') return f.caught;
        if (filter === 'missing') return !f.caught;
        return true;
    });

    return (
        <div className="h-screen flex flex-col bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 font-sans overflow-hidden text-white">
            <AnimatePresence>
                {toasts.map(t => (
                    <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
                ))}
            </AnimatePresence>

            {/* Header - Fixed */}
            <header className="shrink-0 z-10 bg-white/10 backdrop-blur-md p-4 md:p-6 shadow-sm border-b border-white/20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/fishing">
                            <button className="p-3 bg-white/20 rounded-full shadow-md hover:bg-white/30 transition-colors border border-white/30 group">
                                <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2 drop-shadow-md">
                                <span className="text-3xl md:text-4xl">📖</span> 鱼类图鉴
                            </h1>
                            <p className="text-blue-200 font-medium text-sm md:text-base mt-1">
                                收集进度: <span className="text-yellow-300 font-bold text-lg">{fishes.filter(f => f.caught).length}</span> / {fishes.length}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 bg-black/20 p-1 rounded-xl border border-white/10 self-start md:self-auto">
                        {(['all', 'caught', 'missing'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 md:px-6 py-2 rounded-lg font-bold text-sm md:text-base transition-all ${filter === f
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'text-blue-200 hover:bg-white/10'
                                    }`}
                            >
                                {f === 'all' ? '全部' : f === 'caught' ? '已捕获' : '未捕获'}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto pb-20">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-blue-300">
                            <div className="w-16 h-16 border-4 border-blue-400 border-t-white rounded-full animate-spin mb-4" />
                            <p className="font-bold text-lg">正在加载图鉴...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {filteredFishes.map((fish) => (
                                <motion.div
                                    key={fish.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ y: -5 }}
                                    className={` relative rounded-3xl p-4 border-2 transition-all overflow-hidden group ${fish.caught
                                        ? 'bg-white/10 border-white/30 shadow-lg hover:shadow-xl hover:border-white/50 backdrop-blur-sm'
                                        : 'bg-black/20 border-white/5 opacity-60'
                                        }`}
                                >
                                    {/* Card Background Decor */}
                                    {fish.caught && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-20" />
                                    )}

                                    <div
                                        className={`aspect-square rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden border shadow-inner ${fish.caught ? 'bg-white/5 border-white/20 cursor-pointer' : 'bg-black/20 border-white/5'
                                            }`}
                                        onClick={() => fish.caught && fish.image_url && setSelectedImage(fish.image_url)}
                                    >
                                        {fish.caught ? (
                                            <>
                                                {fish.image_url ? (
                                                    <img
                                                        src={fish.image_url}
                                                        alt={fish.name}
                                                        className="w-full h-full object-contain p-4 z-10 transition-transform duration-500 group-hover:scale-110 drop-shadow-lg"
                                                    />
                                                ) : (
                                                    <span className="text-7xl z-10 group-hover:scale-110 transition-transform drop-shadow-md">{fish.emoji}</span>
                                                )}
                                                <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-2xl transform scale-75 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-white/20">
                                                <Lock className="w-12 h-12 mb-2" />
                                                <span className="text-sm font-bold">???</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-center relative z-10">
                                        <h3 className={`font-black text-lg mb-1 truncate ${fish.caught ? 'text-white' : 'text-white/40'}`}>
                                            {fish.caught ? fish.name : '未知鱼类'}
                                        </h3>

                                        <div className="flex justify-center gap-0.5 mb-3 h-4">
                                            {fish.caught && Array.from({ length: fish.stars }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 drop-shadow-sm"
                                                />
                                            ))}
                                        </div>

                                        {fish.caught ? (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-xs font-bold text-blue-900 bg-blue-200 py-1 px-3 rounded-full shadow-sm">
                                                        已捕获: {fish.count}
                                                    </span>
                                                    <span className="text-xs font-bold text-green-900 bg-green-200 py-1 px-3 rounded-full shadow-sm">
                                                        ${fish.sell_price}
                                                    </span>
                                                </div>
                                                {fish.count && fish.count > 0 && (
                                                    <button
                                                        onClick={(e) => sellFish(fish, e)}
                                                        className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
                                                    >
                                                        <DollarSign className="w-3 h-3" />
                                                        卖出
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="h-6" />
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Full Screen Image Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
                        >
                            <X className="w-8 h-8 text-white" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.5 }}
                            src={selectedImage}
                            alt="Fish"
                            className="w-[800px] h-[800px] object-contain drop-shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
