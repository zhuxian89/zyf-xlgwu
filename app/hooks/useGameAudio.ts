import { useRef, useCallback, useEffect } from 'react';

interface AudioOptions {
    volume?: number;
    loop?: boolean;
}

export const useGameAudio = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
    const battleLoopRef = useRef<NodeJS.Timeout | null>(null);
    const fishingMusicLoopRef = useRef<NodeJS.Timeout | null>(null);
    const farmMusicLoopRef = useRef<NodeJS.Timeout | null>(null);
    const isMutedRef = useRef(false);
    const masterVolumeRef = useRef(0.7);

    // Initialize Audio Context
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return () => {
            // Cleanup all audio elements
            audioElementsRef.current.forEach(audio => {
                audio.pause();
                audio.src = '';
            });
            audioElementsRef.current.clear();

            // Cleanup battle loop
            if (battleLoopRef.current) {
                clearInterval(battleLoopRef.current);
                battleLoopRef.current = null;
            }

            // Cleanup fishing music loop
            if (fishingMusicLoopRef.current) {
                clearInterval(fishingMusicLoopRef.current);
                fishingMusicLoopRef.current = null;
            }

            // Cleanup farm music loop
            if (farmMusicLoopRef.current) {
                clearInterval(farmMusicLoopRef.current);
                farmMusicLoopRef.current = null;
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

    // Play sound effect with custom pattern
    const playCastSound = useCallback(() => {
        // Swoosh sound - descending tone
        playTone(800, 0.15, 'sine');
        setTimeout(() => playTone(400, 0.1, 'sine'), 50);
    }, [playTone]);

    const playBiteSound = useCallback(() => {
        // Urgent alert sound
        playTone(1200, 0.1, 'square');
        setTimeout(() => playTone(1400, 0.1, 'square'), 120);
        setTimeout(() => playTone(1200, 0.1, 'square'), 240);
    }, [playTone]);

    const playFightSound = useCallback(() => {
        // Tension sound - low rumble
        playTone(100, 0.3, 'sawtooth');
    }, [playTone]);

    // Start continuous battle music loop
    const startBattleLoop = useCallback(() => {
        if (battleLoopRef.current) return; // Already running

        // Play initial sound
        playTone(120, 0.5, 'sawtooth');

        // Create loop that plays tension sound every 600ms
        battleLoopRef.current = setInterval(() => {
            playTone(120, 0.5, 'sawtooth');
            setTimeout(() => playTone(100, 0.3, 'sawtooth'), 250);
        }, 800);
    }, [playTone]);

    const stopBattleLoop = useCallback(() => {
        if (battleLoopRef.current) {
            clearInterval(battleLoopRef.current);
            battleLoopRef.current = null;
        }
    }, []);

    // Fishing background music loop - peaceful and relaxing
    const startFishingMusic = useCallback(() => {
        if (fishingMusicLoopRef.current) return; // Already running

        // Peaceful fishing melody - water theme
        const playFishingMelody = () => {
            // Relaxing water-inspired melody using pentatonic scale
            playTone(523, 0.4, 'sine', 0.15); // C
            setTimeout(() => playTone(587, 0.4, 'sine', 0.15), 500); // D
            setTimeout(() => playTone(659, 0.4, 'sine', 0.15), 1000); // E
            setTimeout(() => playTone(784, 0.4, 'sine', 0.15), 1500); // G
            setTimeout(() => playTone(659, 0.4, 'sine', 0.15), 2000); // E
            setTimeout(() => playTone(587, 0.6, 'sine', 0.15), 2500); // D
        };

        // Play initial melody
        playFishingMelody();

        // Loop every 4 seconds
        fishingMusicLoopRef.current = setInterval(playFishingMelody, 4000);
    }, [playTone]);

    const stopFishingMusic = useCallback(() => {
        if (fishingMusicLoopRef.current) {
            clearInterval(fishingMusicLoopRef.current);
            fishingMusicLoopRef.current = null;
        }
    }, []);

    // Farm background music - plays MP3 file
    const farmAudioRef = useRef<HTMLAudioElement | null>(null);

    const startFarmMusic = useCallback(() => {
        if (isMutedRef.current) return;

        // Create audio element if not exists
        if (!farmAudioRef.current) {
            farmAudioRef.current = new Audio('/audio/farm-music.mp3');
            farmAudioRef.current.loop = true;
            farmAudioRef.current.volume = masterVolumeRef.current * 0.3;
        }

        farmAudioRef.current.play().catch((err) => {
            console.log('Farm music play failed:', err);
        });
    }, []);

    const stopFarmMusic = useCallback(() => {
        if (farmAudioRef.current) {
            farmAudioRef.current.pause();
            farmAudioRef.current.currentTime = 0;
        }
    }, []);

    const playCatchSuccessSound = useCallback(() => {
        // Success jingle
        playTone(523, 0.15, 'sine'); // C
        setTimeout(() => playTone(659, 0.15, 'sine'), 100); // E
        setTimeout(() => playTone(784, 0.3, 'sine'), 200); // G
    }, [playTone]);

    const playMissedSound = useCallback(() => {
        // Descending sad sound
        playTone(400, 0.2, 'sine');
        setTimeout(() => playTone(300, 0.3, 'sine'), 150);
    }, [playTone]);

    const playSellSound = useCallback(() => {
        // Coin sound
        playTone(800, 0.1, 'sine');
        setTimeout(() => playTone(1000, 0.1, 'sine'), 80);
    }, [playTone]);

    const playKeepSound = useCallback(() => {
        // Positive confirmation
        playTone(600, 0.15, 'sine');
        setTimeout(() => playTone(800, 0.15, 'sine'), 100);
    }, [playTone]);

    const playWaterAmbience = useCallback(() => {
        // Gentle water sound (low frequency)
        if (!audioContextRef.current || isMutedRef.current) return;
        playTone(150, 0.5, 'sine');
    }, [playTone]);

    // Background music player (for actual audio files)
    const playBackgroundMusic = useCallback((url: string, options: AudioOptions = {}) => {
        if (isMutedRef.current) return;

        let audio = audioElementsRef.current.get('bgm');

        if (!audio) {
            audio = new Audio();
            audio.loop = true;
            audioElementsRef.current.set('bgm', audio);
        }

        audio.src = url;
        audio.volume = (options.volume ?? 0.3) * masterVolumeRef.current;
        audio.loop = options.loop ?? true;

        audio.play().catch((err: any) => {
            console.log('Background music play failed:', err);
        });
    }, []);

    const stopBackgroundMusic = useCallback(() => {
        const audio = audioElementsRef.current.get('bgm');
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }, []);

    const setMuted = useCallback((muted: boolean) => {
        isMutedRef.current = muted;
        audioElementsRef.current.forEach((audio: HTMLAudioElement) => {
            audio.muted = muted;
        });
    }, []);

    const setMasterVolume = useCallback((volume: number) => {
        masterVolumeRef.current = Math.max(0, Math.min(1, volume));
        audioElementsRef.current.forEach((audio: HTMLAudioElement) => {
            audio.volume = masterVolumeRef.current;
        });
    }, []);

    return {
        // Sound effects
        playCastSound,
        playBiteSound,
        playFightSound,
        startBattleLoop,
        stopBattleLoop,
        playCatchSuccessSound,
        playMissedSound,
        playSellSound,
        playKeepSound,
        playWaterAmbience,

        // Background music
        playBackgroundMusic,
        stopBackgroundMusic,
        startFishingMusic,
        stopFishingMusic,
        startFarmMusic,
        stopFarmMusic,

        // Controls
        setMuted,
        setMasterVolume,
    };
};
