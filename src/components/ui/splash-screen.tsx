'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Brain, Target, Sparkles, GraduationCap } from 'lucide-react';

const icons = [BookOpen, Brain, Target, Sparkles];

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500);
    }, 2400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[hsl(222,47%,6%)]"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Rotating ring */}
          <motion.div
            className="absolute w-40 h-40 rounded-full border border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Orbiting icons */}
          <div className="absolute w-40 h-40">
            {icons.map((Icon, i) => (
              <motion.div
                key={i}
                className="absolute w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: Math.cos((i * Math.PI) / 2) * 70 - 20,
                  y: Math.sin((i * Math.PI) / 2) * 70 - 20,
                }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.5, type: 'spring' }}
              >
                <Icon className="w-5 h-5 text-primary" />
              </motion.div>
            ))}
          </div>

          {/* Center logo */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6, type: 'spring' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-2xl shadow-primary/30">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <motion.p
              className="font-display text-xl font-bold tracking-tight text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              UPSC PrepX
            </motion.p>
            <motion.p
              className="text-sm text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Command Your Preparation
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
