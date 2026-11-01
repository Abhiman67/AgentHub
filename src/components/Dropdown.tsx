"use client";
import { useEffect, useId, useRef, useState } from "react";

export type DropdownOption = {
  value: string;
  label: string;
  /** Optional category dot color (design.md category tokens). */
  dot?: string;
};

type DropdownProps = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  label: string;
  className?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Design.md foundation Select: Card surface, Line border, 10px radius,
 * ink check on the selected item. Full keyboard support (listbox pattern).
 */
export default function Dropdown({ value, options, onChange, label, className = "", actionLabel, onAction }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((o) => o.value === value))
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open ]);

  function openMenu() {
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(v: string) {
    onChange(v);
    setOpen(false);
    btnRef.current?.focus();
  }

  function onBtnKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu();
    }
  }

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(options[activeIndex].value);
    } else if (e.key === "Tab") {
      if (!actionLabel) setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={`dropdown ${className}`}>
      <button
        ref={btnRef}
        type="button"
        className="dropdown-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onBtnKey}
      >
        <span className="dropdown-value">
          {selected?.dot && (
            <span className="dropdown-dot" style={{ background: selected.dot }} aria-hidden="true" />
          )}
          {selected?.label}
        </span>
        <span className={`dropdown-chevron${open ? " open" : ""}`} aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="dropdown-menu">
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            className="dropdown-options"
            onKeyDown={onListKey}
            ref={(el) => el?.focus()}
          >
            {options.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`dropdown-item${isSelected ? " selected" : ""}${i === activeIndex ? " focused" : ""}`}
                  onClick={() => choose(o.value)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  {o.dot && (
                    <span className="dropdown-dot" style={{ background: o.dot }} aria-hidden="true" />
                  )}
                  <span className="dropdown-item-label">{o.label}</span>
                  {isSelected && (
                    <span className="dropdown-check" aria-hidden="true">✓</span>
                  )}
                </li>
              );
            })}
          </ul>
          {actionLabel && onAction && (
            <button
              type="button"
              className="dropdown-create-action"
              onClick={() => { setOpen(false); onAction(); }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setOpen(false);
                  btnRef.current?.focus();
                } else if (e.key === "Tab") {
                  setOpen(false);
                }
              }}
            >
              <span aria-hidden="true">＋</span> {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
