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

/**
 * Randomly Placed African Motifs & Designs for Footer Area Background
 * Partially animated in light Azure colors (#BAE6FD, #7DD3FC, #38BDF8, #0EA5E9, #0078D4)
 */
export const FooterAfricanMotifsBackground: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const motifs = [
    { id: 1, type: 'shield', left: '4%', top: '14%', size: 44, anim: 'animate-pulse', delay: '0s', rotate: -12, opacity: 0.24 },
    { id: 2, type: 'diamond', left: '13%', top: '58%', size: 36, anim: 'animate-bounce', delay: '0.8s', rotate: 18, opacity: 0.22 },
    { id: 3, type: 'sunburst', left: '24%', top: '20%', size: 48, anim: 'animate-spin', delay: '0.2s', rotate: 0, opacity: 0.20, duration: '26s' },
    { id: 4, type: 'chevron', left: '35%', top: '64%', size: 42, anim: 'animate-pulse', delay: '1.4s', rotate: -8, opacity: 0.25 },
    { id: 5, type: 'medallion', left: '48%', top: '16%', size: 40, anim: 'animate-azure-fabric-shimmer', delay: '0.5s', rotate: 15, opacity: 0.22 },
    { id: 6, type: 'diamond', left: '59%', top: '62%', size: 34, anim: 'animate-pulse', delay: '1.9s', rotate: -22, opacity: 0.20 },
    { id: 7, type: 'shield', left: '71%', top: '18%', size: 46, anim: 'animate-warrior-vitality', delay: '0.4s', rotate: 14, opacity: 0.24 },
    { id: 8, type: 'sunburst', left: '83%', top: '54%', size: 42, anim: 'animate-spin', delay: '1.1s', rotate: 0, opacity: 0.22, duration: '32s' },
    { id: 9, type: 'chevron', left: '92%', top: '22%', size: 38, anim: 'animate-pulse', delay: '0.7s', rotate: 10, opacity: 0.25 },
  ];

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* Subtle Light Azure Ambient Gradient Wash */}
      <div className="absolute inset-0 bg-gradient-to-r from-sky-50/60 via-white/40 to-blue-50/60" />

      {/* Scattered African Geometric Motifs in Light Azure Palette */}
      {motifs.map((m) => (
        <div
          key={m.id}
          className={`absolute ${m.anim}`}
          style={{
            left: m.left,
            top: m.top,
            opacity: m.opacity,
            transform: `rotate(${m.rotate}deg)`,
            animationDelay: m.delay,
            animationDuration: m.duration || '4.5s',
          }}
        >
          {m.type === 'shield' && (
            <svg width={m.size} height={m.size} viewBox="0 0 48 48" fill="none">
              <line x1="6" y1="42" x2="42" y2="6" stroke="#7DD3FC" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="42" y1="42" x2="6" y2="6" stroke="#7DD3FC" strokeWidth="1.6" strokeLinecap="round" />
              <path
                d="M24 5 C15 14, 15 34, 24 43 C33 34, 33 14, 24 5 Z"
                fill="#E0F2FE"
                stroke="#38BDF8"
                strokeWidth="1.6"
              />
              <path d="M24 7 L24 41" stroke="#0284C7" strokeWidth="1.2" strokeDasharray="3 2" />
              <circle cx="24" cy="24" r="4" fill="#38BDF8" />
            </svg>
          )}

          {m.type === 'diamond' && (
            <svg width={m.size} height={m.size} viewBox="0 0 44 44" fill="none">
              <polygon
                points="22,2 42,22 22,42 2,22"
                fill="#E0F2FE"
                stroke="#38BDF8"
                strokeWidth="1.5"
              />
              <polygon
                points="22,9 35,22 22,35 9,22"
                fill="none"
                stroke="#0EA5E9"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <circle cx="22" cy="22" r="3.5" fill="#0284C7" />
            </svg>
          )}

          {m.type === 'sunburst' && (
            <svg width={m.size} height={m.size} viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="19" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 3" />
              <circle cx="24" cy="24" r="13" stroke="#7DD3FC" strokeWidth="1.5" />
              <circle cx="24" cy="24" r="6" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.2" />
              <path d="M24 1 L26 7 H22 Z" fill="#0EA5E9" />
              <path d="M24 47 L26 41 H22 Z" fill="#0EA5E9" />
              <path d="M1 24 L7 22 V26 Z" fill="#0EA5E9" />
              <path d="M47 24 L41 22 V26 Z" fill="#0EA5E9" />
            </svg>
          )}

          {m.type === 'chevron' && (
            <svg width={m.size} height={m.size} viewBox="0 0 48 32" fill="none">
              <polyline
                points="2,10 12,2 24,14 36,2 46,10"
                stroke="#38BDF8"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="2,20 12,12 24,24 36,12 46,20"
                stroke="#0EA5E9"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="24" cy="26" r="2.5" fill="#7DD3FC" />
            </svg>
          )}

          {m.type === 'medallion' && (
            <svg width={m.size} height={m.size} viewBox="0 0 44 44" fill="none">
              <rect
                x="7"
                y="7"
                width="30"
                height="30"
                rx="6"
                transform="rotate(45 22 22)"
                fill="#E0F2FE"
                stroke="#38BDF8"
                strokeWidth="1.4"
              />
              <circle cx="22" cy="22" r="8" stroke="#0284C7" strokeWidth="1.4" strokeDasharray="2 2" />
              <circle cx="22" cy="22" r="3" fill="#0EA5E9" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Compact Kenyan Flag Shield & Beadwork Micro-Emblem for the Quick-Sort label
 */
export const KenyanFlagMiniEmblem: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Crossed White/Slate Spears */}
    <line x1="4" y1="24" x2="24" y2="4" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="24" y1="24" x2="4" y2="4" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" />
    {/* Outer Ring in Kenyan Green, Red, Black segments */}
    <circle cx="14" cy="14" r="11.5" stroke="#006600" strokeWidth="1.6" strokeDasharray="6 3" />
    {/* Maasai Shield in Kenyan Flag Colours */}
    <path
      d="M14 3.5 C8.5 8.5, 8.5 19.5, 14 24.5 C19.5 19.5, 19.5 8.5, 14 3.5 Z"
      fill="#BB0000"
      stroke="#FFFFFF"
      strokeWidth="1.3"
    />
    {/* Left & Right Black Flanks */}
    <path d="M14 4.5 C10 8.5, 10 19.5, 14 23.5 Z" fill="#0F172A" fillOpacity="0.85" />
    {/* Green Lower Trim & White Center Boss */}
    <circle cx="14" cy="14" r="3.2" fill="#006600" stroke="#FFFFFF" strokeWidth="1.2" />
    <circle cx="14" cy="14" r="1.2" fill="#FFFFFF" />
  </svg>
);

/**
 * Tasteful, Partially Animated Kenyan Motifs in Kenyan Flag Colours
 * (Black #0F172A, Crimson Red #BB0000, Highland Green #006600, White #FFFFFF)
 * Randomly distributed across the Quick-Sort Dashboard Area to brighten the section.
 */
export const KenyanFlagQuickSortMotifs: React.FC<{
  className?: string;
  isFetching?: boolean;
}> = ({ className = '', isFetching = false }) => {
  const kenyanMotifs = [
    {
      id: 'ke-1',
      type: 'kenyan-shield',
      left: '2.5%',
      top: '10%',
      size: 38,
      anim: 'animate-warrior-vitality',
      delay: '0s',
      duration: '5s',
      rotate: -14,
      opacity: 0.24,
    },
    {
      id: 'ke-2',
      type: 'kenyan-diamond',
      left: '16%',
      top: '54%',
      size: 30,
      anim: 'animate-pulse',
      delay: '0.6s',
      duration: '4.2s',
      rotate: 18,
      opacity: 0.22,
    },
    {
      id: 'ke-3',
      type: 'kenyan-rosette',
      left: '31%',
      top: '8%',
      size: 34,
      anim: 'animate-spin',
      delay: '0.2s',
      duration: '28s',
      rotate: 0,
      opacity: 0.20,
    },
    {
      id: 'ke-4',
      type: 'kenyan-chevron',
      left: '46%',
      top: '58%',
      size: 36,
      anim: 'animate-pulse',
      delay: '1.2s',
      duration: '4.8s',
      rotate: -8,
      opacity: 0.24,
    },
    {
      id: 'ke-5',
      type: 'kenyan-shield',
      left: '61%',
      top: '12%',
      size: 34,
      anim: 'animate-pulse',
      delay: '0.9s',
      duration: '5.5s',
      rotate: 15,
      opacity: 0.21,
    },
    {
      id: 'ke-6',
      type: 'kenyan-diamond',
      left: '74%',
      top: '52%',
      size: 32,
      anim: 'animate-bounce',
      delay: '1.5s',
      duration: '6s',
      rotate: -20,
      opacity: 0.20,
    },
    {
      id: 'ke-7',
      type: 'kenyan-rosette',
      left: '83%',
      top: '14%',
      size: 36,
      anim: 'animate-spin',
      delay: '0.4s',
      duration: '34s',
      rotate: 0,
      opacity: 0.22,
    },
    {
      id: 'ke-8',
      type: 'kenyan-chevron',
      left: '89%',
      top: '56%',
      size: 30,
      anim: 'animate-pulse',
      delay: '0.7s',
      duration: '4.4s',
      rotate: 12,
      opacity: 0.25,
    },
  ];

  return (
    <div
      data-fetching={isFetching ? 'true' : 'false'}
      className={`KenyanFlagQuickSortMotifs ${
        isFetching ? 'is-fetching' : ''
      } pointer-events-none absolute inset-0 overflow-hidden select-none rounded-2xl transition-all duration-300 ease-out group-hover:animate-pulse hover:animate-pulse hover:animate-kenyan-pulse group-hover:animate-kenyan-pulse ${className}`}
      aria-hidden="true"
    >
      {/* Top Kenyan Flag Tri-Band Woven Accent Thread (Black - White - Red - White - Green) */}
      <div className="absolute top-0 left-0 right-0 h-[3px] flex opacity-85 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-pulse">
        <div className="flex-1 bg-[#0F172A]" />
        <div className="w-2 bg-white" />
        <div className="flex-1 bg-[#BB0000]" />
        <div className="w-2 bg-white" />
        <div className="flex-1 bg-[#006600]" />
        <div className="w-2 bg-white" />
        <div className="flex-1 bg-[#BB0000]" />
        <div className="w-2 bg-white" />
        <div className="flex-1 bg-[#006600]" />
      </div>

      {/* Subtle Warm Kenyan Heritage Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-red-50/25 via-white/10 to-emerald-50/30 transition-opacity duration-300 group-hover:opacity-95 group-hover:animate-pulse" />

      {/* Bottom Fine Kenyan Beadwork Stitch Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] flex opacity-65 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-pulse">
        <div className="flex-1 bg-gradient-to-r from-[#0F172A] via-[#BB0000] to-[#006600]" />
      </div>

      {/* Randomly Scattered & Partially Animated Kenyan Flag Motifs with Hover-Triggered Pulse */}
      {kenyanMotifs.map((m) => (
        <div
          key={m.id}
          className={`absolute pointer-events-auto ${m.anim} group-hover:animate-pulse hover:animate-pulse transition-transform duration-300 group-hover:scale-105 hover:scale-110`}
          style={{
            left: m.left,
            top: m.top,
            opacity: m.opacity,
            transform: `rotate(${m.rotate}deg)`,
            animationDelay: m.delay,
            animationDuration: m.duration,
          }}
        >
          {/* 1. Kenyan Maasai Shield & Crossed Spears in Black, Red, Green & White */}
          {m.type === 'kenyan-shield' && (
            <svg width={m.size} height={m.size} viewBox="0 0 48 48" fill="none">
              <line
                x1="7"
                y1="41"
                x2="41"
                y2="7"
                stroke="#0F172A"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="41"
                y1="41"
                x2="7"
                y2="7"
                stroke="#0F172A"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M24 5 C14 14, 14 34, 24 43 C34 34, 34 14, 24 5 Z"
                fill="#BB0000"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              {/* Black & Green Shield Bands */}
              <path
                d="M24 7 C17 15, 17 33, 24 41"
                fill="#0F172A"
                fillOpacity="0.85"
              />
              <path
                d="M24 7 C31 15, 31 33, 24 41"
                fill="#006600"
                fillOpacity="0.85"
              />
              <path
                d="M24 6 L24 42"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeDasharray="3 2"
              />
              <circle cx="24" cy="24" r="5" fill="#BB0000" stroke="#FFFFFF" strokeWidth="1.6" />
              <circle cx="24" cy="24" r="2" fill="#FFFFFF" />
            </svg>
          )}

          {/* 2. Kitenge Concentric Diamond in Kenyan Flag Colours */}
          {m.type === 'kenyan-diamond' && (
            <svg width={m.size} height={m.size} viewBox="0 0 44 44" fill="none">
              <polygon
                points="22,2 42,22 22,42 2,22"
                fill="#006600"
                fillOpacity="0.18"
                stroke="#006600"
                strokeWidth="2"
              />
              <polygon
                points="22,8 36,22 22,36 8,22"
                fill="#BB0000"
                fillOpacity="0.22"
                stroke="#FFFFFF"
                strokeWidth="1.6"
              />
              <polygon
                points="22,14 30,22 22,30 14,22"
                fill="#0F172A"
                stroke="#BB0000"
                strokeWidth="1.4"
              />
              <circle cx="22" cy="22" r="2.5" fill="#FFFFFF" />
            </svg>
          )}

          {/* 3. Kenyan Beadwork Sunburst Rosette */}
          {m.type === 'kenyan-rosette' && (
            <svg width={m.size} height={m.size} viewBox="0 0 48 48" fill="none">
              <circle
                cx="24"
                cy="24"
                r="19"
                stroke="#0F172A"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <circle
                cx="24"
                cy="24"
                r="14"
                stroke="#BB0000"
                strokeWidth="2"
                strokeDasharray="6 2"
              />
              <circle
                cx="24"
                cy="24"
                r="9"
                fill="#006600"
                fillOpacity="0.25"
                stroke="#006600"
                strokeWidth="1.8"
              />
              <circle cx="24" cy="24" r="4" fill="#BB0000" stroke="#FFFFFF" strokeWidth="1.5" />
              {/* Cardinal Bead Nodes */}
              <circle cx="24" cy="3" r="2.2" fill="#BB0000" />
              <circle cx="24" cy="45" r="2.2" fill="#006600" />
              <circle cx="3" cy="24" r="2.2" fill="#0F172A" />
              <circle cx="45" cy="24" r="2.2" fill="#006600" />
            </svg>
          )}

          {/* 4. Kenyan Tri-Colour Rift Valley Chevrons */}
          {m.type === 'kenyan-chevron' && (
            <svg width={m.size} height={m.size} viewBox="0 0 48 34" fill="none">
              <polyline
                points="2,9 13,2 24,12 35,2 46,9"
                stroke="#0F172A"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="2,18 13,11 24,21 35,11 46,18"
                stroke="#BB0000"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="2,27 13,20 24,30 35,20 46,27"
                stroke="#006600"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="24" cy="6" r="2" fill="#BB0000" />
              <circle cx="13" cy="26" r="1.8" fill="#006600" />
              <circle cx="35" cy="26" r="1.8" fill="#0F172A" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
};




