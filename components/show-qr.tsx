'use client';

import { X, Link } from 'lucide-react';
import { IoQrCodeOutline } from 'react-icons/io5';
import {
  AnimatePresence,
  motion,
  MotionConfig,
  type Transition,
} from 'motion/react';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import useMeasure from 'react-use-measure';

interface ShowQrProps {
  value: string;
  buttonLabel?: string;
  className?: string;
  onCopy?: () => void;
}

export const ShowQr = ({
  value,
  buttonLabel = 'Show QR Code',
  className,
  onCopy,
}: ShowQrProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [ref, bounds] = useMeasure();

  useEffect(() => {
    if (isCopied) {
      const t = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isCopied]);

  const springConfig: Transition = {
    type: 'spring',
    bounce: 0.2,
    visualDuration: 0.35,
  };

  const collapsedTransition: Transition = {
    type: 'spring',
    bounce: 0.1,
    visualDuration: 0.3,
  };

  return (
    <div className="flex items-center justify-center">
      <MotionConfig
        transition={isExpanded ? springConfig : collapsedTransition}
      >
        <motion.div
          initial={{
            width: 140,
          }}
          animate={{
            width: isExpanded ? 260 : 140,
            height: isExpanded ? bounds.height : 44,
          }}
          className={
            isExpanded
              ? "overflow-hidden rounded-3xl border border-white/20 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl"
              : "overflow-hidden rounded-full border border-white/12 bg-white/[0.07] hover:bg-white/[0.12] hover:border-white/20 backdrop-blur-md transition-colors shadow-sm select-none"
          }
        >
          <div ref={ref}>
            <AnimatePresence mode="popLayout" initial={false}>
              {!isExpanded ? (
                <motion.div
                  key="collapsed"
                  className="flex h-11 cursor-pointer items-center justify-center gap-2 px-4 text-sm font-medium text-zinc-200 hover:text-white"
                  onClick={() => setIsExpanded(true)}
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(4px)' }}
                >
                  <IoQrCodeOutline className="size-4 text-zinc-300" />
                  <span>{buttonLabel}</span>
                </motion.div>
              ) : (
                <motion.div
                  key="expanded"
                  className="flex flex-col items-center gap-3 p-4 text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{
                    opacity: 0,
                    transition: {
                      duration: 0.2,
                      ease: 'easeOut',
                    },
                  }}
                >
                  <div className="flex w-full items-center justify-between px-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Scan to connect</span>
                    <button
                      type="button"
                      aria-label="Close QR Code"
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/10 text-zinc-300 hover:bg-white/20 hover:text-white transition-colors"
                      onClick={() => {
                        setIsExpanded(false);
                        setIsCopied(false);
                      }}
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <motion.div
                    className="flex h-[216px] w-[216px] items-center justify-center rounded-2xl bg-white p-3 shadow-inner"
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                  >
                    <QRCodeSVG
                      value={value}
                      size={192}
                      level="H"
                      fgColor="#000000"
                      bgColor="#ffffff"
                      className="h-full w-full"
                    />
                  </motion.div>

                  <motion.button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 py-2.5 text-sm font-medium text-white hover:bg-white/15 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(value);
                      setIsCopied(true);
                      onCopy?.();
                    }}
                    layout
                  >
                    <Link className="size-4 text-blue-400" />
                    <AnimatedText
                      from="Copy Link"
                      to="Copied!"
                      isCopied={isCopied}
                    />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </MotionConfig>
    </div>
  );
};

const AnimatedText = ({
  from,
  to,
  isCopied,
}: {
  from: string;
  to: string;
  isCopied: boolean;
}) => {
  const activeText = isCopied ? to : from;

  return (
    <div className="flex text-sm font-medium tracking-normal will-change-transform">
      <AnimatePresence mode="popLayout" initial={false}>
        {activeText.split('').map((char, index) => {
          const displayChar = char === ' ' ? '\u00A0' : char;

          return (
            <motion.span
              key={char + index}
              layout
              initial={{ opacity: 0, y: 4, scale: 0.8 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  type: 'spring',
                  stiffness: 240,
                  damping: 22,
                  delay: 0.02 * index,
                },
              }}
              exit={{ opacity: 0, y: -4, scale: 0.8 }}
            >
              {displayChar}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
