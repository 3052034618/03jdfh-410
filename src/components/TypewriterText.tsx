import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  className?: string;
  showCursor?: boolean;
  cursorColor?: string;
}

export const TypewriterText = ({
  text,
  speed = 30,
  delay = 0,
  onComplete,
  className = '',
  showCursor = true,
  cursorColor = '#39ff14',
}: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDisplayedText('');
    indexRef.current = 0;
    setIsComplete(false);

    const startTimeout = setTimeout(() => {
      const typeNextChar = () => {
        if (indexRef.current < text.length) {
          setDisplayedText(text.slice(0, indexRef.current + 1));
          indexRef.current++;
          timeoutRef.current = setTimeout(typeNextChar, speed);
        } else {
          setIsComplete(true);
          onComplete?.();
        }
      };
      typeNextChar();
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, delay, onComplete]);

  const skipToEnd = () => {
    setDisplayedText(text);
    setIsComplete(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onComplete?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative ${className}`}
      onClick={skipToEnd}
    >
      <span className="whitespace-pre-wrap">
        {displayedText}
        {showCursor && !isComplete && (
          <span
            className="inline-block w-0.5 h-5 ml-0.5 align-middle animate-blink"
            style={{ backgroundColor: cursorColor }}
          />
        )}
      </span>
      
      {!isComplete && (
        <span className="absolute right-0 top-0 text-xs text-gray-500 font-terminal cursor-pointer hover:text-horror-neonGreen transition-colors ml-4">
          [点击跳过]
        </span>
      )}
    </motion.div>
  );
};
