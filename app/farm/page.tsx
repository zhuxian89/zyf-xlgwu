'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sprout, Droplets, ShoppingCart, Coins } from 'lucide-react';
import Link from 'next/link';
import { useGameStore } from '../hooks/useGameStore';
import { useGameAudio } from '../hooks/useGameAudio';
import Toast, { useToast } from '../components/Toast';

interface Crop {
    id: string;
    type: string;
    planted_at: number;
    watered_at: number | null;
    growth_time: number;
    x: number;
    y: number;
}

interface Animal {
    id: string;
    type: string;
    bought_at: number;
    production_time: number;
    last_produced_at: number | null;
}

const CROP_TYPES = {
    carrot: { name: '胡萝卜', emoji: '🥕', growthTime: 30, price: 10, sellPrice: 25 },
    tomato: { name: '番茄', emoji: '🍅', growthTime: 45, price: 15, sellPrice: 40 },
    wheat: { name: '小麦', emoji: '🌾', growthTime: 60, price: 20, sellPrice: 55 },
    corn: { name: '玉米', emoji: '🌽', growthTime: 90, price: 30, sellPrice: 80 },
};

const ANIMAL_TYPES = {
    chicken: { name: '小鸡', emoji: '🐔', price: 50, product: '🥚', productName: '鸡蛋', productionTime: 60, sellPrice: 15 },
    cow: { name: '奶牛', emoji: '🐄', price: 100, product: '🥛', productName: '牛奶', productionTime: 120, sellPrice: 30 },
    sheep: { name: '绵羊', emoji: '🐑', price: 80, product: '🧶', productName: '羊毛', productionTime: 90, sellPrice: 25 },
};

export default function FarmPage() {
    const { coins, setCoins } = useGameStore();
    const { toasts, showToast, removeToast } = useToast();
    const audio = useGameAudio();

    const [crops, setCrops] = useState<Crop[]>([]);
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [selectedTool, setSelectedTool] = useState<'plant' | 'water' | 'collect' | null>(null);
    const [selectedCropType, setSelectedCropType] = useState<keyof typeof CROP_TYPES>('carrot');
    const [showShop, setShowShop] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        loadFarmData();
    }, []);

    // Start farm background music on mount, stop on unmount
    useEffect(() => {
        audio.startFarmMusic();
        return () => {
            audio.stopFarmMusic();
        };
    }, [audio]);

    const loadFarmData = async () => {
        try {
            const res = await fetch('/api/farm/data');
            if (res.ok) {
                const data = await res.json();
                setCrops(data.crops || []);
                setAnimals(data.animals || []);
                setCoins(data.coins);
            }
        } catch (error) {
            console.error('Failed to load farm data:', error);
        }
    };

    const plantCrop = async (x: number, y: number) => {
        const cropType = CROP_TYPES[selectedCropType];

        if (coins < cropType.price) {
            showToast('金币不足！', 'warning');
            return;
        }

        if (crops.some(c => c.x === x && c.y === y)) {
            showToast('这里已经有作物了！', 'warning');
            return;
        }

        try {
            const res = await fetch('/api/farm/plant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: selectedCropType, x, y }),
            });

            if (res.ok) {
                const data = await res.json();
                setCrops(data.crops);
                setCoins(data.coins);
                showToast(`种下了${cropType.name}！`, 'success');
            }
        } catch (error) {
            showToast('种植失败', 'error');
        }
    };

    const waterCrop = async (cropId: string) => {
        try {
            const res = await fetch('/api/farm/water', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cropId }),
            });

            if (res.ok) {
                const data = await res.json();
                setCrops(data.crops);
                showToast('浇水成功！', 'success');
            }
        } catch (error) {
            showToast('浇水失败', 'error');
        }
    };

    const harvestCrop = async (cropId: string) => {
        try {
            const res = await fetch('/api/farm/harvest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cropId }),
            });

            if (res.ok) {
                const data = await res.json();
                setCrops(data.crops);
                setCoins(data.coins);
                showToast(`收获成功！获得 ${data.reward} 金币`, 'success');
            } else {
                const error = await res.json();
                showToast(error.error || '收获失败', 'warning');
            }
        } catch (error) {
            showToast('收获失败', 'error');
        }
    };

    const buyAnimal = async (type: keyof typeof ANIMAL_TYPES) => {
        const animalType = ANIMAL_TYPES[type];

        if (coins < animalType.price) {
            showToast('金币不足！', 'warning');
            return;
        }

        try {
            const res = await fetch('/api/farm/buy-animal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            });

            if (res.ok) {
                const data = await res.json();
                setAnimals(data.animals);
                setCoins(data.coins);
                showToast(`购买了${animalType.name}！`, 'success');
                setShowShop(false);
            }
        } catch (error) {
            showToast('购买失败', 'error');
        }
    };

    const collectProduct = async (animalId: string) => {
        try {
            const res = await fetch('/api/farm/collect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ animalId }),
            });

            if (res.ok) {
                const data = await res.json();
                setAnimals(data.animals);
                setCoins(data.coins);
                showToast(`收集成功！获得 ${data.reward} 金币`, 'success');
            } else {
                const error = await res.json();
                showToast(error.error || '收集失败', 'warning');
            }
        } catch (error) {
            showToast('收集失败', 'error');
        }
    };

    const getCropProgress = (crop: Crop) => {
        const elapsed = (currentTime - crop.planted_at) / 1000;
        const waterBonus = crop.watered_at ? 0.3 : 0;
        const effectiveElapsed = elapsed * (1 + waterBonus);
        return Math.min(100, (effectiveElapsed / crop.growth_time) * 100);
    };

    const isCropReady = (crop: Crop) => getCropProgress(crop) >= 100;

    const canCollectProduct = (animal: Animal) => {
        if (!animal.last_produced_at) return true;
        const elapsed = (currentTime - animal.last_produced_at) / 1000;
        return elapsed >= animal.production_time;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-100 via-yellow-50 to-orange-50 overflow-y-auto flex flex-col">
            <AnimatePresence>
                {toasts.map(t => (
                    <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
                ))}
            </AnimatePresence>

            {/* Header */}
            <div className="shrink-0 z-10 bg-white/80 backdrop-blur-md p-4 shadow-sm border-b border-green-200">
                <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className="p-3 bg-green-500/20 rounded-full hover:bg-green-500/30 transition-colors">
                                <ArrowLeft className="w-6 h-6 text-green-700" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-green-700 flex items-center gap-2">
                                <Sprout className="w-7 h-7 sm:w-8 sm:h-8" />
                                欢乐农场
                            </h1>
                            <p className="text-green-600 text-xs sm:text-sm mt-1">种植作物，照顾动物</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-400 px-3 sm:px-4 py-2 rounded-full flex items-center gap-2 border-2 border-yellow-500 shadow-md">
                            <Coins className="w-5 h-5 text-yellow-900" />
                            <span className="font-bold text-yellow-900 text-lg sm:text-xl">{coins}</span>
                        </div>
                        <button
                            onClick={() => setShowShop(!showShop)}
                            className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-md text-sm sm:text-base"
                        >
                            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                            商店
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full">
                {/* Tools */}
                <div className="mb-4 sm:mb-6 flex gap-2 sm:gap-3 flex-wrap">
                    <button
                        onClick={() => setSelectedTool('plant')}
                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold transition-all text-sm sm:text-base ${selectedTool === 'plant'
                            ? 'bg-green-500 text-white shadow-lg scale-105'
                            : 'bg-white text-green-700 hover:bg-green-50'
                            }`}
                    >
                        🌱 种植
                    </button>
                    <button
                        onClick={() => setSelectedTool('water')}
                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold transition-all text-sm sm:text-base ${selectedTool === 'water'
                            ? 'bg-blue-500 text-white shadow-lg scale-105'
                            : 'bg-white text-blue-700 hover:bg-blue-50'
                            }`}
                    >
                        💧 浇水
                    </button>
                    <button
                        onClick={() => setSelectedTool('collect')}
                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold transition-all text-sm sm:text-base ${selectedTool === 'collect'
                            ? 'bg-orange-500 text-white shadow-lg scale-105'
                            : 'bg-white text-orange-700 hover:bg-orange-50'
                            }`}
                    >
                        🧺 收获
                    </button>

                    {selectedTool === 'plant' && (
                        <div className="flex gap-2 ml-0 sm:ml-4 w-full sm:w-auto">
                            {Object.entries(CROP_TYPES).map(([key, crop]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedCropType(key as keyof typeof CROP_TYPES)}
                                    className={`px-3 sm:px-4 py-2 rounded-lg font-bold transition-all text-xs sm:text-sm ${selectedCropType === key
                                        ? 'bg-green-600 text-white ring-4 ring-green-300'
                                        : 'bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    {crop.emoji} {crop.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Farm Grid */}
                <div className="bg-[#8B7355] p-3 sm:p-6 rounded-3xl shadow-2xl border-2 sm:border-4 border-[#6B5344] mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4 flex items-center gap-2">
                        <Sprout className="w-5 h-5 sm:w-6 sm:h-6" />
                        农田
                    </h2>
                    <div className="grid grid-cols-6 gap-2 sm:gap-3">
                        {Array.from({ length: 24 }, (_, i) => {
                            const x = i % 6;
                            const y = Math.floor(i / 6);
                            const crop = crops.find(c => c.x === x && c.y === y);
                            const progress = crop ? getCropProgress(crop) : 0;
                            const ready = crop ? isCropReady(crop) : false;

                            return (
                                <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`aspect-square rounded-lg sm:rounded-xl flex items-center justify-center text-2xl sm:text-4xl cursor-pointer transition-all ${crop
                                        ? ready
                                            ? 'bg-green-400 shadow-lg shadow-green-500/50'
                                            : 'bg-amber-700'
                                        : 'bg-amber-900 hover:bg-amber-800'
                                        }`}
                                    onClick={() => {
                                        if (selectedTool === 'plant' && !crop) {
                                            plantCrop(x, y);
                                        } else if (selectedTool === 'water' && crop && !ready) {
                                            waterCrop(crop.id);
                                        } else if (selectedTool === 'collect' && crop && ready) {
                                            harvestCrop(crop.id);
                                        }
                                    }}
                                >
                                    {crop ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            {ready ? (
                                                <motion.div
                                                    animate={{ scale: [1, 1.1, 1] }}
                                                    transition={{ repeat: Infinity, duration: 1 }}
                                                    className="text-3xl sm:text-5xl"
                                                >
                                                    {CROP_TYPES[crop.type as keyof typeof CROP_TYPES].emoji}
                                                </motion.div>
                                            ) : (
                                                <>
                                                    <div className="text-lg sm:text-2xl">🌱</div>
                                                    <div className="absolute bottom-0.5 sm:bottom-1 left-0.5 sm:left-1 right-0.5 sm:right-1 h-0.5 sm:h-1 bg-white/30 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 transition-all duration-1000"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    {crop.watered_at && (
                                                        <div className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1">
                                                            <Droplets className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-lg sm:text-2xl opacity-30">🌾</div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Animals Section */}
                <div className="bg-green-700/20 p-3 sm:p-6 rounded-3xl border-2 border-green-600/30">
                    <h2 className="text-xl sm:text-2xl font-black text-green-800 mb-3 sm:mb-4">🐔 动物栏</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {animals.map(animal => {
                            const animalType = ANIMAL_TYPES[animal.type as keyof typeof ANIMAL_TYPES];
                            const canCollect = canCollectProduct(animal);

                            return (
                                <motion.div
                                    key={animal.id}
                                    whileHover={{ y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`relative p-3 sm:p-4 rounded-2xl ${canCollect
                                        ? 'bg-yellow-400 shadow-lg shadow-yellow-500/50'
                                        : 'bg-white'
                                        } border-2 border-green-600 text-center cursor-pointer`}
                                    onClick={() => {
                                        if (selectedTool === 'collect' && canCollect) {
                                            collectProduct(animal.id);
                                        }
                                    }}
                                >
                                    <div className="text-4xl sm:text-6xl mb-2">{animalType.emoji}</div>
                                    <p className="font-bold text-green-800 text-sm sm:text-base">{animalType.name}</p>
                                    {canCollect && (
                                        <div className="absolute -top-2 -right-2">
                                            <motion.div
                                                animate={{ rotate: [0, 10, -10, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.5 }}
                                                className="text-2xl sm:text-3xl"
                                            >
                                                {animalType.product}
                                            </motion.div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                        {animals.length === 0 && (
                            <div className="col-span-2 sm:col-span-3 lg:col-span-4 text-center py-8 sm:py-12 text-gray-500">
                                还没有动物，去商店购买吧！
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Shop Modal */}
            <AnimatePresence>
                {showShop && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
                        >
                            <h2 className="text-2xl sm:text-3xl font-black text-green-700 mb-4 sm:mb-6">🏪 农场商店</h2>

                            <div className="mb-6 sm:mb-8">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-3">🌱 种子</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(CROP_TYPES).map(([key, crop]) => (
                                        <div key={key} className="p-3 sm:p-4 bg-green-50 rounded-xl border-2 border-green-200">
                                            <div className="text-3xl sm:text-4xl mb-2">{crop.emoji}</div>
                                            <p className="font-bold text-green-800 text-sm sm:text-base">{crop.name}</p>
                                            <p className="text-xs sm:text-sm text-gray-600">生长: {crop.growthTime}秒</p>
                                            <p className="text-xs sm:text-sm text-green-600 font-bold">售价: {crop.sellPrice} 金币</p>
                                            <p className="text-xs text-gray-500 mt-1">购买时直接种植</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4 sm:mb-6">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-3">🐾 动物</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.entries(ANIMAL_TYPES).map(([key, animal]) => (
                                        <div key={key} className="p-3 sm:p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                                            <div className="text-3xl sm:text-4xl mb-2">{animal.emoji}</div>
                                            <p className="font-bold text-blue-800 text-sm sm:text-base">{animal.name}</p>
                                            <p className="text-xs sm:text-sm text-gray-600">产出: {animal.product} {animal.productName}</p>
                                            <p className="text-xs sm:text-sm text-gray-600">周期: {animal.productionTime}秒</p>
                                            <button
                                                onClick={() => buyAnimal(key as keyof typeof ANIMAL_TYPES)}
                                                className="mt-2 w-full px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors text-sm sm:text-base"
                                            >
                                                购买 {animal.price} 金币
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setShowShop(false)}
                                className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gray-500 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors text-sm sm:text-base"
                            >
                                关闭
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
