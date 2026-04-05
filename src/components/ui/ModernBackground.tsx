import React from 'react';
import { TopWaveShape, BottomWaveShape, CircleBlob, DiagonalGradient } from './BackgroundShapes';

type Theme = 'emerald' | 'blue' | 'purple' | 'gradient';

interface ModernBackgroundProps {
  theme?: Theme;
  showWaves?: boolean;
  showBlobs?: boolean;
  showGradient?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
  className?: string;
}

const themeClasses: Record<Theme, { bg: string; wave: string; blob: string }> = {
  emerald: {
    bg: 'from-white via-emerald-50 to-white',
    wave: 'text-emerald-50',
    blob: 'from-emerald-200 to-emerald-50'
  },
  blue: {
    bg: 'from-white via-blue-50 to-white',
    wave: 'text-blue-50',
    blob: 'from-blue-200 to-blue-50'
  },
  purple: {
    bg: 'from-white via-purple-50 to-white',
    wave: 'text-purple-50',
    blob: 'from-purple-200 to-purple-50'
  },
  gradient: {
    bg: 'from-white via-emerald-50/50 via-blue-50/30 to-white',
    wave: 'text-emerald-100',
    blob: 'from-emerald-200/30 to-blue-100/30'
  }
};

const intensityOpacity: Record<'light' | 'medium' | 'heavy', string> = {
  light: 'opacity-30',
  medium: 'opacity-50',
  heavy: 'opacity-70'
};

export const ModernBackground: React.FC<ModernBackgroundProps> = ({
  theme = 'emerald',
  showWaves = true,
  showBlobs = true,
  showGradient = true,
  intensity = 'medium',
  className = ''
}) => {
  const colors = themeClasses[theme];
  const opacityClass = intensityOpacity[intensity];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Base Gradient Background */}
      <div
        className={`absolute inset-0 bg-linear-to-b ${colors.bg}`}
      />

      {/* Diagonal Gradient Overlay */}
      {showGradient && (
        <DiagonalGradient className={opacityClass} />
      )}

      {/* Waves */}
      {showWaves && (
        <>
          <TopWaveShape className={`${colors.wave} ${opacityClass}`} />
          <BottomWaveShape className={`${colors.wave} ${opacityClass}`} />
        </>
      )}

      {/* Blobs */}
      {showBlobs && (
        <>
          <CircleBlob 
            size="lg" 
            position="top-right" 
            className={`bg-linear-to-br ${colors.blob} ${opacityClass}`}
          />
          <CircleBlob 
            size="md" 
            position="bottom-left" 
            className={`bg-linear-to-tr ${colors.blob} ${opacityClass}`}
          />
          <div
            className={`absolute top-1/3 left-1/4 w-72 h-72 rounded-full blur-3xl ${opacityClass} bg-linear-to-r ${colors.blob}`}
          />
        </>
      )}
    </div>
  );
};

export default ModernBackground;
