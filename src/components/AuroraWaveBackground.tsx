import React from 'react';

interface AuroraWaveBackgroundProps {
  activeTab: 'home' | 'pack' | 'wonder' | 'binder' | 'tour' | 'quests';
}

export const AuroraWaveBackground: React.FC<AuroraWaveBackgroundProps> = ({
  activeTab,
}) => {
  const palette = {
    home: {
      topLeft: 'rgba(56, 189, 248, 0.22)',
      topRight: 'rgba(255, 79, 163, 0.20)',
      bottom: 'rgba(139, 92, 246, 0.22)',
    },
    pack: {
      topLeft: 'rgba(251, 191, 36, 0.22)',
      topRight: 'rgba(255, 79, 163, 0.25)',
      bottom: 'rgba(56, 189, 248, 0.20)',
    },
    wonder: {
      topLeft: 'rgba(168, 85, 247, 0.24)',
      topRight: 'rgba(56, 189, 248, 0.22)',
      bottom: 'rgba(255, 79, 163, 0.18)',
    },
    binder: {
      topLeft: 'rgba(56, 189, 248, 0.20)',
      topRight: 'rgba(139, 92, 246, 0.20)',
      bottom: 'rgba(16, 185, 129, 0.15)',
    },
    tour: {
      topLeft: 'rgba(244, 63, 94, 0.20)',
      topRight: 'rgba(168, 85, 247, 0.22)',
      bottom: 'rgba(56, 189, 248, 0.20)',
    },
    quests: {
      topLeft: 'rgba(16, 185, 129, 0.20)',
      topRight: 'rgba(56, 189, 248, 0.22)',
      bottom: 'rgba(139, 92, 246, 0.18)',
    },
  }[activeTab];

  return (
    <div
      data-testid="aurora-wave-background"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#060913]"
    >
      {/* Base Deep Midnight Studio Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(165deg, #070B18 0%, #0A1024 48%, #060812 100%)',
        }}
      />

      {/* Flowing Aurora Ribbon 1 (Top-Left to Center Sky/Cyan Wave) */}
      <div
        className="aurora-wave-layer-1 absolute -top-[22%] -left-[12%] w-[78vw] h-[65vh] rounded-full opacity-90 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${palette.topLeft} 0%, rgba(56, 189, 248, 0.06) 48%, transparent 72%)`,
        }}
      />

      {/* Flowing Aurora Ribbon 2 (Top-Right Rose/Violet Wave) */}
      <div
        className="aurora-wave-layer-2 absolute -top-[15%] -right-[14%] w-[74vw] h-[68vh] rounded-full opacity-90 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${palette.topRight} 0%, rgba(168, 85, 247, 0.07) 50%, transparent 74%)`,
        }}
      />

      {/* Flowing Aurora Wave Crest (Diagonal Silk Wave Ribbon) */}
      <div
        className="aurora-wave-layer-3 absolute bottom-[-24%] left-[8%] w-[84vw] h-[66vh] rounded-full opacity-85 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${palette.bottom} 0%, rgba(56, 189, 248, 0.05) 52%, transparent 75%)`,
        }}
      />

      {/* Subtle Pokémon TCG Pocket Clean Studio Grid Mesh */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* Soft Top Iridescent Horizon Line */}
      <div
        className="absolute top-0 inset-x-0 h-[2px] opacity-60"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, #38BDF8 25%, #FF4FA3 50%, #FBBF24 75%, transparent 100%)',
        }}
      />
    </div>
  );
};
