import React from 'react';

interface ShapeProps {
  className?: string;
}

export const TopWaveShape: React.FC<ShapeProps> = ({ className = '' }) => (
  <svg
    className={`absolute top-0 left-0 w-full h-32 text-emerald-50 ${className}`}
    viewBox="0 0 1440 120"
    preserveAspectRatio="none"
  >
    <path
      fill="currentColor"
      d="M0,40 Q360,80 720,40 T1440,40 L1440,0 L0,0 Z"
    />
  </svg>
);

export const BottomWaveShape: React.FC<ShapeProps> = ({ className = '' }) => (
  <svg
    className={`absolute bottom-0 left-0 w-full h-32 text-emerald-50 ${className}`}
    viewBox="0 0 1440 120"
    preserveAspectRatio="none"
  >
    <path
      fill="currentColor"
      d="M0,80 Q360,40 720,80 T1440,80 L1440,120 L0,120 Z"
    />
  </svg>
);

export const DiagonalGradient: React.FC<ShapeProps> = ({ className = '' }) => (
  <div
    className={`absolute inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-emerald-100/30 ${className}`}
  />
);

export const CircleBlob: React.FC<ShapeProps & { size?: 'sm' | 'md' | 'lg'; position?: 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right' }> = ({ 
  className = '', 
  size = 'md',
  position = 'top-right'
}) => {
  const sizeClasses = {
    sm: 'w-48 h-48',
    md: 'w-96 h-96',
    lg: 'w-[500px] h-[500px]'
  };

  const positionClasses = {
    'top-right': 'top-0 right-0 -translate-y-1/4 translate-x-1/4',
    'bottom-left': 'bottom-0 left-0 translate-y-1/4 -translate-x-1/4',
    'top-left': 'top-0 left-0 -translate-y-1/4 -translate-x-1/4',
    'bottom-right': 'bottom-0 right-0 translate-y-1/4 translate-x-1/4'
  };

  return (
    <div
      className={`absolute ${sizeClasses[size]} ${positionClasses[position]} rounded-full blur-3xl opacity-20 bg-linear-to-br from-emerald-200 to-emerald-50 ${className}`}
    />
  );
};

export const LineAccent: React.FC<ShapeProps & { orientation?: 'horizontal' | 'vertical'; position?: string }> = ({ 
  className = '',
  orientation = 'horizontal',
  position = 'top-0'
}) => {
  if (orientation === 'horizontal') {
    return (
      <div
        className={`absolute left-0 right-0 h-1 bg-linear-to-r from-transparent via-emerald-300 to-transparent opacity-50 ${position} ${className}`}
      />
    );
  }
  
  return (
    <div
      className={`absolute top-0 bottom-0 w-1 bg-linear-to-b from-transparent via-emerald-300 to-transparent opacity-50 ${position} ${className}`}
    />
  );
};

export default {
  TopWaveShape,
  BottomWaveShape,
  DiagonalGradient,
  CircleBlob,
  LineAccent
};
