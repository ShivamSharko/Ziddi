"use client";

import { useEffect, useRef, useState } from "react";

export interface ComboOption {
  value: string;
  hint?: string;
}

interface ComboInputProps {
  options: ReadonlyArray<ComboOption>;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

export function ComboInput({ options, value, onChange, placeholder }: ComboInputProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = options
    .filter((o) => o.value.toLowerCase().includes(value.trim().toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current !== null && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={wrapRef} className="relative flex-1">
      <input
        className="field-underline"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "ArrowDown") setHighlight((h) => Math.min(h + 1, filtered.length - 1));
          if (e.key === "ArrowUp") setHighlight((h) => Math.max(h - 1, 0));
          if (e.key === "Enter" && open && filtered[highlight] !== undefined) {
            e.preventDefault();
            onChange(filtered[highlight].value);
            setOpen(false);
          }
        }}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto border border-[var(--hairline)] bg-[var(--ink-3)]">
          {filtered.map((o, i) => (
            <li key={o.value}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                  i === highlight
                    ? "bg-[var(--ink-2)] text-[var(--text)]"
                    : "text-[var(--text-2)] hover:bg-[var(--ink-2)]"
                }`}
              >
                <span>{o.value}</span>
                {o.hint !== undefined && (
                  <span className="font-mono-data text-[10px] text-[var(--signal)]">{o.hint}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

