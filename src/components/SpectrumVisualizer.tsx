import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface SpectrumVisualizerProps {
  active?: boolean;
  barCount?: number;
  color?: string;
  height?: number;
  intensity?: number;
}

export const SpectrumVisualizer = ({
  active = true,
  barCount = 20,
  color = '#39ff14',
  height = 60,
  intensity = 1,
}: SpectrumVisualizerProps) => {
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 0.2)
  );

  const smoothedBars = useMemo(() => {
    return bars;
  }, [bars]);

  useEffect(() => {
    if (!active) {
      setBars(Array.from({ length: barCount }, () => 0.2));
      return;
    }

    const animateBars = () => {
      setBars((prev) =>
        prev.map(() => {
          const baseHeight = 0.3 + Math.random() * 0.7;
          return Math.min(1, baseHeight * intensity);
        })
      );
    };

    const interval = setInterval(animateBars, 150);
    return () => clearInterval(interval);
  }, [active, barCount, intensity]);

  return (
    <div
      className="flex items-end justify-center gap-1 h-full"
      style={{ height }}
    >
      {smoothedBars.map((height, index) => (
        <motion.div
          key={index}
          className="w-2 rounded-t"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
            height: '20%',
          }}
          animate={{
            height: `${height * 100}%`,
          }}
          transition={{
            duration: 0.15,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};
