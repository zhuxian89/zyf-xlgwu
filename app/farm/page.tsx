'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sprout, Droplets, ShoppingCart, Coins, X, Book } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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

// 10 types of crops with different growth times
const CROP_TYPES = {
    carrot: { name: '胡萝卜', emoji: '🥕', seedEmoji: '🌱', growthTime: 20, price: 5, sellPrice: 15, image: '/images/crops/carrot.png' },
    tomato: { name: '番茄', emoji: '🍅', seedEmoji: '🌱', growthTime: 30, price: 8, sellPrice: 22, image: '/images/crops/tomato.png' },
    strawberry: { name: '草莓', emoji: '🍓', seedEmoji: '🌱', growthTime: 40, price: 12, sellPrice: 35, image: '/images/crops/strawberry.png' },
    corn: { name: '玉米', emoji: '🌽', seedEmoji: '🌱', growthTime: 50, price: 15, sellPrice: 42, image: '/images/crops/corn.png' },
    wheat: { name: '小麦', emoji: '🌾', seedEmoji: '🌱', growthTime: 60, price: 10, sellPrice: 28, image: '/images/crops/wheat.png' },
    watermelon: { name: '西瓜', emoji: '🍉', seedEmoji: '🌱', growthTime: 90, price: 25, sellPrice: 70, image: '/images/crops/watermelon.png' },
    grape: { name: '葡萄', emoji: '🍇', seedEmoji: '🌱', growthTime: 80, price: 20, sellPrice: 55, image: '/images/crops/grape.png' },
    pumpkin: { name: '南瓜', emoji: '🎃', seedEmoji: '🌱', growthTime: 100, price: 30, sellPrice: 85, image: '/images/crops/pumpkin.png' },
    eggplant: { name: '茄子', emoji: '🍆', seedEmoji: '🌱', growthTime: 45, price: 10, sellPrice: 30, image: '/images/crops/eggplant.png' },
    sunflower: { name: '向日葵', emoji: '🌻', seedEmoji: '🌱', growthTime: 70, price: 18, sellPrice: 50, image: '/images/crops/sunflower.png' },
};

const ANIMAL_TYPES = {
    chicken: { name: '小鸡', emoji: '🐔', price: 50, product: '🥚', productName: '鸡蛋', productionTime: 60, sellPrice: 15 },
    cow: { name: '奶牛', emoji: '🐄', price: 100, product: '🥛', productName: '牛奶', productionTime: 120, sellPrice: 30 },
    sheep: { name: '绵羊', emoji: '🐑', price: 80, product: '🧶', productName: '羊毛', productionTime: 90, sellPrice: 25 },
};

// Growth stages based on progress percentage
const getGrowthStage = (progress: number, watered: boolean) => {
    if (progress >= 100) return 'ready';
    if (progress >= 66) return watered ? 'large' : 'medium';
    if (progress >= 33) return watered ? 'medium' : 'small';
    return 'seed';
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
    const [showInventory, setShowInventory] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [viewingCrop, setViewingCrop] = useState<{ type: string; emoji: string } | null>(null);
    // Inventory: stores harvested crops before selling
    const [inventory, setInventory] = useState<{ [key: string]: number }>({});
    // Collection: tracks which crops have ever been harvested
    const [collection, setCollection] = useState<string[]>([]);

    // Load inventory and collection from database on mount
    useEffect(() => {
        loadInventoryData();
    }, []);

    const loadInventoryData = async () => {
        try {
            const res = await fetch('/api/farm/inventory');
            if (res.ok) {
                const data = await res.json();
                setInventory(data.inventory || {});
                setCollection(data.collection || []);
            }
        } catch (error) {
            console.error('Failed to load inventory:', error);
        }
    };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                // No toast for planting - cleaner experience
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
                showToast('浇水成功！作物长得更快了！', 'success');
            }
        } catch (error) {
            showToast('浇水失败', 'error');
        }
    };

    const harvestCrop = async (cropId: string, cropType: string) => {
        try {
            const res = await fetch('/api/farm/harvest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cropId, toInventory: true }),
            });

            if (res.ok) {
                const data = await res.json();
                setCrops(data.crops);
                // Add to inventory via API
                const crop = CROP_TYPES[cropType as keyof typeof CROP_TYPES];
                try {
                    const invRes = await fetch('/api/farm/inventory', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cropType, quantity: 1 }),
                    });
                    if (invRes.ok) {
                        const invData = await invRes.json();
                        setInventory(invData.inventory);
                        setCollection(invData.collection);
                    }
                } catch (e) {
                    console.error('Failed to update inventory:', e);
                }
                // Show the harvested crop in a modal
                setViewingCrop({ type: cropType, emoji: crop.emoji });
                showToast(`收获了 ${crop.name}！已放入仓库`, 'success');
            } else {
                const error = await res.json();
                showToast(error.error || '收获失败', 'warning');
            }
        } catch (error) {
            showToast('收获失败', 'error');
        }
    };

    // Sell crops from inventory
    const sellFromInventory = async (cropType: string, amount: number) => {
        const crop = CROP_TYPES[cropType as keyof typeof CROP_TYPES];
        if (!crop) return;

        const currentAmount = inventory[cropType] || 0;
        if (currentAmount < amount) return;

        try {
            const res = await fetch('/api/farm/inventory', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cropType, quantity: amount }),
            });

            if (res.ok) {
                const data = await res.json();
                setInventory(data.inventory);
                setCoins(data.coins);
                showToast(`卖出 ${amount} 个${crop.name}，获得 ${data.earnings} 金币！`, 'success');
            } else {
                showToast('卖出失败', 'error');
            }
        } catch (error) {
            showToast('卖出失败', 'error');
        }
    };

    // Get total inventory count
    const getTotalInventory = () => {
        return Object.values(inventory).reduce((sum, count) => sum + count, 0);
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
        const waterBonus = crop.watered_at ? 0.5 : 0; // 50% faster when watered
        const effectiveElapsed = elapsed * (1 + waterBonus);
        return Math.min(100, (effectiveElapsed / crop.growth_time) * 100);
    };

    const isCropReady = (crop: Crop) => getCropProgress(crop) >= 100;

    const canCollectProduct = (animal: Animal) => {
        if (!animal.last_produced_at) return true;
        const elapsed = (currentTime - animal.last_produced_at) / 1000;
        return elapsed >= animal.production_time;
    };

    // Get size class based on growth stage
    const getSizeClass = (stage: string) => {
        switch (stage) {
            case 'seed': return 'text-lg';
            case 'small': return 'text-xl';
            case 'medium': return 'text-2xl';
            case 'large': return 'text-3xl';
            case 'ready': return 'text-4xl';
            default: return 'text-xl';
        }
    };

    return (
        <div className="h-screen bg-gradient-to-b from-green-100 via-yellow-50 to-orange-50 flex flex-col overflow-hidden">
            <AnimatePresence>
                {toasts.map(t => (
                    <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
                ))}
            </AnimatePresence>

            {/* Header - Compact */}
            <div className="shrink-0 z-10 bg-white/80 backdrop-blur-md px-4 py-2 shadow-sm border-b border-green-200">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <button className="p-2 bg-green-500/20 rounded-full hover:bg-green-500/30 transition-colors">
                                <ArrowLeft className="w-5 h-5 text-green-700" />
                            </button>
                        </Link>
                        <h1 className="text-xl font-black text-green-700 flex items-center gap-2">
                            <Sprout className="w-6 h-6" />
                            欢乐农场
                        </h1>
                    </div>

                    {/* Tools in Header */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedTool(selectedTool === 'plant' ? null : 'plant')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all text-sm ${selectedTool === 'plant'
                                ? 'bg-green-500 text-white shadow-lg'
                                : 'bg-white text-green-700 hover:bg-green-50'
                                }`}
                        >
                            🌱 种植
                        </button>
                        <button
                            onClick={() => setSelectedTool(selectedTool === 'water' ? null : 'water')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all text-sm ${selectedTool === 'water'
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-white text-blue-700 hover:bg-blue-50'
                                }`}
                        >
                            💧 浇水
                        </button>
                        <button
                            onClick={() => setSelectedTool(selectedTool === 'collect' ? null : 'collect')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all text-sm ${selectedTool === 'collect'
                                ? 'bg-orange-500 text-white shadow-lg'
                                : 'bg-white text-orange-700 hover:bg-orange-50'
                                }`}
                        >
                            🧺 收获
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="bg-yellow-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 border-2 border-yellow-500 shadow-md">
                            <Coins className="w-4 h-4 text-yellow-900" />
                            <span className="font-bold text-yellow-900">{coins}</span>
                        </div>
                        <button
                            onClick={() => setShowInventory(true)}
                            className="px-3 py-1.5 bg-amber-500 text-white rounded-full font-bold hover:bg-amber-600 transition-colors flex items-center gap-1.5 shadow-md text-sm relative"
                        >
                            <Book className="w-4 h-4" />
                            图鉴
                            {getTotalInventory() > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                    {getTotalInventory()}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setShowShop(!showShop)}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition-colors flex items-center gap-1.5 shadow-md text-sm"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            商店
                        </button>
                    </div>
                </div>
            </div>

            {/* Seed Selection Bar - Only show when planting */}
            {selectedTool === 'plant' && (
                <div className="shrink-0 bg-green-600/90 backdrop-blur-md px-4 py-2 shadow-sm">
                    <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
                        <span className="text-white font-bold text-sm shrink-0">选择种子:</span>
                        {Object.entries(CROP_TYPES).map(([key, crop]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedCropType(key as keyof typeof CROP_TYPES)}
                                className={`shrink-0 px-3 py-1.5 rounded-lg font-bold transition-all text-sm flex items-center gap-1 ${selectedCropType === key
                                    ? 'bg-white text-green-700 ring-2 ring-yellow-400'
                                    : 'bg-green-700/50 text-white hover:bg-green-700'
                                    }`}
                            >
                                <span>{crop.emoji}</span>
                                <span className="hidden sm:inline">{crop.name}</span>
                                <span className="text-xs opacity-75">({crop.growthTime}s)</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content - Responsive Layout */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0 overflow-auto">
                {/* Farm Grid */}
                <div className="flex-1 bg-[#8B7355] p-4 rounded-2xl shadow-xl border-4 border-[#6B5344] flex flex-col">
                    <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2 shrink-0">
                        <Sprout className="w-5 h-5" />
                        农田
                    </h2>
                    {/* 响应式网格：手机4列、平板4列、大屏6列 */}
                    <div className="flex-1 grid grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2 content-start">
                        {Array.from({ length: 24 }, (_, i) => {
                            const x = i % 6;
                            const y = Math.floor(i / 6);
                            const crop = crops.find(c => c.x === x && c.y === y);
                            const progress = crop ? getCropProgress(crop) : 0;
                            const ready = crop ? isCropReady(crop) : false;
                            const cropType = crop ? CROP_TYPES[crop.type as keyof typeof CROP_TYPES] : null;
                            const stage = crop ? getGrowthStage(progress, !!crop.watered_at) : 'empty';
                            const sizeClass = getSizeClass(stage);

                            return (
                                <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`rounded-xl flex items-center justify-center cursor-pointer transition-all relative w-full h-16 sm:h-20 ${crop
                                        ? ready
                                            ? 'bg-green-400 shadow-lg shadow-green-500/50'
                                            : crop.watered_at
                                                ? 'bg-amber-600'
                                                : 'bg-amber-700'
                                        : 'bg-amber-900 hover:bg-amber-800'
                                        }`}
                                    onClick={() => {
                                        if (crop && ready) {
                                            // 成熟的作物直接点击收获
                                            harvestCrop(crop.id, crop.type);
                                        } else if (selectedTool === 'plant' && !crop) {
                                            plantCrop(x, y);
                                        } else if (selectedTool === 'water' && crop && !ready && !crop.watered_at) {
                                            waterCrop(crop.id);
                                        }
                                    }}
                                >
                                    {crop ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            {ready ? (
                                                <motion.div
                                                    animate={{ scale: [1, 1.1, 1] }}
                                                    transition={{ repeat: Infinity, duration: 1 }}
                                                    className={sizeClass}
                                                >
                                                    {cropType?.emoji}
                                                </motion.div>
                                            ) : (
                                                <>
                                                    <motion.div
                                                        className={sizeClass}
                                                        animate={{ scale: crop.watered_at ? [1, 1.05, 1] : 1 }}
                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                    >
                                                        {stage === 'seed' ? '🌱' : stage === 'small' ? '🌿' : cropType?.emoji}
                                                    </motion.div>
                                                    <div className="absolute bottom-1 left-1 right-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 transition-all duration-1000"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    {crop.watered_at && (
                                                        <div className="absolute top-1 right-1">
                                                            <Droplets className="w-3 h-3 text-blue-300" />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-xl opacity-30">🌾</div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Animals Section - Separate Area */}
                <div className="md:w-64 lg:w-72 shrink-0 bg-green-700/20 p-4 rounded-2xl border-2 border-green-600/30 flex flex-col">
                    <h2 className="text-lg font-black text-green-800 mb-3 shrink-0">🐔 动物栏</h2>
                    {/* 响应式网格：手机3列、平板/大屏2列 */}
                    <div className="grid grid-cols-3 md:grid-cols-2 gap-3 content-start">
                        {animals.slice(0, 6).map(animal => {
                            const animalType = ANIMAL_TYPES[animal.type as keyof typeof ANIMAL_TYPES];
                            const canCollect = canCollectProduct(animal);

                            return (
                                <motion.div
                                    key={animal.id}
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`relative rounded-xl flex flex-col items-center justify-center h-20 md:h-24 ${canCollect
                                        ? 'bg-yellow-400 shadow-lg shadow-yellow-500/50'
                                        : 'bg-white'
                                        } border-2 border-green-600 cursor-pointer`}
                                    onClick={() => {
                                        if (canCollect) {
                                            collectProduct(animal.id);
                                        }
                                    }}
                                >
                                    <div className="text-3xl">{animalType.emoji}</div>
                                    <p className="font-bold text-green-800 text-xs mt-1">{animalType.name}</p>
                                    {canCollect && (
                                        <div className="absolute -top-1 -right-1">
                                            <motion.div
                                                animate={{ rotate: [0, 10, -10, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.5 }}
                                                className="text-lg"
                                            >
                                                {animalType.product}
                                            </motion.div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                        {animals.length === 0 && (
                            <div className="col-span-3 md:col-span-2 flex items-center justify-center text-gray-500 text-sm py-8">
                                还没有动物，去商店购买吧！
                            </div>
                        )}
                        {animals.length > 0 && animals.length < 6 && (
                            Array.from({ length: 6 - animals.length }, (_, i) => (
                                <div
                                    key={`empty-${i}`}
                                    className="rounded-xl border-2 border-dashed border-green-400/50 flex items-center justify-center text-green-400/50 text-2xl h-20 md:h-24"
                                >
                                    +
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Harvest View Modal - Shows big emoji when harvesting */}
            <AnimatePresence>
                {viewingCrop && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setViewingCrop(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 flex flex-col items-center shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 0.5 }}
                                className="text-9xl mb-4"
                            >
                                {viewingCrop.emoji}
                            </motion.div>
                            <p className="text-2xl font-black text-green-700 mb-2">
                                收获了 {CROP_TYPES[viewingCrop.type as keyof typeof CROP_TYPES]?.name}！
                            </p>
                            <p className="text-gray-500 mb-4">点击任意位置关闭</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Inventory/Collection Modal */}
            <AnimatePresence>
                {showInventory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-black text-amber-700">📚 作物图鉴</h2>
                                <button
                                    onClick={() => setShowInventory(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            {/* Inventory Section */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-700 mb-3">🎒 我的仓库</h3>
                                {getTotalInventory() === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        仓库是空的，去收获一些作物吧！
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {Object.entries(inventory).filter(([_, count]) => count > 0).map(([cropType, count]) => {
                                            const crop = CROP_TYPES[cropType as keyof typeof CROP_TYPES];
                                            if (!crop) return null;
                                            return (
                                                <div key={cropType} className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200 text-center">
                                                    <div className="text-5xl mb-2">{crop.emoji}</div>
                                                    <p className="font-bold text-amber-800">{crop.name}</p>
                                                    <p className="text-sm text-gray-600 mb-2">数量: <span className="font-bold text-amber-600">{count}</span></p>
                                                    <p className="text-xs text-green-600 mb-2">单价: {crop.sellPrice} 金币</p>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => sellFromInventory(cropType, 1)}
                                                            className="flex-1 px-2 py-1 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors text-xs"
                                                        >
                                                            卖1个
                                                        </button>
                                                        {count > 1 && (
                                                            <button
                                                                onClick={() => sellFromInventory(cropType, count)}
                                                                className="flex-1 px-2 py-1 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors text-xs"
                                                            >
                                                                全卖
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Collection Section - All crops */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-700 mb-3">🌱 全部作物 ({collection.length}/{Object.keys(CROP_TYPES).length})</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                    {Object.entries(CROP_TYPES).map(([key, crop]) => {
                                        const collected = collection.includes(key);
                                        return (
                                            <div
                                                key={key}
                                                className={`p-3 rounded-xl border-2 text-center transition-all ${
                                                    collected
                                                        ? 'bg-green-50 border-green-200'
                                                        : 'bg-gray-100 border-gray-200 opacity-60'
                                                }`}
                                            >
                                                <div className="text-4xl mb-2">{collected ? crop.emoji : '❓'}</div>
                                                <p className="font-bold text-gray-800 text-sm">{collected ? crop.name : '???'}</p>
                                                <p className="text-xs text-gray-500">{crop.growthTime}秒</p>
                                                <p className="text-xs text-green-600">售价: {crop.sellPrice}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Shop Modal */}
            <AnimatePresence>
                {showShop && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-black text-green-700">🏪 农场商店</h2>
                                <button
                                    onClick={() => setShowShop(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-700 mb-3">🌱 种子商店</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                    {Object.entries(CROP_TYPES).map(([key, crop]) => (
                                        <div key={key} className="p-3 bg-green-50 rounded-xl border-2 border-green-200 text-center">
                                            <div className="text-4xl mb-2">{crop.emoji}</div>
                                            <p className="font-bold text-green-800 text-sm">{crop.name}</p>
                                            <p className="text-xs text-gray-500">{crop.growthTime}秒</p>
                                            <p className="text-xs text-amber-600 font-bold">买:{crop.price}</p>
                                            <p className="text-xs text-green-600 font-bold">卖:{crop.sellPrice}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-center">* 选择种植工具后点击农田即可种植</p>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-700 mb-3">🐾 动物商店</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.entries(ANIMAL_TYPES).map(([key, animal]) => (
                                        <div key={key} className="p-3 bg-blue-50 rounded-xl border-2 border-blue-200 text-center">
                                            <div className="text-4xl mb-2">{animal.emoji}</div>
                                            <p className="font-bold text-blue-800">{animal.name}</p>
                                            <p className="text-xs text-gray-600">产出: {animal.product} {animal.productName}</p>
                                            <p className="text-xs text-gray-600">周期: {animal.productionTime}秒</p>
                                            <button
                                                onClick={() => buyAnimal(key as keyof typeof ANIMAL_TYPES)}
                                                className="mt-2 w-full px-2 py-1.5 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors text-sm"
                                            >
                                                {animal.price} 金币
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
