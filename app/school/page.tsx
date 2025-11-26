'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Brain, CheckCircle, ChevronRight, Clock, Star, Trophy } from 'lucide-react';
import Link from 'next/link';
import Toast, { useToast } from "../components/Toast";
import { BOOKS, generateMathProblems, MathProblem, Book, Chapter } from './data';

export default function SchoolHub() {
    const [activeTab, setActiveTab] = useState<'math' | 'reading'>('math');
    const [coins, setCoins] = useState(0);
    const { toasts, showToast, removeToast } = useToast();

    // Math State
    const [problems, setProblems] = useState<MathProblem[]>([]);
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [mathScore, setMathScore] = useState<{ correct: number, total: number } | null>(null);

    // Reading State
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [readingTimer, setReadingTimer] = useState(0);
    const [canCheckIn, setCanCheckIn] = useState(false);
    const [readingProgress, setReadingProgress] = useState<{ [key: string]: string[] }>({}); // bookId -> [chapterIds]

    // Scroll ref for reading content
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initial data load
        setProblems(generateMathProblems());
        fetchCoins();
        fetchReadingProgress();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (selectedChapter && !canCheckIn) {
            interval = setInterval(() => {
                setReadingTimer(prev => {
                    if (prev >= 10) { // 10 seconds for demo, can be increased
                        setCanCheckIn(true);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [selectedChapter, canCheckIn]);

    const fetchCoins = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();
            if (data.coins) setCoins(data.coins);
        } catch (e) {
            console.error("Failed to fetch coins", e);
        }
    };

    const fetchReadingProgress = async () => {
        try {
            const res = await fetch('/api/school/reading/progress');
            const data = await res.json();
            // Transform array to map: bookId -> [chapterIds]
            const progressMap: { [key: string]: string[] } = {};
            if (Array.isArray(data)) {
                data.forEach((p: any) => {
                    if (!progressMap[p.book_id]) progressMap[p.book_id] = [];
                    progressMap[p.book_id].push(p.chapter_id);
                });
            }
            setReadingProgress(progressMap);
        } catch (e) {
            console.error("Failed to fetch reading progress", e);
        }
    };

    const handleMathSubmit = async () => {
        let correct = 0;
        problems.forEach(p => {
            if (parseFloat(answers[p.id]) === p.answer) correct++;
        });

        setMathScore({ correct, total: problems.length });

        if (correct > 0) {
            const reward = correct * 10;
            await fetch('/api/admin/update-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coins: reward })
            });
            setCoins(prev => prev + reward);
            showToast(`挑战完成！你答对了 ${correct} 道题，获得 ${reward} 金币！`, 'success');
        }
    };

    const handleReadingCheckIn = async () => {
        if (!selectedBook || !selectedChapter) return;

        try {
            const res = await fetch('/api/school/reading/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId: selectedBook.id,
                    chapterId: selectedChapter.id
                })
            });

            const data = await res.json();

            if (data.success) {
                setCoins(prev => prev + data.reward);
                showToast(`阅读打卡成功！获得 ${data.reward} 金币奖励！`, 'success');

                // Update local progress
                setReadingProgress(prev => ({
                    ...prev,
                    [selectedBook.id]: [...(prev[selectedBook.id] || []), selectedChapter.id]
                }));

                setSelectedChapter(null); // Return to chapter list
                setReadingTimer(0);
                setCanCheckIn(false);
            }
        } catch (e) {
            console.error("Check-in failed", e);
            showToast("打卡失败，请稍后再试", 'error');
        }
    };

    const isChapterRead = (bookId: string, chapterId: string) => {
        return readingProgress[bookId]?.includes(chapterId);
    };

    return (
        <div className="h-screen bg-sky-50 flex flex-col overflow-hidden font-sans">
            <AnimatePresence>
                {toasts.map(t => (
                    <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
                ))}
            </AnimatePresence>

            {/* Header - Fixed Height */}
            <header className="shrink-0 px-8 py-4 bg-white shadow-sm z-10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 bg-sky-50 rounded-full hover:bg-sky-100 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-sky-600" />
                    </Link>
                    <h1 className="text-2xl font-bold text-sky-800 flex items-center gap-2">
                        <span className="text-3xl">🎓</span> 快乐学校
                    </h1>
                </div>
                <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full shadow-sm border border-yellow-200">
                    <span className="text-2xl">💰</span>
                    <span className="text-xl font-bold text-yellow-700">{coins}</span>
                </div>
            </header>

            {/* Main Content - Flex Grow */}
            <main className="flex-1 flex flex-col min-h-0 p-4 md:p-8 max-w-6xl mx-auto w-full">
                {/* Tabs - Fixed Height */}
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
                        onClick={() => setActiveTab('reading')}
                        className={`flex-1 py-3 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'reading'
                            ? 'bg-white text-emerald-600 shadow-md border-2 border-emerald-100'
                            : 'bg-emerald-200/50 text-emerald-700 hover:bg-emerald-200'
                            }`}
                    >
                        <BookOpen className="w-5 h-5" /> 每日阅读
                    </button>
                </div>

                {/* Content Area - Scrollable */}
                <div className="flex-1 min-h-0 relative">
                    <AnimatePresence mode="wait">
                        {activeTab === 'math' ? (
                            <motion.div
                                key="math"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute inset-0 bg-white rounded-3xl p-6 shadow-xl border border-sky-100 overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">今日挑战题目</h2>
                                    <button
                                        onClick={() => {
                                            setProblems(generateMathProblems());
                                            setAnswers({});
                                            setMathScore(null);
                                        }}
                                        className="text-sky-600 hover:text-sky-700 font-medium"
                                    >
                                        换一批题目
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {problems.map((p, idx) => (
                                        <div key={p.id} className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                                            <div className="flex items-center gap-4">
                                                <span className="w-8 h-8 flex items-center justify-center bg-sky-200 text-sky-800 rounded-full font-bold shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-lg font-medium text-gray-700 flex-1">{p.question}</p>
                                                <input
                                                    type="number"
                                                    value={answers[p.id] || ''}
                                                    onChange={(e) => setAnswers({ ...answers, [p.id]: e.target.value })}
                                                    className="w-24 p-2 text-center text-lg border-2 border-sky-200 rounded-lg focus:border-sky-400 outline-none"
                                                    placeholder="?"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {mathScore && (
                                    <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200 text-center">
                                        <p className="text-xl font-bold text-yellow-800">
                                            得分: {mathScore.correct} / {mathScore.total}
                                        </p>
                                        {mathScore.correct === mathScore.total && (
                                            <p className="text-emerald-600 font-bold mt-2">太棒了！全对！🎉</p>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={handleMathSubmit}
                                    className="w-full mt-8 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xl font-bold shadow-lg shadow-sky-200 transition-all active:scale-95"
                                >
                                    提交答案
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="reading"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden flex flex-col"
                            >
                                {!selectedBook ? (
                                    // Book List
                                    <div className="flex-1 overflow-y-auto p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {BOOKS.map((book) => {
                                                const readCount = book.chapters.filter(c => isChapterRead(book.id, c.id)).length;
                                                const totalCount = book.chapters.length;
                                                const progress = Math.round((readCount / totalCount) * 100);

                                                return (
                                                    <div
                                                        key={book.id}
                                                        onClick={() => setSelectedBook(book)}
                                                        className="group cursor-pointer bg-emerald-50 hover:bg-emerald-100 rounded-2xl p-6 border-2 border-emerald-100 hover:border-emerald-300 transition-all"
                                                    >
                                                        <div className="flex justify-between items-start mb-4">
                                                            <h3 className="text-2xl font-bold text-gray-800 group-hover:text-emerald-800 transition-colors">
                                                                {book.title}
                                                            </h3>
                                                            <span className="text-3xl">📚</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm text-gray-600">
                                                                <span>阅读进度</span>
                                                                <span>{readCount}/{totalCount} 章</span>
                                                            </div>
                                                            <div className="h-3 bg-white rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-emerald-500 transition-all duration-500"
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : !selectedChapter ? (
                                    // Chapter List
                                    <div className="flex-1 overflow-y-auto p-6">
                                        <button
                                            onClick={() => setSelectedBook(null)}
                                            className="mb-6 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold"
                                        >
                                            <ArrowLeft className="w-5 h-5" /> 返回书架
                                        </button>
                                        <h2 className="text-3xl font-bold text-gray-800 mb-6">{selectedBook.title}</h2>
                                        <div className="space-y-4">
                                            {selectedBook.chapters.map((chapter) => {
                                                const isRead = isChapterRead(selectedBook.id, chapter.id);
                                                return (
                                                    <div
                                                        key={chapter.id}
                                                        onClick={() => setSelectedChapter(chapter)}
                                                        className={`p-4 rounded-xl border-2 flex justify-between items-center cursor-pointer transition-all ${isRead
                                                            ? 'bg-emerald-50 border-emerald-200'
                                                            : 'bg-white border-gray-100 hover:border-emerald-300 hover:shadow-md'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isRead ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                                                }`}>
                                                                {isRead ? <CheckCircle className="w-6 h-6" /> : <BookOpen className="w-5 h-5" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-lg font-bold text-gray-800">{chapter.title}</h4>
                                                                <p className="text-sm text-gray-500">奖励: {chapter.reward} 金币</p>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    // Reading View
                                    <div className="flex-1 flex flex-col h-full">
                                        {/* Reading Header */}
                                        <div className="shrink-0 flex justify-between items-center p-6 border-b bg-white z-10">
                                            <button
                                                onClick={() => {
                                                    setSelectedChapter(null);
                                                    setReadingTimer(0);
                                                    setCanCheckIn(false);
                                                }}
                                                className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
                                            >
                                                <ArrowLeft className="w-5 h-5" /> 返回目录
                                            </button>
                                            <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-full">
                                                <Clock className="w-5 h-5" />
                                                {canCheckIn ? "阅读完成" : `${10 - readingTimer}s 后可打卡`}
                                            </div>
                                        </div>

                                        {/* Reading Content - Scrollable */}
                                        <div className="flex-1 overflow-y-auto p-8 bg-yellow-50/30" ref={contentRef}>
                                            <div className="max-w-3xl mx-auto">
                                                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">{selectedChapter.title}</h2>
                                                <div className="text-xl leading-loose text-gray-700 whitespace-pre-line font-serif">
                                                    {selectedChapter.content}
                                                </div>

                                                {/* Bottom Action Area */}
                                                <div className="mt-12 pb-8">
                                                    <button
                                                        onClick={handleReadingCheckIn}
                                                        disabled={!canCheckIn}
                                                        className={`w-full py-4 rounded-xl text-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${canCheckIn
                                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95 shadow-emerald-200'
                                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        {canCheckIn ? (
                                                            <>
                                                                <CheckCircle className="w-6 h-6" /> 完成阅读 (+{selectedChapter.reward} 金币)
                                                            </>
                                                        ) : (
                                                            "请认真阅读..."
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
