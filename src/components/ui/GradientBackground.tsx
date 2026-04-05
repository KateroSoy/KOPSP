import React from 'react';

type BackgroundVariant = 'wave' | 'gradient' | 'blob' | 'minimal';

interface GradientBackgroundProps {
  variant?: BackgroundVariant;
  className?: string;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({ 
  variant = 'gradient',
  className = '' 
}) => {
  switch (variant) {
    case 'wave':
      return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
          <svg
            className="absolute top-0 left-0 w-full h-40 text-emerald-50"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,40 Q360,80 720,40 T1440,40 L1440,0 L0,0 Z"
            />
          </svg>
          <svg
            className="absolute top-20 left-0 w-full h-32 text-emerald-100 opacity-40"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,60 Q360,20 720,60 T1440,60 L1440,0 L0,0 Z"
            />
          </svg>
        </div>
      );

    case 'blob':
      return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
          <div className="absolute top-10 right-10 w-80 h-80 bg-linear-to-br from-emerald-200 to-emerald-50 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-linear-to-tl from-emerald-100 to-emerald-50 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-linear-to-r from-emerald-50 to-transparent rounded-full blur-3xl opacity-15"></div>
        </div>
      );

    case 'minimal':
      return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-emerald-300 to-transparent opacity-50"></div>
          <div className="absolute top-1/4 right-0 w-1 h-32 bg-linear-to-b from-emerald-200 to-transparent opacity-30"></div>
          <div className="absolute bottom-0 left-1/4 w-48 h-1 bg-linear-to-r from-emerald-100 to-transparent opacity-40"></div>
          <div className="absolute bottom-1/4 left-0 w-1 h-24 bg-linear-to-t from-emerald-100 to-transparent opacity-20"></div>
        </div>
      );

    default: // gradient
      return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
          <svg
            className="absolute top-0 left-0 w-full h-32 text-emerald-50"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path
              fill="url(#grad1)"
              d="M0,40 Q360,80 720,40 T1440,40 L1440,0 L0,0 Z"
            />
          </svg>
        </div>
      );
  }
};

export default GradientBackground;
