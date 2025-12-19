import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface ChristmasPopupProps {
  onClose: () => void;
}

export function ChristmasPopup({ onClose }: ChristmasPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if popup was already shown in this session
    const hasSeenPopup = sessionStorage.getItem('christmas-popup-seen');
    if (!hasSeenPopup) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('christmas-popup-seen', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="relative z-10 w-full max-w-md mx-4"
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 p-8 shadow-2xl backdrop-blur-xl">
              {/* Decorative elements */}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-orange/20 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-brand-electric/20 blur-3xl" />
              
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="mb-6 text-6xl">🎄</div>
                <h2 className="mb-4 font-display text-2xl text-white md:text-3xl">
                  Deckmount Wishes You
                </h2>
                <p className="mb-2 text-lg text-brand-orange md:text-xl">
                  A Very Merry Christmas
                </p>
                <p className="mb-6 text-lg text-brand-electric md:text-xl">
                  & Happy New Year!
                </p>
                <p className="mb-6 text-sm text-white/70">
                  Thank you for being part of our journey. We look forward to serving you in the coming year.
                </p>
                <Button
                  onClick={handleClose}
                  className="min-w-[200px] uppercase tracking-[0.3em]"
                >
                  Continue
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

