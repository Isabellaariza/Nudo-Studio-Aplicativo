import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({
  text,
  children,
  position = 'top',
}: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const isTop = position === 'top';

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'fit-content',
        height: 'fit-content',
        flexShrink: 0,
      }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{
              opacity: 0,
              x: '-50%',
              y: isTop ? 4 : -4,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              x: '-50%',
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              x: '-50%',
              y: isTop ? 4 : -4,
              scale: 0.95,
            }}
            transition={{
              duration: 0.12,
            }}
            style={{
              position: 'absolute',
              [isTop ? 'bottom' : 'top']: 'calc(100% + 7px)',
              left: '50%',

              // IMPORTANTE:
              // NO poner transform aquí.
              // Motion controla x/y/scale.

              background: 'rgba(24,24,24,0.93)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 500,
              padding: '5px 10px',
              borderRadius: '8px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 9999,
              backdropFilter: 'blur(4px)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              letterSpacing: '0.01em',
              lineHeight: 1.4,
              textAlign: 'center',
            }}
          >
            {text}

            {/* Flecha */}
            <span
              style={{
                position: 'absolute',
                [isTop ? 'top' : 'bottom']: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                [isTop ? 'borderBottom' : 'borderTop']:
                  '5px solid rgba(24,24,24,0.93)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}