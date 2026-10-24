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

/**
 * Kenyan Maasai Moran Warrior Shield & Crossed Spears
 * Stylized iconic African warrior heritage motif with animations
 */
export const MoranShieldMotif: React.FC<{
  className?: string;
  size?: number;
  animate?: boolean;
}> = ({ className = '', size = 28, animate = true }) => (
  <div
    className={`relative inline-flex items-center justify-center shrink-0 ${
      animate ? 'hover:scale-110 transition-transform' : ''
    } ${className}`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animate ? 'animate-warrior-vitality' : ''}
    >
      {/* Crossed Warrior Spears */}
      <line x1="6" y1="34" x2="34" y2="6" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" />
      <polygon points="34,6 37,3 32,8" fill="#F8FAFC" />
      <line x1="34" y1="34" x2="6" y2="6" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" />
      <polygon points="6,6 3,3 8,8" fill="#F8FAFC" />

      {/* Central Warrior Shield Body (Elliptical Maasai Shield) */}
      <path
        d="M20 4 C13 12, 13 28, 20 36 C27 28, 27 12, 20 4 Z"
        fill="#C2410C"
        stroke="#EAB308"
        strokeWidth="1.4"
      />

      {/* Traditional Moran Shield Geometric Markings (Red, Black, White, Ochre) */}
      <path d="M20 4 L20 36" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="2 1.5" />
      <path d="M15 16 C17 19, 17 21, 15 24" stroke="#0F172A" strokeWidth="1.2" fill="none" />
      <path d="M25 16 C23 19, 23 21, 25 24" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />

      {/* Central Boss / Medallion */}
      <circle cx="20" cy="20" r="3" fill="#D97706" stroke="#FFFFFF" strokeWidth="0.8" />
      <circle cx="20" cy="20" r="1.2" fill="#0078D4" />
    </svg>
  </div>
);

/**
 * Miniature Warrior Spear & Bead Badge
 * Sits inside active tabs with a lively spear gleam
 */
export const WarriorSpearBadge: React.FC<{
  className?: string;
  size?: number;
}> = ({ className = '', size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 inline-block text-amber-300 animate-warrior-vitality ${className}`}
    aria-hidden="true"
  >
    <path
      d="M8 1L10 6L8 8L6 6L8 1Z"
      fill="#F59E0B"
      stroke="#FEF3C7"
      strokeWidth="0.8"
    />
    <line x1="8" y1="8" x2="8" y2="15" stroke="#FDE68A" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="8" cy="8" r="1.5" fill="#C2410C" />
  </svg>
);

/**
 * Wavy African Fabric Pattern Motif in Multiple Opacities of Azure (Patterns Only)
 * Pure geometric & wavy Kitenge/Kanga fabric patterns in layered opacities of Azure (#005A9E, #0078D4, #0284C7, #0EA5E9, #38BDF8)
 * with subtle pattern drift and shimmer—no solid wave fills.
 */
export const WavyAzureFabricMotif: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}
    aria-hidden="true"
  >
    {/* Pattern Layer 1: Primary Interlocking Wavy Kitenge Diamond & Chevron Lattice */}
    <div className="absolute inset-0 animate-azure-fabric-wave-1">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="azure_pattern_kitenge_primary"
            width="72"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            {/* Wavy African Fabric Thread Lines (Multiple Opacities of Azure) */}
            <path
              d="M0 18 Q 18 4, 36 18 T 72 18"
              fill="none"
              stroke="#0078D4"
              strokeOpacity="0.18"
              strokeWidth="1.3"
            />
            <path
              d="M0 18 Q 18 32, 36 18 T 72 18"
              fill="none"
              stroke="#005A9E"
              strokeOpacity="0.13"
              strokeWidth="1.1"
              strokeDasharray="4 2"
            />
            <path
              d="M0 6 Q 18 18, 36 6 T 72 6"
              fill="none"
              stroke="#38BDF8"
              strokeOpacity="0.14"
              strokeWidth="0.9"
            />
            <path
              d="M0 30 Q 18 18, 36 30 T 72 30"
              fill="none"
              stroke="#0284C7"
              strokeOpacity="0.14"
              strokeWidth="0.9"
            />

            {/* Kitenge Geometric Outer Diamond (Opacity 0.16) */}
            <polygon
              points="36,5 47,18 36,31 25,18"
              fill="none"
              stroke="#0078D4"
              strokeOpacity="0.22"
              strokeWidth="1.1"
            />
            {/* Inner Concentric Kitenge Diamond (Opacity 0.12) */}
            <polygon
              points="36,10 42,18 36,26 30,18"
              fill="#0078D4"
              fillOpacity="0.08"
              stroke="#0EA5E9"
              strokeOpacity="0.25"
              strokeWidth="0.9"
            />
            {/* Center Bead Node (Opacity 0.28) */}
            <circle cx="36" cy="18" r="2" fill="#005A9E" fillOpacity="0.28" />

            {/* Side Interlocking Chevrons */}
            <polyline
              points="10,12 16,18 10,24"
              fill="none"
              stroke="#0284C7"
              strokeOpacity="0.20"
              strokeWidth="1.1"
            />
            <polyline
              points="62,12 56,18 62,24"
              fill="none"
              stroke="#0284C7"
              strokeOpacity="0.20"
              strokeWidth="1.1"
            />

            {/* Corner Bead Dots in Varied Azure Opacities */}
            <circle cx="0" cy="18" r="1.8" fill="#0078D4" fillOpacity="0.24" />
            <circle cx="72" cy="18" r="1.8" fill="#0078D4" fillOpacity="0.24" />
            <circle cx="18" cy="11" r="1.3" fill="#38BDF8" fillOpacity="0.30" />
            <circle cx="54" cy="25" r="1.3" fill="#38BDF8" fillOpacity="0.30" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#azure_pattern_kitenge_primary)" />
      </svg>
    </div>

    {/* Pattern Layer 2: Secondary Counter-Shifting Shuka Geometric Weave Pattern */}
    <div className="absolute inset-0 animate-azure-fabric-wave-2">
      <svg className="w-full h-full animate-azure-fabric-shimmer" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="azure_pattern_shuka_secondary"
            width="48"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            {/* Scalloped Kanga Stitch Pattern */}
            <path
              d="M0 12 C 12 2, 12 22, 24 12 C 36 2, 36 22, 48 12"
              fill="none"
              stroke="#0EA5E9"
              strokeOpacity="0.15"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            {/* Micro-Diamond Pattern Nodes */}
            <polygon
              points="24,8 28,12 24,16 20,12"
              fill="#38BDF8"
              fillOpacity="0.10"
            />
            <circle cx="12" cy="12" r="1" fill="#005A9E" fillOpacity="0.20" />
            <circle cx="36" cy="12" r="1" fill="#005A9E" fillOpacity="0.20" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#azure_pattern_shuka_secondary)" />
      </svg>
    </div>

    {/* Pattern Layer 3: Top & Bottom Fine Geometric Kanga Pattern Trim */}
    <div className="absolute top-0 left-0 right-0 h-2 overflow-hidden animate-azure-fabric-wave-3">
      <svg width="100%" height="8" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="azure_kanga_top_trim" width="32" height="8" patternUnits="userSpaceOnUse">
            <path
              d="M0,4 L8,1 L16,4 L24,7 L32,4"
              fill="none"
              stroke="#0078D4"
              strokeOpacity="0.35"
              strokeWidth="1.4"
            />
            <polygon points="16,1 19,4 16,7 13,4" fill="#005A9E" fillOpacity="0.30" />
            <circle cx="8" cy="4" r="1.2" fill="#38BDF8" fillOpacity="0.45" />
            <circle cx="24" cy="4" r="1.2" fill="#0284C7" fillOpacity="0.35" />
          </pattern>
        </defs>
        <rect width="100%" height="8" fill="url(#azure_kanga_top_trim)" />
      </svg>
    </div>
  </div>
);


