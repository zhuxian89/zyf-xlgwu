"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Brain, Trophy, Sparkles } from "lucide-react";
import { useGameStore } from "../hooks/useGameStore";
import { getQuestions, updateUserCoins } from "../lib/db";
import Link from "next/link";

interface Question {
    id: number;
    subject: string;
    content: string;
    answer: string;
    reward: number;
}

export default function SchoolPage() {
    const router = useRouter();
    const { coins, addCoins } = useGameStore();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAdmin, setShowAdmin] = useState(false);

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        const qs = await getQuestions();
        setQuestions(qs as any);
        setLoading(false);
    };

    const currentQuestion = questions[currentIndex];

    const handleSubmit = async () => {
        if (!currentQuestion || !userAnswer.trim()) return;

        const isCorrect = userAnswer.trim() === currentQuestion.answer.trim();

        if (isCorrect) {
            setShowResult("correct");
            const newCoins = coins + currentQuestion.reward;
            addCoins(currentQuestion.reward);
            await updateUserCoins(newCoins);

            setTimeout(() => {
                setShowResult(null);
                setUserAnswer("");
                if (currentIndex < questions.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                } else {
                    setCurrentIndex(0); // 循环
                }
            }, 2000);
        } else {
            setShowResult("wrong");
            setTimeout(() => {
                setShowResult(null);
                setUserAnswer("");
            }, 1500);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-orange-200 to-yellow-200">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <BookOpen className="w-20 h-20 text-orange-600" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-gradient-to-b from-orange-300 via-orange-200 to-yellow-100 relative overflow-hidden">
            {/* 装饰背景 */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-10 left-10 text-8xl">📚</div>
                <div className="absolute top-20 right-20 text-7xl">✏️</div>
                <div className="absolute bottom-20 left-20 text-6xl">🎓</div>
                <div className="absolute bottom-10 right-40 text-7xl">📖</div>
            </div>

            {/* 顶部导航 */}
            <div className="absolute top-6 left-6 right-6 z-50 flex justify-between items-center">
                <Link href="/">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="glass rounded-full p-4 shadow-xl border-2 border-white"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </motion.button>
                </Link>

                <motion.div
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    className="glass rounded-3xl px-8 py-4 shadow-xl border-4 border-white"
                >
                    <h1 className="text-4xl font-black text-orange-600 font-[var(--font-fredoka)]">
                        🏫 欢迎来到学校
                    </h1>
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAdmin(!showAdmin)}
                    className="glass rounded-full p-4 shadow-xl border-2 border-white"
                >
                    <span className="text-2xl">⚙️</span>
                </motion.button>
            </div>

            {/* 主内容区 */}
            <div className="flex items-center justify-center h-full pt-32 pb-20 px-10">
                {!showAdmin && currentQuestion ? (
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 10 }}
                        className="glass rounded-[3rem] p-12 shadow-2xl border-8 border-white max-w-4xl w-full relative"
                    >
                        {/* 科目标签 */}
                        <div className="absolute -top-6 left-12">
                            <div
                                className={`px-8 py-3 rounded-full shadow-lg border-4 border-white font-black text-xl ${currentQuestion.subject === "math"
                                        ? "bg-gradient-to-r from-blue-400 to-blue-600 text-white"
                                        : "bg-gradient-to-r from-pink-400 to-pink-600 text-white"
                                    }`}
                            >
                                {currentQuestion.subject === "math" ? "📐 数学" : "📖 语文"}
                            </div>
                        </div>

                        {/* 题目 */}
                        <div className="mt-8 mb-12">
                            <p className="text-6xl font-black text-gray-800 text-center leading-relaxed">
                                {currentQuestion.content}
                            </p>
                        </div>

                        {/* 输入框 */}
                        <div className="mb-8">
                            <input
                                type="text"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                                placeholder="输入答案..."
                                disabled={showResult !== null}
                                className="w-full text-5xl font-bold text-center py-6 px-8 rounded-3xl border-4 border-orange-300 focus:border-orange-500 focus:outline-none shadow-inner"
                                autoFocus
                            />
                        </div>

                        {/* 提交按钮 */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSubmit}
                            disabled={showResult !== null}
                            className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white text-4xl font-black py-6 rounded-3xl shadow-xl border-4 border-white disabled:opacity-50"
                        >
                            ✓ 提交答案
                        </motion.button>

                        {/* 进度 */}
                        <div className="mt-6 text-center text-gray-600 font-bold text-xl">
                            第 {currentIndex + 1} / {questions.length} 题
                        </div>
                    </motion.div>
                ) : showAdmin ? (
                    <AdminPanel onClose={() => setShowAdmin(false)} onUpdate={loadQuestions} />
                ) : (
                    <div className="text-center">
                        <p className="text-4xl font-black text-gray-600 mb-8">暂无题目</p>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowAdmin(true)}
                            className="bg-gradient-to-r from-orange-400 to-orange-600 text-white px-12 py-6 rounded-3xl text-3xl font-black shadow-xl"
                        >
                            去添加题目
                        </motion.button>
                    </div>
                )}
            </div>

            {/* 答题结果动画 */}
            <AnimatePresence>
                {showResult === "correct" && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{
                                    rotate: [0, 10, -10, 0],
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{ duration: 0.5, repeat: 3 }}
                                className="text-[20rem]"
                            >
                                🎉
                            </motion.div>
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            >
                                <div className="bg-green-500 text-white px-16 py-8 rounded-full shadow-2xl border-8 border-white">
                                    <p className="text-7xl font-black">+{currentQuestion?.reward} 💰</p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {showResult === "wrong" && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                        exit={{ scale: 0 }}
                        className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"
                    >
                        <div className="bg-red-500 text-white px-20 py-12 rounded-[3rem] shadow-2xl border-8 border-white">
                            <p className="text-8xl font-black">❌ 再想想</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// 管理员面板组件
function AdminPanel({ onClose, onUpdate }: { onClose: () => void; onUpdate: () => void }) {
    const [subject, setSubject] = useState("math");
    const [content, setContent] = useState("");
    const [answer, setAnswer] = useState("");
    const [reward, setReward] = useState(10);

    const handleAdd = async () => {
        if (!content.trim() || !answer.trim()) return;

        const { addQuestion } = await import("../lib/db");
        await addQuestion(subject, content, answer, reward);

        setContent("");
        setAnswer("");
        alert("题目添加成功！");
        onUpdate();
    };

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="glass rounded-[3rem] p-12 shadow-2xl border-8 border-white max-w-3xl w-full"
        >
            <h2 className="text-5xl font-black text-orange-600 mb-8 text-center">📝 添加题目</h2>

            <div className="space-y-6">
                <div>
                    <label className="block text-2xl font-bold mb-3 text-gray-700">科目</label>
                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full text-3xl py-4 px-6 rounded-2xl border-4 border-orange-300 focus:border-orange-500 focus:outline-none"
                    >
                        <option value="math">📐 数学</option>
                        <option value="chinese">📖 语文</option>
                    </select>
                </div>

                <div>
                    <label className="block text-2xl font-bold mb-3 text-gray-700">题目内容</label>
                    <input
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="例如：8 × 7 = ?"
                        className="w-full text-3xl py-4 px-6 rounded-2xl border-4 border-orange-300 focus:border-orange-500 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-2xl font-bold mb-3 text-gray-700">答案</label>
                    <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="例如：56"
                        className="w-full text-3xl py-4 px-6 rounded-2xl border-4 border-orange-300 focus:border-orange-500 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-2xl font-bold mb-3 text-gray-700">奖励金币</label>
                    <input
                        type="number"
                        value={reward}
                        onChange={(e) => setReward(Number(e.target.value))}
                        className="w-full text-3xl py-4 px-6 rounded-2xl border-4 border-orange-300 focus:border-orange-500 focus:outline-none"
                    />
                </div>

                <div className="flex gap-4 mt-8">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAdd}
                        className="flex-1 bg-gradient-to-r from-green-400 to-green-600 text-white text-3xl font-black py-5 rounded-3xl shadow-xl"
                    >
                        ✓ 添加
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        className="flex-1 bg-gradient-to-r from-gray-400 to-gray-600 text-white text-3xl font-black py-5 rounded-3xl shadow-xl"
                    >
                        ✕ 关闭
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
