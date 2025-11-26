"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BatteryCharging,
  Clock3,
  Gamepad2,
  Sparkles,
  Trophy,
  Hammer,
  Brain,
  Music2,
  Blocks,
  Waves,
  Puzzle as PuzzleIcon,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ElementType } from "react";
import { useGameStore } from "../hooks/useGameStore";
import { getUserCoins } from "../lib/db";
import Toast, { useToast } from "../components/Toast";

type GameKey = "whac" | "memory" | "rhythm" | "tetris" | "snake" | "puzzle";

const GAME_CONFIG: Record<GameKey, { title: string; subtitle: string; duration: number; color: string; icon: ElementType }> = {
  whac: { title: "打地鼠", subtitle: "反应力挑战", duration: 30, color: "from-amber-400 to-orange-500", icon: Hammer },
  memory: { title: "翻牌配对", subtitle: "记忆力挑战", duration: 60, color: "from-emerald-400 to-teal-500", icon: Brain },
  rhythm: { title: "节奏敲击", subtitle: "节奏感挑战", duration: 40, color: "from-indigo-400 to-purple-500", icon: Music2 },
  tetris: { title: "俄罗斯方块", subtitle: "下落消除", duration: 120, color: "from-blue-500 to-cyan-500", icon: Blocks },
  snake: { title: "贪吃蛇", subtitle: "躲避与吞噬", duration: 90, color: "from-lime-500 to-green-500", icon: Waves },
  puzzle: { title: "数字拼图", subtitle: "排序与思考", duration: 180, color: "from-pink-500 to-rose-500", icon: PuzzleIcon },
};

const MOLE_HOLES = Array.from({ length: 9 }, (_, i) => i);
const MEMORY_SYMBOLS = ["🍎", "🍌", "🍇", "🍓", "🍑", "🥝"];

interface StatsResponse {
  energy: number;
  maxEnergy: number;
  nextEnergySeconds: number;
  dailyUsed: number;
  dailyLimit: number;
  scores: Record<GameKey, { best_score: number; last_score: number; last_played: string | null }>;
  leaderboards: Record<GameKey, Array<{ name: string; best_score: number }>>;
}

interface MemoryCard {
  id: number;
  value: string;
  flipped: boolean;
  matched: boolean;
}

interface Pos {
  x: number;
  y: number;
}

const createBoard = () => Array.from({ length: 20 }, () => Array(10).fill(0));

const isSolved = (arr: number[]) => arr.every((v, i) => v === i + 1);

export default function GameDetail({ params }: { params: { game: GameKey } }) {
  const game = params.game;
  const cfg = GAME_CONFIG[game];
  const invalidGame = !cfg;

  const { coins, setCoins } = useGameStore();
  const { toasts, showToast, removeToast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sessionState, setSessionState] = useState<"idle" | "playing" | "finishing">("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const finishingRef = useRef(false);

  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [beatTime, setBeatTime] = useState(0);
  const [beatPulse, setBeatPulse] = useState(false);
  const [combo, setCombo] = useState(0);

  const [snake, setSnake] = useState<Pos[]>([]);
  const [direction, setDirection] = useState<Pos>({ x: 1, y: 0 });
  const [food, setFood] = useState<Pos>({ x: 5, y: 5 });

  const [tiles, setTiles] = useState<number[]>([]);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);

  const [board, setBoard] = useState<number[][]>(createBoard());
  const [piece, setPiece] = useState<{ x: number; y: number }>({ x: 4, y: 0 });

  const loopRef = useRef<NodeJS.Timeout | null>(null);

  const gameDuration = cfg?.duration ?? 0;

  const [stats, setStats] = useState<StatsResponse>({
    energy: 5,
    maxEnergy: 5,
    nextEnergySeconds: 0,
    dailyUsed: 0,
    dailyLimit: 1800,
    scores: {
      whac: { best_score: 0, last_score: 0, last_played: null },
      memory: { best_score: 0, last_score: 0, last_played: null },
      rhythm: { best_score: 0, last_score: 0, last_played: null },
      tetris: { best_score: 0, last_score: 0, last_played: null },
      snake: { best_score: 0, last_score: 0, last_played: null },
      puzzle: { best_score: 0, last_score: 0, last_played: null },
    },
    leaderboards: {
      whac: [],
      memory: [],
      rhythm: [],
      tetris: [],
      snake: [],
      puzzle: [],
    },
  });

  // 键盘
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (game === "rhythm" && e.code === "Space") handleRhythmHit();
      if (game === "whac" && e.code === "Space") setActiveHole(null);
      if (game === "tetris") {
        if (e.code === "ArrowLeft") moveTetris(-1);
        if (e.code === "ArrowRight") moveTetris(1);
        if (e.code === "ArrowDown") stepTetris();
      }
      if (game === "snake") {
        if (e.code === "ArrowUp") setDirection((d) => (d.y === 1 ? d : { x: 0, y: -1 }));
        if (e.code === "ArrowDown") setDirection((d) => (d.y === -1 ? d : { x: 0, y: 1 }));
        if (e.code === "ArrowLeft") setDirection((d) => (d.x === 1 ? d : { x: -1, y: 0 }));
        if (e.code === "ArrowRight") setDirection((d) => (d.x === -1 ? d : { x: 1, y: 0 }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, direction]);

  // 打地鼠
  useEffect(() => {
    if (sessionState === "playing" && game === "whac") {
      const timer = setInterval(() => setActiveHole(Math.floor(Math.random() * MOLE_HOLES.length)), 750);
      return () => clearInterval(timer);
    }
    setActiveHole(null);
  }, [sessionState, game]);

  // 节奏
  useEffect(() => {
    if (sessionState === "playing" && game === "rhythm") {
      const start = performance.now();
      setBeatTime(start);
      const timer = setInterval(() => {
        setBeatTime(performance.now());
        setBeatPulse((p) => !p);
      }, 750);
      return () => clearInterval(timer);
    }
  }, [sessionState, game]);

  // 俄罗斯方块
  useEffect(() => {
    if (sessionState === "playing" && game === "tetris") {
      loopRef.current = setInterval(stepTetris, 550);
      return () => loopRef.current && clearInterval(loopRef.current);
    }
    if (loopRef.current) clearInterval(loopRef.current);
  }, [sessionState, game, piece, board]);

  // 贪吃蛇
  useEffect(() => {
    if (sessionState === "playing" && game === "snake") {
      loopRef.current = setInterval(stepSnake, 200);
      return () => loopRef.current && clearInterval(loopRef.current);
    }
    if (loopRef.current) clearInterval(loopRef.current);
  }, [sessionState, game, direction, snake, food]);

  // 初始加载
  useEffect(() => {
    setMounted(true);
    getUserCoins().then(setCoins);
    loadStats();
    resetMemory();
    resetSnake();
    resetPuzzle();
    resetTetris();
  }, []);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/game/stats");
      const data: StatsResponse = await res.json();
      setStats(data);
    } catch (error) {
      console.error(error);
      showToast("获取游戏状态失败", "error");
    } finally {
      setLoadingStats(false);
    }
  };

  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const resetMemory = () => {
    const deck = shuffle([...MEMORY_SYMBOLS.slice(0, 6), ...MEMORY_SYMBOLS.slice(0, 6)]).map((v, i) => ({
      id: i,
      value: v,
      flipped: false,
      matched: false,
    }));
    setMemoryCards(deck);
    setFlippedIds([]);
  };

  const resetSnake = () => {
    const start = [{ x: 4, y: 4 }, { x: 3, y: 4 }, { x: 2, y: 4 }];
    setSnake(start);
    setDirection({ x: 1, y: 0 });
    setFood({ x: 8, y: 8 });
  };

  const resetPuzzle = () => {
    let arr = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    while (isSolved(arr)) arr = shuffle(arr);
    setTiles(arr);
    setSelectedTile(null);
    setMoves(0);
  };

  const resetTetris = () => {
    setBoard(createBoard());
    setPiece({ x: 4, y: 0 });
  };

  const startGame = () => {
    if (sessionState === "playing") {
      showToast("当前有一局正在进行", "warning");
      return;
    }
    if (stats.energy <= 0) {
      showToast("体力不足，等一等再玩吧", "warning");
      return;
    }
    finishingRef.current = false;
    setScore(0);
    setCombo(0);
    if (game === "memory") resetMemory();
    if (game === "snake") resetSnake();
    if (game === "puzzle") resetPuzzle();
    if (game === "tetris") resetTetris();
    setSessionState("playing");
  };

  const finishGame = async (forceScore?: number) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setSessionState("finishing");
    const durationSec = Math.max(1, gameDuration - timeLeft);
    const finalScore = forceScore ?? scoreRef.current;

    try {
      const res = await fetch("/api/game/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, score: finalScore, durationSec }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "提交成绩失败", "error");
        return;
      }
      setCoins(data.coins ?? coins);
      setStats((prev) => ({
        ...prev,
        energy: data.energy ?? prev.energy,
        maxEnergy: data.maxEnergy ?? prev.maxEnergy,
        dailyUsed: data.dailyUsed ?? prev.dailyUsed,
        dailyLimit: data.dailyLimit ?? prev.dailyLimit,
        scores: {
          ...prev.scores,
          [game]: {
            best_score: data.bestScore ?? prev.scores[game].best_score,
            last_score: data.score ?? finalScore,
            last_played: new Date().toISOString(),
          },
        },
        leaderboards: {
          ...prev.leaderboards,
          [game]: data.leaderboard ?? prev.leaderboards[game],
        },
      }));
      showToast(`本局奖励 +${data.rewardCoins} 金币`, "success");
      await loadStats();
    } catch (error) {
      console.error(error);
      showToast("提交成绩失败", "error");
    } finally {
      setSessionState("idle");
      finishingRef.current = false;
    }
  };

  const handleWhacHit = (index: number) => {
    if (sessionState !== "playing" || game !== "whac") return;
    if (index === activeHole) {
      setScore((s) => s + 8);
      setActiveHole(null);
    } else {
      setScore((s) => Math.max(0, s - 3));
    }
  };

  const handleMemoryFlip = (card: MemoryCard) => {
    if (sessionState !== "playing" || game !== "memory") return;
    if (card.matched || card.flipped) return;
    if (flippedIds.length === 2) return;

    const newCards = memoryCards.map((c) => (c.id === card.id ? { ...c, flipped: true } : c));
    const newFlipped = [...flippedIds, card.id];
    setMemoryCards(newCards);
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      const [aId, bId] = newFlipped;
      const cardA = newCards.find((c) => c.id === aId)!;
      const cardB = newCards.find((c) => c.id === bId)!;
      if (cardA.value === cardB.value) {
        setTimeout(() => {
          setMemoryCards((prev) =>
            prev.map((c) => (c.id === aId || c.id === bId ? { ...c, matched: true, flipped: true } : c)),
          );
          setScore((s) => s + 12);
          setFlippedIds([]);
          if (newCards.filter((c) => ![aId, bId].includes(c.id)).every((c) => c.matched)) finishGame();
        }, 200);
      } else {
        setTimeout(() => {
          setMemoryCards((prev) =>
            prev.map((c) => (c.id === aId || c.id === bId ? { ...c, flipped: false } : c)),
          );
          setScore((s) => Math.max(0, s - 4));
          setFlippedIds([]);
        }, 500);
      }
    }
  };

  const handleRhythmHit = () => {
    if (sessionState !== "playing" || game !== "rhythm") return;
    const diff = Math.abs(performance.now() - beatTime);
    if (diff <= 180) {
      setCombo((c) => c + 1);
      setScore((s) => s + 6 + combo * 2);
    } else {
      setCombo(0);
      setScore((s) => Math.max(0, s - 3));
    }
  };

  // 简化俄罗斯方块：2x2 块下落
  const moveTetris = (dir: number) => {
    if (game !== "tetris" || sessionState !== "playing") return;
    if (canPlace(piece, dir, 0)) setPiece({ ...piece, x: piece.x + dir });
  };

  const canPlace = (p: Pos, dx: number, dy: number) => {
    const blocks = [
      [0, 0], [1, 0], [0, 1], [1, 1],
    ];
    for (const [bx, by] of blocks) {
      const x = p.x + bx + dx;
      const y = p.y + by + dy;
      if (x < 0 || x >= 10 || y >= 20) return false;
      if (y >= 0 && board[y][x]) return false;
    }
    return true;
  };

  const stepTetris = () => {
    if (game !== "tetris" || sessionState !== "playing") return;
    if (canPlace(piece, 0, 1)) {
      setPiece({ ...piece, y: piece.y + 1 });
    } else {
      const nextBoard = board.map((r) => [...r]);
      const blocks = [
        [0, 0], [1, 0], [0, 1], [1, 1],
      ];
      for (const [bx, by] of blocks) {
        const x = piece.x + bx;
        const y = piece.y + by;
        if (y < 0) {
          finishGame(scoreRef.current);
          return;
        }
        nextBoard[y][x] = 1;
      }
      const remaining = nextBoard.filter((r) => r.some((c) => c === 0));
      const cleared = 20 - remaining.length;
      while (remaining.length < 20) remaining.unshift(Array(10).fill(0));
      if (cleared > 0) setScore((s) => s + cleared * 50);
      setBoard(remaining);
      setPiece({ x: 4, y: 0 });
    }
  };

  // 贪吃蛇
  const stepSnake = () => {
    if (game !== "snake" || sessionState !== "playing") return;
    const head = snake[0];
    const next = { x: head.x + direction.x, y: head.y + direction.y };
    const hitWall = next.x < 0 || next.x >= 15 || next.y < 0 || next.y >= 15;
    const hitBody = snake.some((s) => s.x === next.x && s.y === next.y);
    if (hitWall || hitBody) {
      finishGame(scoreRef.current);
      return;
    }
    const newSnake = [next, ...snake];
    if (next.x === food.x && next.y === food.y) {
      setScore((s) => s + 5);
      setFood(randomFood(newSnake));
    } else {
      newSnake.pop();
    }
    setSnake(newSnake);
  };

  const randomFood = (occupied: Pos[]) => {
    let pos = { x: Math.floor(Math.random() * 15), y: Math.floor(Math.random() * 15) };
    while (occupied.some((s) => s.x === pos.x && s.y === pos.y)) {
      pos = { x: Math.floor(Math.random() * 15), y: Math.floor(Math.random() * 15) };
    }
    return pos;
  };

  // 拼图
  const handlePuzzleClick = (tile: number) => {
    if (sessionState !== "playing" || game !== "puzzle") return;
    if (selectedTile === null) {
      setSelectedTile(tile);
      return;
    }
    if (selectedTile === tile) {
      setSelectedTile(null);
      return;
    }
    const newTiles = tiles.map((t) => {
      if (t === tile) return selectedTile;
      if (t === selectedTile) return tile;
      return t;
    });
    setTiles(newTiles);
    setMoves((m) => m + 1);
    setSelectedTile(null);
    if (isSolved(newTiles)) {
      const finalScore = Math.max(50, 200 - moves * 2);
      setScore(finalScore);
      finishGame(finalScore);
    }
  };
  // 倒计时
  useEffect(() => {
    if (sessionState === "playing") {
      setTimeLeft(gameDuration);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [sessionState, gameDuration]);
