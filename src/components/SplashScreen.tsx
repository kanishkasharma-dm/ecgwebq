import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide the splash screen after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-center min-h-screen"
        >
          <div className="flex flex-col items-center gap-8">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="relative"
            >
               {/* A nice glow effect behind the logo */}
               <div className="absolute inset-0 bg-brand-orange/20 blur-[50px] rounded-full" />
               <img 
                 src="/deckmount-logo.png" 
                 alt="Deckmount Logo" 
                 className="w-44 h-44 object-contain relative z-10" 
               />
            </motion.div>

            <motion.div 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <h1 className="text-5xl font-display font-medium tracking-[0.25em] text-white drop-shadow-md">
                CARDIOX
              </h1>
              <p className="text-xs font-sans font-semibold tracking-[0.35em] text-brand-electric uppercase">
                Powered by Deckmount
              </p>
            </motion.div>
            
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 1.0, ease: "easeInOut" }}
              className="w-56 h-[1px] bg-gradient-to-r from-transparent via-brand-orange/60 to-transparent mt-4"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
