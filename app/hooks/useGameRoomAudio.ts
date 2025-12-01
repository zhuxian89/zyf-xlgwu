import { useRef, useCallback, useEffect } from 'react';

export const useGameRoomAudio = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const bgMusicLoopRef = useRef<NodeJS.Timeout | null>(null);
    const isMutedRef = useRef(false);
    const masterVolumeRef = useRef(0.6);

    // Initialize Audio Context
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return () => {
            if (bgMusicLoopRef.current) {
                clearInterval(bgMusicLoopRef.current);
                bgMusicLoopRef.current = null;
            }
        };
    }, []);

    // Generate a simple beep/tone using Web Audio API
    const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
        if (!audioContextRef.current || isMutedRef.current) return;

        const ctx = audioContextRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(masterVolumeRef.current * volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    }, []);

    // ============ 打地鼠音效 ============
    const playWhacMoleAppear = useCallback(() => {
        playTone(800, 0.1, 'square', 0.2);
    }, [playTone]);

    const playWhacHitSuccess = useCallback(() => {
        // 击中音效 - 上升音调
        playTone(600, 0.08, 'sine');
        setTimeout(() => playTone(900, 0.12, 'sine'), 50);
    }, [playTone]);

    const playWhacMiss = useCallback(() => {
        // 未击中 - 下降音调
        playTone(400, 0.15, 'sine');
    }, [playTone]);

    // ============ 翻牌配对音效 ============
    const playCardFlip = useCallback(() => {
        playTone(500, 0.08, 'sine', 0.2);
    }, [playTone]);

    const playCardMatch = useCallback(() => {
        // 配对成功 - 欢快音阶
        playTone(523, 0.1, 'sine'); // C
        setTimeout(() => playTone(659, 0.1, 'sine'), 80); // E
        setTimeout(() => playTone(784, 0.15, 'sine'), 160); // G
    }, [playTone]);

    const playCardMismatch = useCallback(() => {
        // 配对失败 - 低沉音
        playTone(300, 0.2, 'sine');
    }, [playTone]);

    const playMemoryComplete = useCallback(() => {
        // 完成庆祝 - 连续上升音阶
        [523, 659, 784, 1047].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 0.15, 'sine'), i * 100);
        });
    }, [playTone]);

    // ============ 俄罗斯方块音效 ============
    const playTetrisMove = useCallback(() => {
        playTone(400, 0.05, 'square', 0.15);
    }, [playTone]);

    const playTetrisRotate = useCallback(() => {
        playTone(600, 0.08, 'square', 0.2);
    }, [playTone]);

    const playTetrisLand = useCallback(() => {
        playTone(300, 0.12, 'sine', 0.25);
    }, [playTone]);

    const playTetrisClear = useCallback((lines: number = 1) => {
        // 消除行 - 根据消除行数播放不同音效
        if (lines === 1) {
            playTone(700, 0.15, 'sine');
        } else if (lines === 2) {
            playTone(700, 0.1, 'sine');
            setTimeout(() => playTone(900, 0.15, 'sine'), 80);
        } else if (lines >= 3) {
            // 多行消除 - 更激烈
            [700, 900, 1100, 1300].forEach((freq, i) => {
                setTimeout(() => playTone(freq, 0.12, 'sine'), i * 60);
            });
        }
    }, [playTone]);

    // ============ 贪吃蛇音效 ============
    const playSnakeEat = useCallback(() => {
        // 吃食物 - 短促上升音
        playTone(600, 0.08, 'sine');
        setTimeout(() => playTone(800, 0.08, 'sine'), 60);
    }, [playTone]);

    const playSnakeDie = useCallback(() => {
        // 游戏结束 - 下降音阶
        playTone(500, 0.15, 'sawtooth');
        setTimeout(() => playTone(400, 0.15, 'sawtooth'), 100);
        setTimeout(() => playTone(300, 0.25, 'sawtooth'), 200);
    }, [playTone]);

    // ============ 拼图音效 ============
    const playPuzzleMove = useCallback(() => {
        playTone(500, 0.08, 'sine', 0.2);
    }, [playTone]);

    const playPuzzleComplete = useCallback(() => {
        // 拼图完成 - 梦幻音效
        [523, 659, 784, 1047, 1319].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 0.2, 'sine'), i * 120);
        });
    }, [playTone]);

    // ============ 通用游戏音效 ============
    const playGameStart = useCallback(() => {
        playTone(600, 0.1, 'sine');
        setTimeout(() => playTone(800, 0.15, 'sine'), 100);
    }, [playTone]);

    const playGameOver = useCallback(() => {
        playTone(500, 0.2, 'sine');
        setTimeout(() => playTone(400, 0.2, 'sine'), 150);
        setTimeout(() => playTone(300, 0.3, 'sine'), 300);
    }, [playTone]);

    const playScoreIncrease = useCallback(() => {
        playTone(800, 0.08, 'sine', 0.2);
    }, [playTone]);

    // ============ 背景音乐循环 ============
    const startBackgroundMusic = useCallback((gameType: 'whac' | 'memory' | 'tetris' | 'snake' | 'puzzle') => {
        if (bgMusicLoopRef.current) {
            stopBackgroundMusic();
        }

        const musicPatterns = {
            whac: () => {
                // 欢快节奏
                playTone(523, 0.2, 'sine', 0.15); // C
                setTimeout(() => playTone(659, 0.2, 'sine', 0.15), 300); // E
                setTimeout(() => playTone(784, 0.2, 'sine', 0.15), 600); // G
            },
            memory: () => {
                // 轻柔旋律
                playTone(523, 0.3, 'sine', 0.1); // C
                setTimeout(() => playTone(587, 0.3, 'sine', 0.1), 400); // D
                setTimeout(() => playTone(659, 0.3, 'sine', 0.1), 800); // E
            },
            tetris: () => {
                // 经典俄罗斯方块主题简化版
                playTone(659, 0.2, 'square', 0.12); // E
                setTimeout(() => playTone(494, 0.1, 'square', 0.12), 250); // B
                setTimeout(() => playTone(523, 0.1, 'square', 0.12), 350); // C
                setTimeout(() => playTone(587, 0.2, 'square', 0.12), 450); // D
            },
            snake: () => {
                // 动态背景
                playTone(392, 0.2, 'sine', 0.12); // G
                setTimeout(() => playTone(523, 0.2, 'sine', 0.12), 300); // C
                setTimeout(() => playTone(659, 0.2, 'sine', 0.12), 600); // E
            },
            puzzle: () => {
                // 梦幻音乐
                playTone(523, 0.3, 'sine', 0.1); // C
                setTimeout(() => playTone(659, 0.3, 'sine', 0.1), 350); // E
                setTimeout(() => playTone(784, 0.3, 'sine', 0.1), 700); // G
            }
        };

        const pattern = musicPatterns[gameType];
        const interval = gameType === 'tetris' ? 2000 : 3000;

        // 立即播放一次
        pattern();

        // 设置循环
        bgMusicLoopRef.current = setInterval(pattern, interval);
    }, [playTone]);

    const stopBackgroundMusic = useCallback(() => {
        if (bgMusicLoopRef.current) {
            clearInterval(bgMusicLoopRef.current);
            bgMusicLoopRef.current = null;
        }
    }, []);

    const setMuted = useCallback((muted: boolean) => {
        isMutedRef.current = muted;
    }, []);

    const setMasterVolume = useCallback((volume: number) => {
        masterVolumeRef.current = Math.max(0, Math.min(1, volume));
    }, []);

    return {
        // 打地鼠
        playWhacMoleAppear,
        playWhacHitSuccess,
        playWhacMiss,

        // 翻牌配对
        playCardFlip,
        playCardMatch,
        playCardMismatch,
        playMemoryComplete,

        // 俄罗斯方块
        playTetrisMove,
        playTetrisRotate,
        playTetrisLand,
        playTetrisClear,

        // 贪吃蛇
        playSnakeEat,
        playSnakeDie,

        // 拼图
        playPuzzleMove,
        playPuzzleComplete,

        // 通用
        playGameStart,
        playGameOver,
        playScoreIncrease,

        // 背景音乐
        startBackgroundMusic,
        stopBackgroundMusic,

        // 控制
        setMuted,
        setMasterVolume,
    };
};
