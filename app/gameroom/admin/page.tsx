"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Coins, Zap, Clock, ShieldCheck, Lock } from "lucide-react";
import Link from "next/link";
import Toast, { useToast } from "../../components/Toast";

interface Stats {
    coins: number;
    energy: number;
    max_energy: number;
    daily_play_seconds: number;
    daily_limit_seconds: number;
}

export default function AdminPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(false);
    const [pin, setPin] = useState("");
    const { toast, showToast } = useToast();

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/admin/stats");
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleUpdate = async (action: string, amount?: number) => {
        try {
            const res = await fetch("/api/admin/update-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, amount }),
            });
            if (res.ok) {
                showToast("操作成功！", "success");
                fetchStats();
            } else {
                showToast("操作失败", "error");
            }
        } catch (error) {
            showToast("网络错误", "error");
        }
    };

    const handleVerify = () => {
        // Simple PIN for demonstration. In a real app, this would be more secure.
        // Default PIN: 8888
        if (pin === "8888") {
            setIsVerified(true);
        } else {
            showToast("密码错误", "error");
        }
    };

    if (!isVerified) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 mb-2">家长验证</h1>
                    <p className="text-slate-500 mb-6">请输入管理密码以进入设置页面</p>

                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full text-center text-3xl font-bold tracking-widest border-2 border-slate-200 rounded-xl py-4 mb-6 focus:border-indigo-500 focus:outline-none transition-colors"
                        placeholder="••••"
                        maxLength={4}
                    />

                    <button
                        onClick={handleVerify}
                        className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                        解锁
                    </button>
                    <p className="mt-4 text-xs text-slate-400">默认密码: 8888</p>

                    <Link href="/gameroom" className="block mt-6 text-slate-500 hover:text-slate-800">
                        返回游戏室
                    </Link>
                </div>
                <Toast toast={toast} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/gameroom">
                            <button className="p-3 bg-white rounded-full shadow-md hover:bg-slate-100 transition-colors">
                                <ArrowLeft className="w-6 h-6 text-slate-700" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                                <ShieldCheck className="w-8 h-8 text-indigo-600" />
                                家长管理中心
                            </h1>
                            <p className="text-slate-500">管理孩子的游戏资源与时间限制</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Coins Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -mr-16 -mt-16 opacity-50" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                                    <Coins className="w-8 h-8" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-700">金币管理</h2>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-slate-500 mb-1">当前金币</p>
                                <p className="text-4xl font-black text-amber-500">{stats?.coins ?? "..."}</p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleUpdate('add_coins', 100)}
                                    className="w-full py-3 bg-amber-50 text-amber-700 font-bold rounded-xl hover:bg-amber-100 transition-colors border border-amber-200"
                                >
                                    + 100 金币
                                </button>
                                <button
                                    onClick={() => handleUpdate('add_coins', 1000)}
                                    className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200"
                                >
                                    + 1,000 金币
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Energy Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16 opacity-50" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
                                    <Zap className="w-8 h-8" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-700">体力管理</h2>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-slate-500 mb-1">当前体力</p>
                                <p className="text-4xl font-black text-purple-500">
                                    {stats?.energy ?? "..."} <span className="text-lg text-slate-400">/ {stats?.max_energy}</span>
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleUpdate('add_energy', 1)}
                                    className="w-full py-3 bg-purple-50 text-purple-700 font-bold rounded-xl hover:bg-purple-100 transition-colors border border-purple-200"
                                >
                                    + 1 点体力
                                </button>
                                <button
                                    onClick={() => handleUpdate('add_energy', 5)}
                                    className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors shadow-lg shadow-purple-200"
                                >
                                    + 5 点体力 (充满)
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Time Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full -mr-16 -mt-16 opacity-50" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-700">时间管理</h2>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-slate-500 mb-1">今日游戏时间</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black text-emerald-500">
                                        {stats ? Math.floor(stats.daily_play_seconds / 60) : "..."}
                                    </p>
                                    <span className="text-slate-400">/ {stats ? Math.floor(stats.daily_limit_seconds / 60) : "..."} 分钟</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleUpdate('add_time', 30)}
                                    className="w-full py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200"
                                >
                                    增加 30 分钟时长
                                </button>
                                <button
                                    onClick={() => handleUpdate('reset_time')}
                                    className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200"
                                >
                                    重置今日已用时间
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="mt-8 text-center text-slate-400 text-sm">
                    <p>所有操作即时生效，请合理安排孩子的游戏时间。</p>
                </div>
            </div>
            <Toast toast={toast} />
        </div>
    );
}
