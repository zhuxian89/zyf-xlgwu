"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-6 h-6" />,
        error: <XCircle className="w-6 h-6" />,
        warning: <AlertCircle className="w-6 h-6" />,
        info: <Info className="w-6 h-6" />
    };

    const colors = {
        success: 'from-green-500 to-emerald-600',
        error: 'from-red-500 to-rose-600',
        warning: 'from-yellow-500 to-orange-600',
        info: 'from-blue-500 to-cyan-600'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-gradient-to-r ${colors[type]} text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-white/20 backdrop-blur-sm flex items-center gap-3 min-w-[300px] max-w-md`}
        >
            <div className="flex-shrink-0">
                {icons[type]}
            </div>
            <div className="flex-1 font-bold text-lg">
                {message}
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 hover:bg-white/20 rounded-full p-1 transition-colors"
            >
                <XCircle className="w-5 h-5" />
            </button>
        </motion.div>
    );
}

export function useToast() {
    const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([]);

    const showToast = (message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return { toasts, showToast, removeToast };
}
