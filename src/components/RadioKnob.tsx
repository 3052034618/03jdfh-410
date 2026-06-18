import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface RadioKnobProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showValue?: boolean;
  glowColor?: string;
  disabled?: boolean;
}

export const RadioKnob = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  size = 'md',
  label,
  showValue = true,
  glowColor = '#39ff14',
  disabled = false,
}: RadioKnobProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const sizeMap = {
    sm: { knob: 'w-12 h-12', indicator: 'top-2' },
    md: { knob: 'w-16 h-16', indicator: 'top-3' },
    lg: { knob: 'w-24 h-24', indicator: 'top-4' },
  };

  const rotationRange = 270;
  const startAngle = -135;
  const percentage = ((value - min) / (max - min)) * 100;
  const rotation = startAngle + (percentage / 100) * rotationRange;

  const handleMove = useCallback(
    (clientY: number) => {
      if (!isDragging || disabled) return;
      
      const deltaY = startYRef.current - clientY;
      const sensitivity = (max - min) / 200;
      let newValue = startValueRef.current + deltaY * sensitivity;
      
      newValue = Math.round(newValue / step) * step;
      newValue = Math.max(min, Math.min(max, newValue));
      
      onChange?.(newValue);
    },
    [isDragging, disabled, min, max, step, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handleMove(e.clientY);
    },
    [handleMove]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      handleMove(e.touches[0].clientY);
    },
    [handleMove]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    startValueRef.current = value;
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="font-terminal text-xs text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      )}
      
      <div
        ref={knobRef}
        className={`radio-knob relative ${sizeMap[size].knob} rounded-full cursor-pointer select-none transition-transform duration-100 ${
          isDragging ? 'scale-105' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div
          className={`absolute left-1/2 -translate-x-1/2 ${sizeMap[size].indicator} w-1 h-4 rounded-full`}
          style={{
            backgroundColor: glowColor,
            boxShadow: `0 0 8px ${glowColor}, 0 0 16px ${glowColor}`,
          }}
        />
        
        {isDragging && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `0 0 20px ${glowColor}, inset 0 0 20px ${glowColor}33`,
            }}
          />
        )}
      </div>
      
      {showValue && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-terminal text-lg font-bold"
          style={{ color: glowColor, textShadow: `0 0 10px ${glowColor}` }}
        >
          {value}
        </motion.div>
      )}
    </div>
  );
};
