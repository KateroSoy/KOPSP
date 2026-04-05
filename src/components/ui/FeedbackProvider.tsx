import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = ToastInput & {
  id: string;
  variant: ToastVariant;
};

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
};

type ConfirmState = ConfirmOptions & {
  resolve: (result: boolean) => void;
};

type FeedbackContextValue = {
  notify: (input: ToastInput) => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (title: string, description?: string) => void;
  notifyWarning: (title: string, description?: string) => void;
  notifyInfo: (title: string, description?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

const toastStyles: Record<
  ToastVariant,
  {
    border: string;
    accent: string;
    iconWrap: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    border: 'border-emerald-200/80',
    accent: 'from-emerald-500 via-emerald-400 to-lime-400',
    iconWrap: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
    icon: <CheckCircle2 size={18} />,
  },
  error: {
    border: 'border-red-200/80',
    accent: 'from-red-500 via-rose-400 to-orange-300',
    iconWrap: 'bg-red-50 text-red-600 ring-1 ring-red-100',
    icon: <AlertCircle size={18} />,
  },
  warning: {
    border: 'border-amber-200/80',
    accent: 'from-amber-500 via-orange-400 to-yellow-300',
    iconWrap: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
    icon: <TriangleAlert size={18} />,
  },
  info: {
    border: 'border-sky-200/80',
    accent: 'from-sky-500 via-cyan-400 to-blue-300',
    iconWrap: 'bg-sky-50 text-sky-600 ring-1 ring-sky-100',
    icon: <Info size={18} />,
  },
};

const confirmStyles: Record<
  NonNullable<ConfirmOptions['variant']>,
  {
    iconWrap: string;
    icon: React.ReactNode;
    buttonVariant: 'primary' | 'danger';
  }
> = {
  primary: {
    iconWrap: 'bg-emerald-50 text-emerald-600',
    icon: <Info size={22} />,
    buttonVariant: 'primary',
  },
  danger: {
    iconWrap: 'bg-red-50 text-red-600',
    icon: <TriangleAlert size={22} />,
    buttonVariant: 'danger',
  },
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const timeoutMap = useRef<Record<string, number>>({});

  const dismissToast = (id: string) => {
    const timeoutId = timeoutMap.current[id];
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete timeoutMap.current[id];
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const notify = ({ variant = 'info', duration = 4200, ...input }: ToastInput) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const toast: ToastItem = {
      id,
      variant,
      duration,
      ...input,
    };

    setToasts((current) => [...current, toast]);
    timeoutMap.current[id] = window.setTimeout(() => {
      dismissToast(id);
    }, duration);
  };

  useEffect(() => {
    return () => {
      Object.values(timeoutMap.current).forEach((timeoutId) => window.clearTimeout(timeoutId as number));
    };
  }, []);

  const confirm = (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      setConfirmState({
        confirmText: 'Lanjutkan',
        cancelText: 'Batal',
        variant: 'primary',
        ...options,
        resolve,
      });
    });

  const resolveConfirm = (result: boolean) => {
    if (!confirmState) return;
    confirmState.resolve(result);
    setConfirmState(null);
  };

  const contextValue = useMemo<FeedbackContextValue>(
    () => ({
      notify,
      notifySuccess: (title, description) => notify({ variant: 'success', title, description }),
      notifyError: (title, description) => notify({ variant: 'error', title, description }),
      notifyWarning: (title, description) => notify({ variant: 'warning', title, description }),
      notifyInfo: (title, description) => notify({ variant: 'info', title, description }),
      confirm,
    }),
    [],
  );

  const confirmUi = confirmState ? confirmStyles[confirmState.variant ?? 'primary'] : null;

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[90] mx-auto flex max-w-md flex-col gap-3 px-4">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const style = toastStyles[toast.variant];

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  'pointer-events-auto relative overflow-hidden rounded-[28px] border bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl',
                  style.border,
                )}
              >
                <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', style.accent)} />
                <div className="flex items-start gap-3 px-4 py-4">
                  <div className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', style.iconWrap)}>
                    {style.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
                    {toast.description && (
                      <p className="mt-1 text-sm leading-5 text-gray-600">{toast.description}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Tutup notifikasi"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmState && confirmUi && (
          <motion.div
            className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-950/35 px-4 pb-6 pt-10 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => resolveConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
            >
              <div className="bg-gradient-to-br from-white via-white to-gray-50 px-5 py-5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900/5">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', confirmUi.iconWrap)}>
                    {confirmUi.icon}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900">{confirmState.title}</h3>
                {confirmState.description && (
                  <p className="mt-2 text-sm leading-6 text-gray-600">{confirmState.description}</p>
                )}

                <div className="mt-6 flex gap-3">
                  <Button variant="outline" fullWidth onClick={() => resolveConfirm(false)}>
                    {confirmState.cancelText}
                  </Button>
                  <Button
                    variant={confirmUi.buttonVariant}
                    fullWidth
                    onClick={() => resolveConfirm(true)}
                  >
                    {confirmState.confirmText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </FeedbackContext.Provider>
  );
};

export const useUiFeedback = () => {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error('useUiFeedback must be used within a FeedbackProvider');
  }

  return context;
};
