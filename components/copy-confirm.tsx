import {
  Boxes,
  CheckIcon,
  CopyIcon,
  Settings2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface SkillCardProps {
  title?: string;
  icon?: ReactNode;
  valueToCopy?: string;

  copiedText?: string;
  copyText?: string;

  showSettings?: boolean;
  showTitle?: boolean;
  loading?: boolean;
  className?: string;

  onSettingsClick?: () => void;
}

export default function CopyConfirm({
  title = 'Clay Skill',
  icon = <Boxes size={16} />,
  valueToCopy = 'Clay Skill',

  copiedText = 'Copied',
  copyText = 'Copy',

  showSettings = false,
  showTitle = true,
  loading = false,
  className,

  onSettingsClick = () => {},
}: SkillCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!valueToCopy) return;
    try {
      await navigator.clipboard.writeText(valueToCopy);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  }

  return (
    <div className="flex h-auto w-auto items-center justify-center">
      <div className="flex items-center gap-2">
        {showTitle && (
          <div className="flex gap-0.5 rounded-full">
            <div className="border border-white/10 flex items-center gap-1.5 rounded-l-full bg-white/5 px-3 py-2 text-zinc-300 backdrop-blur-md">
              <div className="text-zinc-400">{icon}</div>
              <span className="text-sm font-semibold text-zinc-200">
                {title}
              </span>
            </div>

            {showSettings && (
              <button
                onClick={onSettingsClick}
                className="flex items-center justify-center rounded-r-full border border-l-0 border-white/10 bg-white/5 px-3 transition hover:bg-white/10"
              >
                <Settings2 size={18} className="text-zinc-400" />
              </button>
            )}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={loading}
          onClick={handleCopy}
          className={cn(
            "relative flex h-11 items-center justify-center gap-2 overflow-hidden rounded-full border px-4 py-2 text-sm font-medium transition-all backdrop-blur-md cursor-pointer select-none",
            copied
              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/10"
              : "border-white/12 bg-white/[0.07] text-zinc-200 hover:bg-white/[0.12] hover:text-white hover:border-white/20 shadow-sm",
            className
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={copied ? 'check' : 'copy'}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{
                type: 'spring',
                duration: 0.25,
                bounce: 0,
              }}
              className="flex items-center justify-center"
            >
              {copied ? (
                <CheckIcon className="stroke-2 size-4 text-emerald-400" />
              ) : (
                <CopyIcon className="stroke-2 size-4 text-zinc-300" />
              )}
            </motion.div>
          </AnimatePresence>
          <AnimatedText from={copyText} to={copiedText} isCopied={copied} />
        </motion.button>
      </div>
    </div>
  );
}

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
