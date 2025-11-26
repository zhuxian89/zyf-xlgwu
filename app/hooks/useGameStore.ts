import { create } from 'zustand';

interface GameState {
    coins: number;
    addCoins: (amount: number) => void;
    spendCoins: (amount: number) => boolean;
    setCoins: (amount: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    coins: 100, // Default start
    addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
    spendCoins: (amount) => {
        const current = get().coins;
        if (current >= amount) {
            set({ coins: current - amount });
            return true;
        }
        return false;
    },
    setCoins: (amount) => set({ coins: amount }),
}));
