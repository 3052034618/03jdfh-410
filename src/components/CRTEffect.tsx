import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CRTEffectProps {
  enabled?: boolean;
  showScanlines?: boolean;
  showNoise?: boolean;
  showVignette?: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export const CRTEffect = ({
  enabled = true,
  showScanlines = true,
  showNoise = true,
  showVignette = true,
  intensity = 'medium',
}: CRTEffectProps) => {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.9) {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 150);
      }
    }, 5000);

    return () => clearInterval(glitchInterval);
  }, [enabled]);

  const opacityMap = {
    low: 0.1,
    medium: 0.2,
    high: 0.35,
  };

  const noiseOpacityMap = {
    low: 0.03,
    medium: 0.06,
    high: 0.1,
  };

  if (!enabled) return null;

  return (
    <AnimatePresence>
      <div className="crt-overlay pointer-events-none fixed inset-0 z-50">
        {showVignette && (
          <div
            className="absolute inset-0 vignette"
            style={{ opacity: opacityMap[intensity] + 0.2 }}
          />
        )}
        
        {showScanlines && (
          <div
            className="absolute inset-0 crt-scanlines"
            style={{ opacity: opacityMap[intensity] }}
          />
        )}
        
        {showNoise && (
          <div
            className="absolute inset-0 noise-overlay"
            style={{ opacity: noiseOpacityMap[intensity] }}
          />
        )}
        
        <AnimatePresence>
          {glitching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.05 }}
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, rgba(255,0,0,0.1) 0%, rgba(0,255,0,0.1) 50%, rgba(0,0,255,0.1) 100%)',
                mixBlendMode: 'screen',
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
