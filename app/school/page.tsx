'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Brain, CheckCircle, Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Toast, { useToast } from "../components/Toast";
import { generateMathProblem, MathProblem, generatePinyinProblem, PinyinProblem, generateSentenceProblem, SentenceProblem } from './data';

// Confetti component for celebration
const Confetti = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4'];
    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                        left: `${Math.random() * 100}%`,
                        top: -20,
                    }}
                    animate={{
                        y: [0, window.innerHeight + 100],
                        x: [0, (Math.random() - 0.5) * 200],
                        rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                        opacity: [1, 1, 0],
                    }}
                    transition={{
                        duration: 2 + Math.random() * 2,
                        delay: Math.random() * 0.5,
                        ease: "easeOut",
                    }}
                />
            ))}
        </div>
    );
};

// Star burst animation
const StarBurst = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute left-1/2 top-1/2 text-4xl"
                    initial={{ scale: 0, x: '-50%', y: '-50%' }}
                    animate={{
                        scale: [0, 1.5, 0],
                        x: `calc(-50% + ${Math.cos(i * 30 * Math.PI / 180) * 150}px)`,
                        y: `calc(-50% + ${Math.sin(i * 30 * Math.PI / 180) * 150}px)`,
                        opacity: [0, 1, 0],
                    }}
                    transition={{ duration: 1, delay: i * 0.05 }}
                >
                    ⭐
                </motion.div>
            ))}
        </div>
    );
};

export default function SchoolHub() {
    const [activeTab, setActiveTab] = useState<'math' | 'chinese'>('math');
    const [coins, setCoins] = useState(0);
    const { toasts, showToast, removeToast } = useToast();

    // Math State - Single question mode
    const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [streak, setStreak] = useState(0); // Consecutive correct answers
    const [totalCorrect, setTotalCorrect] = useState(0);
    const [totalAttempts, setTotalAttempts] = useState(0);

    // Chinese State - Pinyin and Sentence
    const [chineseMode, setChineseMode] = useState<'pinyin' | 'sentence'>('pinyin');
    const [currentPinyin, setCurrentPinyin] = useState<PinyinProblem | null>(null);
    const [currentSentence, setCurrentSentence] = useState<SentenceProblem | null>(null);
    const [selectedPinyinOption, setSelectedPinyinOption] = useState<string | null>(null);
    const [pinyinResult, setPinyinResult] = useState<boolean | null>(null);
    const [selectedSentenceOption, setSelectedSentenceOption] = useState<string | null>(null);
    const [sentenceResult, setSentenceResult] = useState<boolean | null>(null);
    const [chineseStreak, setChineseStreak] = useState(0);
    const [chineseTotalCorrect, setChineseTotalCorrect] = useState(0);
    const [chineseTotalAttempts, setChineseTotalAttempts] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize audio context
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    // Play success sound
    const playSuccessSound = useCallback(() => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;

        // Happy melody: C-E-G-C (ascending)
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.value = 0.15;
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3 + i * 0.15);
            osc.start(ctx.currentTime + i * 0.15);
            osc.stop(ctx.currentTime + 0.3 + i * 0.15);
        });
    }, []);

    // Play wrong sound
    const playWrongSound = useCallback(() => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 200;
        osc.type = 'sine';
        gain.gain.value = 0.1;
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }, []);

    useEffect(() => {
        setCurrentProblem(generateMathProblem());
        setCurrentPinyin(generatePinyinProblem());
        setCurrentSentence(generateSentenceProblem());
        fetchCoins();
    }, []);

    // Focus input when new problem appears
    useEffect(() => {
        if (currentProblem && isCorrect === null) {
            inputRef.current?.focus();
        }
    }, [currentProblem, isCorrect]);

    const fetchCoins = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();
            if (data.coins) setCoins(data.coins);
        } catch (e) {
            console.error("Failed to fetch coins", e);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!currentProblem || userAnswer === '') return;

        const correct = parseFloat(userAnswer) === currentProblem.answer;
        setIsCorrect(correct);
        setTotalAttempts(prev => prev + 1);

        if (correct) {
            setTotalCorrect(prev => prev + 1);
            setStreak(prev => prev + 1);
            setShowCelebration(true);
            playSuccessSound();

            // Award coins
            const reward = 10 + Math.min(streak * 2, 10); // Base 10 + streak bonus (max 20)
            await fetch('/api/admin/update-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coins: reward })
            });
            setCoins(prev => prev + reward);

            // Hide celebration after delay
            setTimeout(() => {
                setShowCelebration(false);
            }, 2000);
        } else {
            setStreak(0);
            playWrongSound();
        }
    };

    const handleNextQuestion = () => {
        setCurrentProblem(generateMathProblem());
        setUserAnswer('');
        setIsCorrect(null);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (isCorrect === null) {
                handleSubmitAnswer();
            } else {
                handleNextQuestion();
            }
        }
    };

    // 拼音选择处理
    const handlePinyinSelect = async (option: string) => {
        if (pinyinResult !== null || !currentPinyin) return;

        setSelectedPinyinOption(option);
        const correct = option === currentPinyin.correctPinyin;
        setPinyinResult(correct);
        setChineseTotalAttempts(prev => prev + 1);

        if (correct) {
            setChineseTotalCorrect(prev => prev + 1);
            setChineseStreak(prev => prev + 1);
            setShowCelebration(true);
            playSuccessSound();

            // Award coins
            const reward = 8 + Math.min(chineseStreak * 2, 8);
            await fetch('/api/admin/update-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coins: reward })
            });
            setCoins(prev => prev + reward);

            setTimeout(() => {
                setShowCelebration(false);
            }, 2000);
        } else {
            setChineseStreak(0);
            playWrongSound();
        }
    };

    const handleNextPinyin = () => {
        setCurrentPinyin(generatePinyinProblem());
        setSelectedPinyinOption(null);
        setPinyinResult(null);
    };

    // 仿写句子选择处理
    const handleSentenceSelect = async (option: string) => {
        if (sentenceResult !== null || !currentSentence) return;

        setSelectedSentenceOption(option);
        const correct = option === currentSentence.correctAnswer;
        setSentenceResult(correct);
        setChineseTotalAttempts(prev => prev + 1);

        if (correct) {
            setChineseTotalCorrect(prev => prev + 1);
            setChineseStreak(prev => prev + 1);
            setShowCelebration(true);
            playSuccessSound();

            const reward = 12 + Math.min(chineseStreak * 2, 12);
            await fetch('/api/admin/update-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coins: reward })
            });
            setCoins(prev => prev + reward);

            setTimeout(() => {
                setShowCelebration(false);
            }, 2000);
        } else {
            setChineseStreak(0);
            playWrongSound();
        }
    };

    const handleNextSentence = () => {
        setCurrentSentence(generateSentenceProblem());
        setSelectedSentenceOption(null);
        setSentenceResult(null);
    };

    // Encouragement messages
    const getEncouragement = () => {
        if (streak >= 5) return ['太厉害了！', '你是数学小天才！', '连续答对5题！'][Math.floor(Math.random() * 3)];
        if (streak >= 3) return ['继续加油！', '你真棒！', '越来越厉害了！'][Math.floor(Math.random() * 3)];
        return ['答对了！', '真聪明！', '太棒了！', '正确！'][Math.floor(Math.random() * 4)];
    };

    const getChineseEncouragement = () => {
        if (chineseStreak >= 5) return ['太厉害了！', '你是语文小天才！', '连续答对5题！'][Math.floor(Math.random() * 3)];
        if (chineseStreak >= 3) return ['继续加油！', '你真棒！', '越来越厉害了！'][Math.floor(Math.random() * 3)];
        return ['答对了！', '真聪明！', '太棒了！', '正确！'][Math.floor(Math.random() * 4)];
    };

    return (
        <div className="h-screen bg-sky-50 flex flex-col overflow-hidden font-sans">
            {/* Celebration Effects */}
            <AnimatePresence>
                {showCelebration && (
                    <>
                        <Confetti />
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
                        >
                            <div className="relative">
                                <StarBurst />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: 2, duration: 0.3 }}
                                    className="text-8xl"
                                >
                                    🎉
                                </motion.div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {toasts.map(t => (
                    <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
                ))}
            </AnimatePresence>

            {/* Header */}
            <header className="shrink-0 px-8 py-4 bg-white shadow-sm z-10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 bg-sky-50 rounded-full hover:bg-sky-100 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-sky-600" />
                    </Link>
                    <h1 className="text-2xl font-bold text-sky-800 flex items-center gap-2">
                        <span className="text-3xl">🎓</span> 快乐学校
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    {activeTab === 'math' && (
                        <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full">
                            <Trophy className="w-5 h-5 text-orange-600" />
                            <span className="font-bold text-orange-700">连对 {streak} 题</span>
                        </div>
                    )}
                    {activeTab === 'chinese' && (
                        <div className="flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-full">
                            <Trophy className="w-5 h-5 text-emerald-600" />
                            <span className="font-bold text-emerald-700">连对 {chineseStreak} 题</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full shadow-sm border border-yellow-200">
                        <span className="text-2xl">💰</span>
                        <span className="text-xl font-bold text-yellow-700">{coins}</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-0 p-4 md:p-8 max-w-4xl mx-auto w-full">
                {/* Tabs */}
                <div className="shrink-0 flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('math')}
                        className={`flex-1 py-3 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'math'
                            ? 'bg-white text-sky-600 shadow-md border-2 border-sky-100'
                            : 'bg-sky-200/50 text-sky-700 hover:bg-sky-200'
                            }`}
                    >
                        <Brain className="w-5 h-5" /> 数学挑战
                    </button>
                    <button
                        onClick={() => setActiveTab('chinese')}
                        className={`flex-1 py-3 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'chinese'
                            ? 'bg-white text-emerald-600 shadow-md border-2 border-emerald-100'
                            : 'bg-emerald-200/50 text-emerald-700 hover:bg-emerald-200'
                            }`}
                    >
                        <BookOpen className="w-5 h-5" /> 语文练习
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-h-0 relative">
                    <AnimatePresence mode="wait">
                        {activeTab === 'math' ? (
                            <motion.div
                                key="math"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute inset-0 bg-white rounded-3xl p-8 shadow-xl border border-sky-100 flex flex-col items-center justify-center"
                            >
                                {currentProblem && (
                                    <div className="w-full max-w-lg text-center">
                                        {/* Stats */}
                                        <div className="mb-6 flex justify-center gap-6 text-sm text-gray-500">
                                            <span>答对: {totalCorrect}</span>
                                            <span>总共: {totalAttempts}</span>
                                            {totalAttempts > 0 && (
                                                <span>正确率: {Math.round(totalCorrect / totalAttempts * 100)}%</span>
                                            )}
                                        </div>

                                        {/* Question */}
                                        <motion.div
                                            key={currentProblem.id}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="mb-8"
                                        >
                                            <p className="text-3xl md:text-4xl font-bold text-gray-800 leading-relaxed">
                                                {currentProblem.question}
                                            </p>
                                        </motion.div>

                                        {/* Answer Input */}
                                        <div className="mb-8">
                                            <input
                                                ref={inputRef}
                                                type="number"
                                                value={userAnswer}
                                                onChange={(e) => setUserAnswer(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                disabled={isCorrect !== null}
                                                className={`w-40 p-4 text-center text-4xl font-bold border-4 rounded-2xl outline-none transition-all ${
                                                    isCorrect === null
                                                        ? 'border-sky-300 focus:border-sky-500'
                                                        : isCorrect
                                                            ? 'border-green-500 bg-green-50'
                                                            : 'border-red-500 bg-red-50'
                                                }`}
                                                placeholder="?"
                                            />
                                        </div>

                                        {/* Result Message */}
                                        <AnimatePresence>
                                            {isCorrect !== null && (
                                                <motion.div
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    className={`mb-6 p-4 rounded-2xl ${
                                                        isCorrect
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {isCorrect ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Sparkles className="w-6 h-6" />
                                                            <span className="text-2xl font-bold">{getEncouragement()}</span>
                                                            <span className="text-lg">+{10 + Math.min((streak - 1) * 2, 10)} 金币</span>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="text-xl font-bold mb-1">再想想哦～</p>
                                                            <p className="text-lg">正确答案是: <span className="font-bold">{currentProblem.answer}</span></p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Action Button */}
                                        {isCorrect === null ? (
                                            <button
                                                onClick={handleSubmitAnswer}
                                                disabled={userAnswer === ''}
                                                className={`w-full py-4 rounded-2xl text-xl font-bold shadow-lg transition-all ${
                                                    userAnswer === ''
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        : 'bg-sky-500 hover:bg-sky-600 text-white active:scale-95 shadow-sky-200'
                                                }`}
                                            >
                                                提交答案
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleNextQuestion}
                                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                            >
                                                下一题 →
                                            </button>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="chinese"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden flex flex-col"
                            >
                                {/* Mode Tabs */}
                                <div className="shrink-0 flex gap-2 p-4 bg-emerald-50 border-b border-emerald-100">
                                    <button
                                        onClick={() => setChineseMode('pinyin')}
                                        className={`flex-1 py-2 rounded-xl font-bold transition-all ${chineseMode === 'pinyin'
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-white text-emerald-700 hover:bg-emerald-100'
                                            }`}
                                    >
                                        📝 拼音练习
                                    </button>
                                    <button
                                        onClick={() => setChineseMode('sentence')}
                                        className={`flex-1 py-2 rounded-xl font-bold transition-all ${chineseMode === 'sentence'
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-white text-emerald-700 hover:bg-emerald-100'
                                            }`}
                                    >
                                        ✍️ 仿写句子
                                    </button>
                                </div>

                                {/* Stats */}
                                <div className="shrink-0 py-3 flex justify-center gap-6 text-sm text-gray-500 border-b">
                                    <span>答对: {chineseTotalCorrect}</span>
                                    <span>总共: {chineseTotalAttempts}</span>
                                    {chineseTotalAttempts > 0 && (
                                        <span>正确率: {Math.round(chineseTotalCorrect / chineseTotalAttempts * 100)}%</span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col items-center justify-center p-6">
                                    {chineseMode === 'pinyin' ? (
                                        // 拼音练习
                                        currentPinyin && (
                                            <div className="w-full max-w-lg text-center">
                                                <motion.div
                                                    key={currentPinyin.id}
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="mb-8"
                                                >
                                                    <p className="text-lg text-gray-500 mb-2">请选择正确的拼音</p>
                                                    <p className="text-6xl font-bold text-gray-800 mb-4">
                                                        {currentPinyin.word}
                                                    </p>
                                                </motion.div>

                                                {/* Options */}
                                                <div className="grid grid-cols-2 gap-3 mb-6">
                                                    {currentPinyin.options.map((option, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => handlePinyinSelect(option)}
                                                            disabled={pinyinResult !== null}
                                                            className={`p-4 rounded-xl text-xl font-bold transition-all ${
                                                                pinyinResult === null
                                                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-200 hover:border-emerald-400'
                                                                    : option === currentPinyin.correctPinyin
                                                                        ? 'bg-green-500 text-white border-2 border-green-600'
                                                                        : selectedPinyinOption === option
                                                                            ? 'bg-red-500 text-white border-2 border-red-600'
                                                                            : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                                                            }`}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Result */}
                                                <AnimatePresence>
                                                    {pinyinResult !== null && (
                                                        <motion.div
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0, opacity: 0 }}
                                                            className={`mb-6 p-4 rounded-2xl ${
                                                                pinyinResult
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}
                                                        >
                                                            {pinyinResult ? (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Sparkles className="w-6 h-6" />
                                                                    <span className="text-2xl font-bold">{getChineseEncouragement()}</span>
                                                                    <span className="text-lg">+{8 + Math.min((chineseStreak - 1) * 2, 8)} 金币</span>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <p className="text-xl font-bold mb-1">再想想哦～</p>
                                                                    <p className="text-lg">正确答案是: <span className="font-bold">{currentPinyin.correctPinyin}</span></p>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Next Button */}
                                                {pinyinResult !== null && (
                                                    <button
                                                        onClick={handleNextPinyin}
                                                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                                    >
                                                        下一题 →
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        // 仿写句子（选择题）
                                        currentSentence && (
                                            <div className="w-full max-w-lg">
                                                <motion.div
                                                    key={currentSentence.id}
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="mb-6"
                                                >
                                                    <p className="text-lg text-gray-500 mb-3">选择正确的仿写句子</p>
                                                    <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-200 mb-4">
                                                        <p className="text-sm text-amber-600 mb-1">句式：<span className="font-bold">{currentSentence.pattern}</span></p>
                                                        <p className="text-xl font-bold text-amber-800">例句：{currentSentence.example}</p>
                                                    </div>
                                                </motion.div>

                                                {/* Options - 2选1 */}
                                                <div className="space-y-3 mb-6">
                                                    {currentSentence.options.map((option, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => handleSentenceSelect(option)}
                                                            disabled={sentenceResult !== null}
                                                            className={`w-full p-4 rounded-xl text-lg font-bold transition-all text-left ${
                                                                sentenceResult === null
                                                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-200 hover:border-emerald-400'
                                                                    : option === currentSentence.correctAnswer
                                                                        ? 'bg-green-500 text-white border-2 border-green-600'
                                                                        : selectedSentenceOption === option
                                                                            ? 'bg-red-500 text-white border-2 border-red-600'
                                                                            : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                                                            }`}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Result */}
                                                <AnimatePresence>
                                                    {sentenceResult !== null && (
                                                        <motion.div
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0, opacity: 0 }}
                                                            className={`mb-6 p-4 rounded-2xl ${
                                                                sentenceResult
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}
                                                        >
                                                            {sentenceResult ? (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Sparkles className="w-6 h-6" />
                                                                    <span className="text-2xl font-bold">{getChineseEncouragement()}</span>
                                                                    <span className="text-lg">+{12 + Math.min((chineseStreak - 1) * 2, 12)} 金币</span>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <p className="text-xl font-bold mb-1">再想想哦～</p>
                                                                    <p className="text-lg">正确答案是: <span className="font-bold">{currentSentence.correctAnswer}</span></p>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Next Button */}
                                                {sentenceResult !== null && (
                                                    <button
                                                        onClick={handleNextSentence}
                                                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                                    >
                                                        下一题 →
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
