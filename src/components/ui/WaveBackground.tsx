import React from 'react';

interface WaveBackgroundProps {
  className?: string;
}

export const WaveBackground: React.FC<WaveBackgroundProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Large elegant white wave blob at bottom */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        style={{ height: '320px' }}
      >
        <defs>
          <linearGradient id="whiteWaveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#f0fdf4', stopOpacity: 0.6 }} />
          </linearGradient>
          <filter id="waveShadow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>
        {/* Main elegant wave blob */}
        <path
          fill="url(#whiteWaveGradient)"
          filter="url(#waveShadow)"
          d="M0,150 C240,100 480,50 720,80 C960,110 1200,160 1440,140 L1440,400 L0,400 Z"
        />
      </svg>

      {/* Subtle secondary wave for depth */}
      <svg
        className="absolute bottom-12 left-0 w-full"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        style={{ height: '150px', opacity: 0.3 }}
      >
        <path
          fill="#ffffff"
          d="M0,100 C360,60 720,60 1080,100 C1200,120 1440,120 1440,100 L1440,200 L0,200 Z"
        />
      </svg>

      {/* Minimalist line accent on top */}
      <svg
        className="absolute top-0 left-0 w-full"
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        style={{ height: '30px', opacity: 0.15 }}
      >
        <path
          fill="none"
          stroke="#10b981"
          strokeWidth="1"
          d="M0,20 Q360,8 720,20 T1440,20"
        />
      </svg>
    </div>
  );
};

export default WaveBackground;
