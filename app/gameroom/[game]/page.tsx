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
  ScrollText,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ElementType } from "react";
import { useGameStore } from "../../hooks/useGameStore";
import { getUserCoins } from "../../lib/db";
import Toast, { useToast } from "../../components/Toast";

export type GameKey = "whac" | "memory" | "tetris" | "snake" | "puzzle";

const GAME_CONFIG: Record<GameKey, { title: string; subtitle: string; duration: number; timerMode: "countdown" | "none"; color: string; icon: ElementType }> = {
  whac: { title: "打地鼠", subtitle: "反应力挑战", duration: 30, timerMode: "countdown", color: "from-amber-400 to-orange-500", icon: Hammer },
  memory: { title: "翻牌配对", subtitle: "记忆力挑战", duration: 0, timerMode: "none", color: "from-emerald-400 to-teal-500", icon: Brain },
  tetris: { title: "俄罗斯方块", subtitle: "下落消除", duration: 0, timerMode: "none", color: "from-blue-500 to-cyan-500", icon: Blocks },
  snake: { title: "贪吃蛇", subtitle: "躲避与吞噬", duration: 0, timerMode: "none", color: "from-lime-500 to-green-500", icon: Waves },
  puzzle: { title: "叶罗丽拼图", subtitle: "拼出美丽的仙子", duration: 0, timerMode: "none", color: "from-pink-500 to-rose-500", icon: Sparkles },
};




const MOLE_HOLES = Array.from({ length: 9 }, (_, i) => i);
const MEMORY_SYMBOLS = ["🍎", "🍌", "🍇", "🍓", "🍑", "🥝"];

const createBoard = () => Array.from({ length: 20 }, () => Array(10).fill(0));

const TETRIS_SHAPES = [
  [[0, 0], [1, 0], [0, 1], [1, 1]], // O
  [[0, 0], [1, 0], [2, 0], [3, 0]], // I
  [[0, 0], [1, 0], [2, 0], [2, 1]], // L
  [[0, 0], [1, 0], [2, 0], [0, 1]], // J
  [[1, 0], [2, 0], [0, 1], [1, 1]], // S
  [[0, 0], [1, 0], [1, 1], [2, 1]], // Z
  [[1, 0], [0, 1], [1, 1], [2, 1]], // T
];


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
  const [difficulty, setDifficulty] = useState<"easy" | "hard">("easy");

  // UI State
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoTab, setInfoTab] = useState<"rank" | "rules">("rank");

  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  // Rhythm state removed

  const [snake, setSnake] = useState<Pos[]>([]);

  const [direction, setDirection] = useState<Pos>({ x: 1, y: 0 });
  const [food, setFood] = useState<Pos>({ x: 5, y: 5 });

  const [tiles, setTiles] = useState<number[]>([]);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);

  const [board, setBoard] = useState<number[][]>(createBoard());
  const [piece, setPiece] = useState<Pos>({ x: 4, y: 0 });
  const [activeShape, setActiveShape] = useState<number[][]>(TETRIS_SHAPES[0]);


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
      tetris: { best_score: 0, last_score: 0, last_played: null },
      snake: { best_score: 0, last_score: 0, last_played: null },
      puzzle: { best_score: 0, last_score: 0, last_played: null },
    },
    leaderboards: {
      whac: [],
      memory: [],
      tetris: [],
      snake: [],
      puzzle: [],
    },
  });

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

  // Timer logic
  useEffect(() => {
    const config = GAME_CONFIG[game];
    if (sessionState === "playing" && !finishingRef.current && config.timerMode === "countdown") {
      const timer = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timer);
            finishGame();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [sessionState, game]);

  useEffect(() => {
    if (sessionState === "playing" && game === "whac") {
      const speed = difficulty === "easy" ? 1200 : 600;
      const timer = setInterval(() => setActiveHole(Math.floor(Math.random() * MOLE_HOLES.length)), speed);
      return () => clearInterval(timer);
    }
    setActiveHole(null);
  }, [sessionState, game, difficulty]);

  useEffect(() => {
    if (sessionState === "playing" && game === "tetris") {
      const speed = difficulty === "easy" ? 800 : 400;
      loopRef.current = setInterval(stepTetris, speed);
      return () => {
        if (loopRef.current) clearInterval(loopRef.current);
      };
    }
    if (loopRef.current) clearInterval(loopRef.current);
  }, [sessionState, game, piece, board, difficulty]);

  useEffect(() => {
    if (sessionState === "playing" && game === "snake") {
      const speed = difficulty === "easy" ? 350 : 150;
      loopRef.current = setInterval(stepSnake, speed);
      return () => {
        if (loopRef.current) clearInterval(loopRef.current);
      };
    }
    if (loopRef.current) clearInterval(loopRef.current);
  }, [sessionState, game, direction, snake, food, difficulty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (game === "whac" && e.code === "Space") setActiveHole(null);
      if (game === "tetris") {
        if (e.code === "ArrowLeft") moveTetris(-1);
        if (e.code === "ArrowRight") moveTetris(1);
        if (e.code === "ArrowDown") moveTetris(0);
        if (e.code === "ArrowUp") rotateTetris();
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

  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const resetMemory = () => {
    const pairCount = difficulty === "easy" ? 6 : 10;
    const symbols = MEMORY_SYMBOLS.slice(0, pairCount);
    const deck = shuffle([...symbols, ...symbols]).map((v, i) => ({
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
    const size = difficulty === "easy" ? 3 : 4;
    const totalTiles = size * size;
    // Start with solved state
    let arr = Array.from({ length: totalTiles }, (_, i) => i + 1);

    // Perform random valid moves to shuffle
    let emptyIdx = totalTiles - 1; // Last one is empty
    let lastMove = -1;

    for (let i = 0; i < (difficulty === "easy" ? 30 : 60); i++) {
      const neighbors = [];
      const row = Math.floor(emptyIdx / size);
      const col = emptyIdx % size;

      if (row > 0) neighbors.push(emptyIdx - size);
      if (row < size - 1) neighbors.push(emptyIdx + size);
      if (col > 0) neighbors.push(emptyIdx - 1);
      if (col < size - 1) neighbors.push(emptyIdx + 1);

      // Filter out the reverse of the last move to prevent immediate backtracking
      const validNeighbors = neighbors.filter(n => n !== lastMove);
      const next = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];

      // Swap
      [arr[emptyIdx], arr[next]] = [arr[next], arr[emptyIdx]];
      lastMove = emptyIdx;
      emptyIdx = next;
    }

    setTiles(arr);
    setSelectedTile(null);
    setMoves(0);
  };



  const resetTetris = () => {
    setBoard(createBoard());
    setPiece({ x: 3, y: 0 });
    setActiveShape(TETRIS_SHAPES[Math.floor(Math.random() * TETRIS_SHAPES.length)]);
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
    if (game === "memory") resetMemory();
    if (game === "tetris") resetTetris();

    if (game === "snake") resetSnake();
    if (game === "puzzle") resetPuzzle();

    const config = GAME_CONFIG[game];
    if (config.timerMode === "countdown") {
      setTimeLeft(config.duration);
    } else {
      setTimeLeft(0); // No timer for other games
    }

    // Deduct energy
    fetch("/api/game/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "play" }),
    }).catch(() => { });

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
      setInfoTab("rank");
      setShowInfoModal(true);
    } catch (error) {
      console.error(error);
      showToast("提交成绩失败", "error");
    } finally {
      setSessionState("idle");
      finishingRef.current = false;
    }
  };

  const handleWhacHit = (idx: number) => {
    if (sessionState !== "playing" || game !== "whac") return;
    if (idx === activeHole) {
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


  const canPlace = (p: Pos, dx: number, dy: number, shape: number[][] = activeShape) => {
    for (const [bx, by] of shape) {
      const x = p.x + bx + dx;
      const y = p.y + by + dy;
      if (x < 0 || x >= 10 || y >= 20) return false;
      if (y >= 0 && board[y][x]) return false;
    }
    return true;
  };

  const moveTetris = (dir: number) => {
    if (game !== "tetris" || sessionState !== "playing") return;
    if (dir === 0) {
      // Acceleration (Down)
      stepTetris();
      return;
    }
    if (canPlace(piece, dir, 0)) setPiece({ ...piece, x: piece.x + dir });
  };

  const rotateTetris = () => {
    if (game !== "tetris" || sessionState !== "playing") return;
    // Simple rotation: (x, y) -> (-y, x)
    // Find center roughly
    const newShape = activeShape.map(([x, y]) => [-y, x]);
    // Normalize to keep near top-left of local box to prevent wild jumps
    const minX = Math.min(...newShape.map(([x]) => x));
    const minY = Math.min(...newShape.map(([, y]) => y));
    const normalizedShape = newShape.map(([x, y]) => [x - minX, y - minY]);

    if (canPlace(piece, 0, 0, normalizedShape)) {
      setActiveShape(normalizedShape);
    }
  };

  const stepTetris = () => {
    if (game !== "tetris" || sessionState !== "playing") return;
    if (canPlace(piece, 0, 1)) {
      setPiece({ ...piece, y: piece.y + 1 });
    } else {
      const nextBoard = board.map((r) => [...r]);
      for (const [bx, by] of activeShape) {
        const x = piece.x + bx;
        const y = piece.y + by;
        if (y < 0) {
          finishGame(scoreRef.current);
          return;
        }
        if (y < 20 && x >= 0 && x < 10) nextBoard[y][x] = 1;
      }
      const remaining = nextBoard.filter((r) => r.some((c) => c === 0));
      const cleared = 20 - remaining.length;
      while (remaining.length < 20) remaining.unshift(Array(10).fill(0));
      if (cleared > 0) setScore((s) => s + cleared * 50);
      setBoard(remaining);
      setPiece({ x: 3, y: 0 });
      setActiveShape(TETRIS_SHAPES[Math.floor(Math.random() * TETRIS_SHAPES.length)]);
    }
  };


  const stepSnake = () => {
    if (game !== "snake" || sessionState !== "playing") return;
    const head = snake[0];
    const next = { x: head.x + direction.x, y: head.y + direction.y };
    const boardSize = difficulty === "easy" ? 15 : 20;
    const hitWall = next.x < 0 || next.x >= boardSize || next.y < 0 || next.y >= boardSize;
    const hitBody = snake.some((s) => s.x === next.x && s.y === next.y);
    if (hitWall || hitBody) {
      finishGame(scoreRef.current);
      return;
    }
    const newSnake = [next, ...snake];
    if (next.x === food.x && next.y === food.y) {
      setScore((s) => s + 5);
      setFood(randomFood(newSnake, boardSize));
    } else {
      newSnake.pop();
    }
    setSnake(newSnake);
  };

  const randomFood = (occupied: Pos[], boardSize: number) => {
    let pos = { x: Math.floor(Math.random() * boardSize), y: Math.floor(Math.random() * boardSize) };
    while (occupied.some((s) => s.x === pos.x && s.y === pos.y)) {
      pos = { x: Math.floor(Math.random() * boardSize), y: Math.floor(Math.random() * boardSize) };
    }
    return pos;
  };

  const isSolved = (arr: number[]) => arr.every((v, i) => v === i + 1);

  const handlePuzzleClick = (tile: number) => {
    if (sessionState !== "playing" || game !== "puzzle") return;
    const size = difficulty === "easy" ? 3 : 4;
    const totalTiles = size * size;

    const emptyIdx = tiles.findIndex(t => t === totalTiles);
    const clickedIdx = tiles.findIndex(t => t === tile);

    if (clickedIdx === -1 || emptyIdx === -1) return;

    const emptyRow = Math.floor(emptyIdx / size);
    const emptyCol = emptyIdx % size;
    const clickedRow = Math.floor(clickedIdx / size);
    const clickedCol = clickedIdx % size;

    const isAdjacent = (
      (Math.abs(emptyRow - clickedRow) === 1 && emptyCol === clickedCol) ||
      (Math.abs(emptyCol - clickedCol) === 1 && emptyRow === clickedRow)
    );

    if (!isAdjacent) return;

    const newTiles = [...tiles];
    [newTiles[emptyIdx], newTiles[clickedIdx]] = [newTiles[clickedIdx], newTiles[emptyIdx]];

    setTiles(newTiles);
    setMoves((m) => m + 1);

    if (isSolved(newTiles)) {
      const finalScore = Math.max(50, 200 - moves * 2);
      setScore(finalScore);
      finishGame(finalScore);
    }
  };

  const progressDaily = useMemo(() => {
    if (!stats.dailyLimit) return 0;
    return Math.min(1, stats.dailyUsed / stats.dailyLimit);
  }, [stats.dailyLimit, stats.dailyUsed]);

  const energyBars = useMemo(() => Array.from({ length: stats.maxEnergy }, (_, i) => i < stats.energy), [stats.energy, stats.maxEnergy]);

  if (invalidGame) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-purple-100 via-rose-50 to-orange-50">
        <p className="text-3xl font-black text-purple-700">未找到该小游戏</p>
        <Link href="/gameroom" className="px-6 py-3 rounded-2xl bg-purple-500 text-white font-black shadow-lg">
          回到游戏室
        </Link>
      </div>
    );
  }

  if (!mounted || loadingStats) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-100 via-rose-50 to-orange-50">
        <motion.div animate={{ scale: [0.9, 1.1, 0.9] }} transition={{ repeat: Infinity, duration: 1.2 }}>
          <Gamepad2 className="w-24 h-24 text-purple-600" />
        </motion.div>
        <p className="mt-6 text-3xl font-black text-purple-700">游戏加载中...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-purple-100 via-rose-50 to-orange-50 overflow-hidden flex flex-col">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>

      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-pink-300 to-orange-200 blur-3xl top-10 left-10" />
        <div className="absolute w-80 h-80 rounded-full bg-gradient-to-br from-indigo-200 to-cyan-200 blur-3xl bottom-10 right-10" />
      </div>

      {/* 顶部 HUD - 极简版 */}
      <div className="relative z-20 px-4 sm:px-6 pt-4 shrink-0 flex items-center justify-between">
        <Link href="/gameroom">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="glass rounded-full p-2 sm:p-3 shadow-lg border-2 border-white/70 bg-white/40 backdrop-blur-md">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </motion.button>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="glass rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-lg border-2 border-white/70 flex items-center gap-2 bg-white/40 backdrop-blur-md">
            <BatteryCharging className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            <span className="font-black text-sm sm:text-base text-gray-800">{stats.energy}/{stats.maxEnergy}</span>
          </div>
          <div className="glass rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-lg border-2 border-white/70 flex items-center gap-2 bg-white/40 backdrop-blur-md">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            <span className="font-black text-sm sm:text-base text-gray-800">{coins}</span>
          </div>
        </div>
      </div>

      {/* 游戏主区域 - 单列居中 */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 flex-1 flex flex-col min-h-0">

        {/* 游戏标题与状态 */}
        <div className="text-center my-2 sm:my-4 shrink-0">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl sm:text-5xl font-black text-purple-700 drop-shadow-lg font-[var(--font-fredoka)] tracking-wide"
          >
            {cfg?.title}
          </motion.h1>
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-2 sm:mt-3">
            {GAME_CONFIG[game].timerMode === "countdown" && (
              <div className="glass px-3 py-1 sm:px-4 sm:py-2 rounded-xl border-2 border-white/50">
                <span className="text-xs sm:text-sm text-gray-500 mr-2">倒计时</span>
                <span className={`text-xl sm:text-2xl font-black ${timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-purple-700"}`}>
                  {timeLeft}s
                </span>
              </div>
            )}
            <div className="glass px-3 py-1 sm:px-4 sm:py-2 rounded-xl border-2 border-white/50">
              <span className="text-xs sm:text-sm text-gray-500 mr-2">得分</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600">{score}</span>
            </div>
          </div>
        </div>

        {/* 游戏容器 - 自适应填充剩余空间 */}
        <div className="flex-1 min-h-0 flex flex-col justify-center pb-4 sm:pb-6">
          <motion.div
            key={game}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full max-h-full bg-white/30 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-6 shadow-2xl border-4 border-white/60 relative overflow-hidden flex flex-col"
          >
            {/* 开始遮罩层 */}
            {sessionState === "idle" && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm rounded-[2rem] sm:rounded-[3rem]">
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setDifficulty("easy")}
                    className={`px-6 py-2 rounded-full font-black text-lg transition-all ${difficulty === "easy"
                      ? "bg-emerald-400 text-white shadow-lg scale-110 ring-4 ring-emerald-200"
                      : "bg-white/50 text-emerald-600 hover:bg-white"
                      }`}
                  >
                    新手模式 🐣
                  </button>
                  <button
                    onClick={() => setDifficulty("hard")}
                    className={`px-6 py-2 rounded-full font-black text-lg transition-all ${difficulty === "hard"
                      ? "bg-rose-500 text-white shadow-lg scale-110 ring-4 ring-rose-200"
                      : "bg-white/50 text-rose-600 hover:bg-white"
                      }`}
                  >
                    高手模式 🔥
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                  className="px-8 py-4 sm:px-10 sm:py-5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xl sm:text-2xl shadow-xl border-4 border-white ring-4 ring-purple-200"
                >
                  开始游戏
                </motion.button>
                <p className="mt-4 text-gray-600 font-bold bg-white/60 px-4 py-1 rounded-full text-sm sm:text-base">
                  消耗 1 点体力
                </p>
              </div>
            )}

            {/* 游戏内容区 - 允许滚动但尽量适应 */}
            <div className={`flex-1 overflow-hidden flex items-center justify-center transition-all duration-500 ${sessionState === "idle" ? "blur-sm scale-95 opacity-50" : ""}`}>
              {game === "whac" && renderWhac(activeHole, handleWhacHit)}
              {game === "memory" && renderMemory(memoryCards, handleMemoryFlip, difficulty)}
              {game === "tetris" && renderTetris(board, piece, moveTetris, activeShape, rotateTetris)}

              {game === "snake" && renderSnake(snake, food, setDirection, difficulty)}
              {game === "puzzle" && renderPuzzle(tiles, selectedTile, handlePuzzleClick, moves, difficulty)}
            </div>

          </motion.div>
        </div>
      </div>

      {/* 底部/侧边悬浮工具栏 */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex flex-col gap-2 sm:gap-3">
        <motion.button
          whileHover={{ scale: 1.1, x: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { setInfoTab("rank"); setShowInfoModal(true); }}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-xl border-2 border-purple-100 flex items-center justify-center text-amber-500 hover:text-amber-600 transition-colors"
          title="排行榜"
        >
          <Trophy className="w-6 h-6 sm:w-7 sm:h-7" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, x: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { setInfoTab("rules"); setShowInfoModal(true); }}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-xl border-2 border-purple-100 flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors"
          title="规则"
        >
          <ScrollText className="w-6 h-6 sm:w-7 sm:h-7" />
        </motion.button>
      </div>

      {/* 信息弹窗 Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfoModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border-4 border-white overflow-hidden"
            >
              {/* 弹窗头部 */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
                <div className="flex gap-4">
                  <button
                    onClick={() => setInfoTab("rank")}
                    className={`text-lg font-black transition-colors ${infoTab === "rank" ? "text-purple-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    排行榜
                  </button>
                  <button
                    onClick={() => setInfoTab("rules")}
                    className={`text-lg font-black transition-colors ${infoTab === "rules" ? "text-purple-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    规则说明
                  </button>
                </div>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
                {infoTab === "rank" ? (
                  <div className="space-y-4">
                    {/* 个人最佳 */}
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-4 text-white shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-bold opacity-90">我的最佳纪录</span>
                        <Trophy className="w-6 h-6 text-yellow-300" />
                      </div>
                      <p className="text-4xl font-black mt-1">{stats.scores[game].best_score}</p>
                    </div>

                    {/* 排行榜列表 */}
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Top Players</p>
                      {stats.leaderboards[game].length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <p>暂无记录</p>
                          <p className="text-sm">快来抢占第一名！</p>
                        </div>
                      ) : (
                        stats.leaderboards[game].map((row, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white ${idx === 0 ? "bg-yellow-400" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-orange-400" : "bg-purple-200"
                                }`}>
                                {idx + 1}
                              </div>
                              <span className="font-bold text-gray-700">{row.name || "神秘玩家"}</span>
                            </div>
                            <span className="font-black text-purple-600">{row.best_score}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-gray-600">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                      <h3 className="font-black text-blue-600 mb-2 text-lg">游戏目标</h3>
                      <p>{cfg?.subtitle}</p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-gray-800">奖励机制</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>每局消耗 1 点体力</li>
                        <li>体力每 10 分钟恢复 1 点</li>
                        <li>得分越高，金币奖励越多</li>
                        <li>每日首胜额外奖励 20 金币</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="text-gray-600 font-bold text-lg">操作指南</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {game === "whac" && <li>点击出现的地鼠，或按空格键敲击</li>}
                        {game === "memory" && <li>点击卡片翻开，寻找相同的图案</li>}
                        {game === "tetris" && <li>方向键控制移动，下键加速，上键旋转</li>}
                        {game === "snake" && <li>方向键控制蛇的移动方向，吃掉食物</li>}
                        {game === "puzzle" && <li>点击方块交换位置，按顺序排列</li>}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ControlBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/90 border-b-4 border-gray-200 shadow-lg active:border-b-0 active:translate-y-1 transition-all text-xl font-black text-gray-700 flex items-center justify-center">
      {children}
    </button>
  );
}

function renderWhac(activeHole: number | null, onHit: (idx: number) => void) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-[min(60vh,500px)] aspect-square">
      {MOLE_HOLES.map((id) => (
        <button
          key={id}
          onClick={() => onHit(id)}
          className={`rounded-[1.5rem] sm:rounded-[2rem] border-b-4 sm:border-b-8 shadow-lg text-4xl sm:text-6xl flex items-center justify-center transition-all duration-100 ${activeHole === id
            ? "bg-amber-300 border-amber-500 -translate-y-1 sm:-translate-y-2"
            : "bg-white border-gray-200 hover:bg-gray-50"
            }`}
        >
          <span className="filter drop-shadow-md">
            {activeHole === id ? "🦔" : "🕳️"}
          </span>
        </button>
      ))}
    </div>
  );
}

function renderMemory(cards: MemoryCard[], onFlip: (card: MemoryCard) => void, difficulty: "easy" | "hard") {
  const gridCols = difficulty === "easy" ? "grid-cols-4" : "grid-cols-5";
  return (
    <div className={`grid ${gridCols} gap-2 sm:gap-4 w-full max-w-[min(60vh,600px)] aspect-[4/3]`}>
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={() => onFlip(card)}
          className={`rounded-xl sm:rounded-2xl border-2 sm:border-4 shadow-md text-3xl sm:text-5xl flex items-center justify-center transition-all duration-300 transform ${card.matched
            ? "bg-emerald-200 border-emerald-400 opacity-60 scale-95"
            : card.flipped
              ? "bg-white border-purple-300 rotate-y-180"
              : "bg-gradient-to-br from-indigo-400 to-purple-500 border-white hover:brightness-110"
            }`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {card.flipped || card.matched ? (
            <span className="animate-pop">{card.value}</span>
          ) : (
            <span className="text-white/50 text-xl sm:text-2xl">?</span>
          )}
        </button>
      ))}
    </div>
  );
}

function renderRhythm(beatPulse: boolean, combo: number, onHit: () => void) {
  return null;
}


function renderTetris(board: number[][], piece: Pos, move: (dir: number) => void, activeShape: number[][], rotate: () => void) {
  const view = board.map((r) => [...r]);
  activeShape.forEach(([bx, by]) => {
    const x = piece.x + bx;
    const y = piece.y + by;
    if (y >= 0 && y < view.length && x >= 0 && x < view[0].length) view[y][x] = 2; // 2 for active piece
  });
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 h-full w-full max-w-5xl mx-auto py-4">
      {/* Game Board - High Fidelity */}
      <div className="relative h-full max-h-[75vh] aspect-[10/20] bg-gray-900 rounded-2xl border-[8px] border-gray-800 shadow-2xl p-2 ring-4 ring-gray-900/20 select-none overflow-hidden">
        {/* Screen Glare */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-lg z-10" />

        <div className="grid grid-cols-10 grid-rows-20 gap-[2px] w-full h-full bg-gray-800/50 p-[2px]">
          {view.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={`rounded-[4px] transition-all duration-75 ${cell === 1
                  ? "bg-gradient-to-br from-gray-400 to-gray-600 shadow-inner border border-white/10" // Settled blocks
                  : cell === 2
                    ? "bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.5)] border border-white/20" // Active piece
                    : "bg-gray-800/30 border border-white/5" // Empty
                  }`}
              >
                {cell !== 0 && <div className="w-full h-full bg-white/10 rounded-[3px]" />}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Controls - Large and Tactile */}
      <div className="flex md:flex-col gap-6 items-center z-20">
        <div className="flex gap-6">
          <BigControlBtn onClick={() => move(-1)} icon={<ChevronLeft className="w-10 h-10" />} color="bg-amber-400" shadow="shadow-amber-600" />
          <BigControlBtn onClick={() => move(1)} icon={<ChevronRight className="w-10 h-10" />} color="bg-amber-400" shadow="shadow-amber-600" />
        </div>
        <div className="flex gap-6">
          <BigControlBtn onClick={() => move(0)} icon={<ChevronDown className="w-10 h-10" />} color="bg-blue-500" shadow="shadow-blue-700" label="加速" />
          <BigControlBtn onClick={rotate} icon={<ChevronUp className="w-10 h-10" />} color="bg-purple-500" shadow="shadow-purple-700" label="旋转" />
        </div>
      </div>
    </div>
  );
}

function BigControlBtn({ onClick, icon, color, shadow, label }: { onClick: () => void; icon: React.ReactNode; color: string; shadow: string; label?: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: 2 }}
      whileTap={{ scale: 0.95, y: 6 }}
      onClick={onClick}
      className={`${color} w-20 h-20 md:w-28 md:h-28 rounded-3xl ${shadow} shadow-[0_8px_0] active:shadow-none active:translate-y-[8px] border-b-0 border-white/20 flex flex-col items-center justify-center text-white transition-all`}
    >
      {icon}
      {label && <span className="text-xs md:text-sm font-black mt-1 uppercase tracking-wider">{label}</span>}
    </motion.button>
  );
}

function renderSnake(snake: Pos[], food: Pos, setDir: React.Dispatch<React.SetStateAction<Pos>>, difficulty: "easy" | "hard") {
  const boardSize = difficulty === "easy" ? 15 : 20;
  // Determine snake head direction for rotation
  const head = snake[0];
  const neck = snake[1];
  let rotation = 0;
  if (neck) {
    if (head.x > neck.x) rotation = 90;
    else if (head.x < neck.x) rotation = -90;
    else if (head.y > neck.y) rotation = 180;
    else if (head.y < neck.y) rotation = 0;
  }

  // Generate a consistent fruit based on position
  const fruits = ["🍎", "🍓", "🍊", "🍇", "🍑", "🍒"];
  const fruitIndex = (food.x + food.y) % fruits.length;
  const fruit = fruits[fruitIndex];

  // Checkerboard pattern helper
  const isDarkCell = (x: number, y: number) => (x + y) % 2 === 1;

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 h-full w-full max-w-6xl mx-auto py-2">
      {/* Game Board - Classic Checkerboard Grass */}
      <div className="relative h-[50vh] md:h-[75vh] aspect-square bg-[#aad751] rounded-xl border-[8px] border-[#8ab644] shadow-2xl p-1 ring-4 ring-black/10 select-none overflow-hidden shrink-0">

        <div
          className="grid w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
            gridTemplateRows: `repeat(${boardSize}, 1fr)`
          }}
        >
          {Array.from({ length: boardSize * boardSize }).map((_, i) => {
            const x = i % boardSize;
            const y = Math.floor(i / boardSize);
            const isHead = x === head.x && y === head.y;
            const isBody = snake.some((s, idx) => idx !== 0 && s.x === x && s.y === y);
            const isFood = x === food.x && y === food.y;
            const isDark = isDarkCell(x, y);

            return (
              <div
                key={`${x}-${y}`}
                className={`relative flex items-center justify-center ${isDark ? "bg-[#a2d149]" : "bg-[#aad751]"
                  }`}
              >
                {/* Snake Body/Head */}
                {(isHead || isBody) && (
                  <div className={`w-[90%] h-[90%] rounded-md shadow-sm transform transition-all duration-100 ${isHead
                    ? "bg-indigo-600 z-20 scale-105"
                    : "bg-indigo-500 z-10 scale-95"
                    }`}>
                    {isHead && (
                      <div className="absolute inset-0 flex items-center justify-center gap-[2px]" style={{ transform: `rotate(${rotation}deg)` }}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full relative"><div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-black rounded-full" /></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full relative"><div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-black rounded-full" /></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Food */}
                {isFood && (
                  <div className="text-2xl md:text-3xl animate-bounce filter drop-shadow-sm relative z-10">
                    {fruit}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls - D-Pad Layout */}
      <div className="flex flex-col items-center justify-center gap-4 z-20 bg-white/20 p-6 rounded-[2rem] backdrop-blur-md border border-white/30 shadow-xl shrink-0">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div />
          <BigControlBtn onClick={() => setDir((d) => (d.y === 1 ? d : { x: 0, y: -1 }))} icon={<ChevronUp className="w-8 h-8 sm:w-10 sm:h-10" />} color="bg-indigo-500" shadow="shadow-indigo-700" />
          <div />

          <BigControlBtn onClick={() => setDir((d) => (d.x === 1 ? d : { x: -1, y: 0 }))} icon={<ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10" />} color="bg-indigo-500" shadow="shadow-indigo-700" />
          <BigControlBtn onClick={() => setDir((d) => (d.y === -1 ? d : { x: 0, y: 1 }))} icon={<ChevronDown className="w-8 h-8 sm:w-10 sm:h-10" />} color="bg-indigo-500" shadow="shadow-indigo-700" />
          <BigControlBtn onClick={() => setDir((d) => (d.x === -1 ? d : { x: 1, y: 0 }))} icon={<ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />} color="bg-indigo-500" shadow="shadow-indigo-700" />
        </div>
        <p className="text-gray-700 font-bold text-sm mt-2 bg-white/50 px-3 py-1 rounded-full">方向键控制移动</p>
      </div>
    </div>
  );
}

function renderPuzzle(tiles: number[], selected: number | null, onClick: (t: number) => void, moves: number, difficulty: "easy" | "hard") {
  const size = difficulty === "easy" ? 3 : 4;
  const gridCols = difficulty === "easy" ? "grid-cols-3" : "grid-cols-4";
  const bgScale = difficulty === "easy" ? "300%" : "400%";
  const step = 100 / (size - 1);

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 h-full w-full max-w-5xl mx-auto py-4">
      {/* Puzzle Board */}
      <div className="relative h-[50vh] md:h-[60vh] aspect-square bg-pink-50 rounded-2xl border-[8px] border-pink-300 shadow-2xl p-2 ring-4 ring-pink-200 select-none">
        <div className={`grid ${gridCols} gap-1 w-full h-full bg-pink-200 p-1`}>
          {tiles.map((t, idx) => {
            // t is the value (1-total). total is empty.
            const total = size * size;
            const val = t - 1;
            const row = Math.floor(val / size);
            const col = val % size;

            // Calculate background position percentage
            // For 3x3: 0%, 50%, 100%
            // For 4x4: 0%, 33.33%, 66.66%, 100%
            const bgX = col * step;
            const bgY = row * step;

            const isEmpty = t === total;

            return (
              <button
                key={idx}
                onClick={() => onClick(t)}
                className={`relative rounded-xl overflow-hidden transition-all duration-200 ${isEmpty
                  ? "bg-pink-100/50 shadow-inner"
                  : "shadow-md hover:brightness-110 border-2 border-white/50"
                  } ${selected === t ? "ring-4 ring-yellow-400 z-10 scale-95" : ""}`}
              >
                {!isEmpty && (
                  <div
                    className="absolute inset-0 bg-cover bg-no-repeat"
                    style={{
                      backgroundImage: "url(/yeloli.png)",
                      backgroundSize: `${bgScale} ${bgScale}`,
                      backgroundPosition: `${bgX}% ${bgY}%`
                    }}
                  />
                )}
                {/* Number hint */}
                {!isEmpty && (
                  <span className="absolute bottom-1 right-2 text-white/80 text-xs font-bold drop-shadow-md">{t}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>


      {/* Sidebar / Reference */}
      <div className="flex flex-col items-center gap-6 bg-white/40 p-6 rounded-3xl backdrop-blur-sm border border-white/50">
        <div className="text-center">
          <p className="text-pink-600 font-black text-xl mb-2">目标图片</p>
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-xl overflow-hidden border-4 border-white shadow-lg relative">
            <img src="/yeloli.png" alt="Target" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 font-bold">步数</p>
          <p className="text-3xl font-black text-pink-500">{moves}</p>
        </div>

        <p className="text-sm text-gray-500 max-w-[200px] text-center">
          点击空白格旁边的方块进行移动，将图片拼回原样！
        </p>
      </div>
    </div>
  );
}
