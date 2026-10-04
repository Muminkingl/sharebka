'use client';

import {
  useState,
  useRef,
  useEffect,
  type FC,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { BiSolidPencil } from 'react-icons/bi';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableChipProps {
  defaultLabel?: string;
  showThemeToggle?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  inputClassName?: string;
}

export const EditableChip: FC<EditableChipProps> = ({
  defaultLabel = 'This device',
  onChange,
  className,
  inputClassName,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState<string>(defaultLabel);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLabel(defaultLabel);
  }, [defaultLabel]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isEditing]);

  const handleSave = (e?: MouseEvent | KeyboardEvent) => {
    e?.stopPropagation();
    const finalValue = label.trim() === '' ? 'Untitled' : label;
    setLabel(finalValue);
    setIsEditing(false);
    onChange?.(finalValue);
  };

  const handleEdit = (e: MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  return (
    <motion.div layout className="inline-flex">
      <div
        onClick={() => !isEditing && setIsEditing(true)}
        className={cn(
          "group relative inline-flex cursor-pointer items-center justify-between gap-2 overflow-hidden rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1 backdrop-blur-md transition-all duration-200 select-none hover:bg-white/[0.12] hover:border-white/25 shadow-sm",
          isEditing && "ring-2 ring-blue-500/50 border-blue-400/60 bg-blue-950/40 shadow-blue-500/20 shadow-md",
          className
        )}
      >
        <motion.input
          layout="position"
          key="input"
          ref={inputRef}
          type="text"
          value={label}
          readOnly={!isEditing}
          style={{ width: `${Math.max(9, Math.min(label.length + 1, 28))}ch` }}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleSave(e);
            if (e.key === 'Escape') {
              setLabel(defaultLabel);
              setIsEditing(false);
            }
          }}
          onBlur={() => isEditing && handleSave()}
          onClick={(e: MouseEvent) => isEditing && e.stopPropagation()}
          className={cn(
            "border-none bg-transparent text-sm md:text-base font-semibold text-white outline-none selection:bg-blue-500/40 cursor-pointer placeholder:text-zinc-500",
            isEditing && "cursor-text",
            inputClassName
          )}
        />

        <AnimatePresence mode="popLayout" initial={false}>
          {isEditing ? (
            <motion.button
              key="done"
              type="button"
              title="Save device name"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              layout="position"
              onClick={(e) => handleSave(e)}
              transition={{
                type: 'spring',
                bounce: 0.2,
                duration: 0.3,
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm hover:bg-blue-400 active:scale-95 transition-transform"
            >
              <Check size={14} strokeWidth={2.5} />
            </motion.button>
          ) : (
            <motion.button
              key="edit"
              type="button"
              title="Edit device name"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              layout="position"
              onClick={handleEdit}
              transition={{
                type: 'spring',
                bounce: 0.2,
                duration: 0.3,
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-zinc-300 hover:bg-white/20 hover:text-white transition-colors"
            >
              <BiSolidPencil size={13} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

