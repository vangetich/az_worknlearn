import React from 'react';

/**
 * Maasai Beaded Shield & Sunburst Medallion
 * Rendered with low-opacity or rich accent colors
 */
export const MaasaiMedallion: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 40,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Concentric rings representing Maasai necklace bead strands */}
    <circle cx="50" cy="50" r="46" stroke="#C2410C" strokeWidth="2.5" strokeDasharray="4 3" />
    <circle cx="50" cy="50" r="38" stroke="#D97706" strokeWidth="2.5" />
    <circle cx="50" cy="50" r="30" stroke="#EAB308" strokeWidth="2.5" strokeDasharray="3 3" />
    <circle cx="50" cy="50" r="22" stroke="#0078D4" strokeWidth="2.5" />
    <circle cx="50" cy="50" r="14" fill="#C2410C" />
    {/* Cardinal diamond points */}
    <path d="M50 2L55 12H45L50 2Z" fill="#D97706" />
    <path d="M50 98L55 88H45L50 98Z" fill="#D97706" />
    <path d="M2 50L12 45V55L2 50Z" fill="#C2410C" />
    <path d="M98 50L88 45V55L98 50Z" fill="#C2410C" />
    <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
  </svg>
);

/**
 * Kenyan Kitenge Ribbon Border
 * Interlocking chevrons with Terracotta, Ochre, Gold, and Azure
 */
export const KitengeRibbon: React.FC<{ className?: string; height?: number }> = ({
  className = '',
  height = 6,
}) => (
  <div
    className={`w-full overflow-hidden ${className}`}
    style={{ height: `${height}px` }}
    aria-hidden="true"
  >
    <svg
      width="100%"
      height={height}
      preserveAspectRatio="none"
      viewBox="0 0 200 6"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="kitenge_stripe" width="40" height="6" patternUnits="userSpaceOnUse">
          <polygon points="0,0 10,0 20,6 10,6" fill="#C2410C" />
          <polygon points="10,0 20,0 30,6 20,6" fill="#D97706" />
          <polygon points="20,0 30,0 40,6 30,6" fill="#EAB308" />
          <polygon points="30,0 40,0 50,6 40,6" fill="#0078D4" />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill="url(#kitenge_stripe)" />
    </svg>
  </div>
);

/**
 * Background Geometric Watermark Pattern (0.04 to 0.08 opacity)
 */
export const AfricanWatermarkPattern: React.FC<{
  className?: string;
  opacity?: number;
}> = ({ className = '', opacity = 0.05 }) => (
  <div
    className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    style={{ opacity }}
    aria-hidden="true"
  >
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          id="african_grid_pattern"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          {/* Kitenge Diamond Grid */}
          <path
            d="M24 0L48 24L24 48L0 24Z"
            fill="none"
            stroke="#1E293B"
            strokeWidth="1"
          />
          <circle cx="24" cy="24" r="3" fill="#D97706" />
          <circle cx="0" cy="0" r="2" fill="#C2410C" />
          <circle cx="48" cy="0" r="2" fill="#C2410C" />
          <circle cx="0" cy="48" r="2" fill="#C2410C" />
          <circle cx="48" cy="48" r="2" fill="#C2410C" />
          <line x1="24" y1="12" x2="24" y2="36" stroke="#0078D4" strokeWidth="0.8" strokeDasharray="2 2" />
          <line x1="12" y1="24" x2="36" y2="24" stroke="#0078D4" strokeWidth="0.8" strokeDasharray="2 2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#african_grid_pattern)" />
    </svg>
  </div>
);
