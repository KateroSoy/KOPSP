import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';

interface Step {
  id: string;
  targetId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: Step[] = [
  {
    id: 'welcome',
    targetId: '',
    title: 'Selamat Datang! 🎉',
    description: 'Mari ikuti tur singkat untuk mengenali fitur utama di Koperasi Simpan Pinjam.',
    position: 'center'
  },
  {
    id: 'saldo',
    targetId: 'tour-saldo',
    title: 'Total Simpanan',
    description: 'Di sini Anda dapat melihat total simpanan Anda. Terus tingkatkan simpanan untuk masa depan!',
    position: 'bottom'
  },
  {
    id: 'quick-actions',
    targetId: 'tour-quick-actions',
    title: 'Akses Cepat',
    description: 'Menu ini memudahkan Anda untuk langsung menuju halaman Simpanan, Pinjaman, Riwayat, dan Profil.',
    position: 'top'
  },
  {
    id: 'nav',
    targetId: 'tour-nav',
    title: 'Navigasi Utama',
    description: 'Gunakan navigasi ini kapan saja untuk berpindah antar halaman.',
    position: 'top'
  }
];

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductTour({ isOpen, onClose }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStep];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      if (step.targetId) {
        const element = document.getElementById(step.targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            const newElement = document.getElementById(step.targetId);
            if (newElement) {
              setTargetRect(newElement.getBoundingClientRect());
            }
          }, 300);
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, isOpen, step.targetId]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  const getPopoverStyle = (): React.CSSProperties => {
    if (!targetRect || step.position === 'center') {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const margin = 16;
    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = targetRect.bottom + margin;
        left = targetRect.left + (targetRect.width / 2);
        return { top, left, transform: 'translate(-50%, 0)' };
      case 'top':
        top = targetRect.top - margin;
        left = targetRect.left + (targetRect.width / 2);
        return { top, left, transform: 'translate(-50%, -100%)' };
      case 'right':
        top = targetRect.top + (targetRect.height / 2);
        left = targetRect.right + margin;
        return { top, left, transform: 'translate(0, -50%)' };
      case 'left':
        top = targetRect.top + (targetRect.height / 2);
        left = targetRect.left - margin;
        return { top, left, transform: 'translate(-100%, -50%)' };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto transition-all duration-500"
            style={{
              clipPath: targetRect
                ? `polygon(
                    0% 0%, 0% 100%, 
                    ${targetRect.left - 8}px 100%, 
                    ${targetRect.left - 8}px ${targetRect.top - 8}px, 
                    ${targetRect.right + 8}px ${targetRect.top - 8}px, 
                    ${targetRect.right + 8}px ${targetRect.bottom + 8}px, 
                    ${targetRect.left - 8}px ${targetRect.bottom + 8}px, 
                    ${targetRect.left - 8}px 100%, 
                    100% 100%, 100% 0%
                  )`
                : 'none'
            }}
          />

          {targetRect && (
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute border-2 border-emerald-500 rounded-2xl shadow-[0_0_0_4px_rgba(16,185,129,0.3)] pointer-events-none"
            />
          )}

          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ ...getPopoverStyle(), position: 'absolute' }}
            className="pointer-events-auto bg-white/95 backdrop-blur-md w-[320px] rounded-2xl shadow-2xl border border-emerald-100 p-6 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-lg">
                <Sparkles className="w-5 h-5" />
                {step.title}
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-600 leading-relaxed text-sm mt-1">
              {step.description}
            </p>

            <div className="flex items-center justify-between mt-3 pt-4 border-t border-gray-100">
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((s, i) => (
                  <div 
                    key={s.id} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep ? 'w-4 bg-emerald-500' : 'w-1.5 bg-gray-200'
                    }`} 
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-md shadow-emerald-600/20"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? (
                    <>
                      Selesai <Check className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Lanjut <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
