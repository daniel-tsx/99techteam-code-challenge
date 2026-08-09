import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Token } from '../types';
import { formatUsd } from '../lib/format';
import { TokenIcon } from './TokenIcon';
import styles from './TokenSelect.module.css';

type Props = {
  /** Names the control for assistive tech, e.g. "You pay". */
  label: string;
  tokens: Token[];
  value: Token;
  /** The token selected on the other side of the swap; shown as already in use. */
  pairedSymbol: string;
  disabled?: boolean;
  onSelect: (symbol: string) => void;
};

export function TokenSelect({ label, tokens, value, pairedSymbol, disabled, onSelect }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? tokens.filter((token) => token.symbol.toLowerCase().includes(needle)) : tokens;
  }, [tokens, query]);

  // A disabled select can never be open. The parent disables it mid-flow — while a
  // swap is submitting — and the popover's search and options must not outlive that.
  const isOpen = open && !disabled;

  useEffect(() => {
    if (isOpen) {
      searchRef.current?.focus();
    } else if (open) {
      // Closed by `disabled` rather than by the user: drop the stale flag so the
      // popover cannot spring back when the control is enabled again.
      setOpen(false);
    }
  }, [isOpen, open]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, activeIndex, matches]);

  function openMenu() {
    setQuery('');
    setActiveIndex(Math.max(0, tokens.indexOf(value)));
    setOpen(true);
  }

  function closeMenu(returnFocus = true) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function choose(token: Token) {
    onSelect(token.symbol);
    closeMenu();
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        closeMenu();
        break;
      case 'Tab':
        setOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => (matches.length ? (index + 1) % matches.length : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => (matches.length ? (index - 1 + matches.length) % matches.length : 0));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(Math.max(0, matches.length - 1));
        break;
      case 'Enter': {
        event.preventDefault();
        const token = matches[activeIndex];
        if (token) choose(token);
        break;
      }
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label} token: ${value.symbol}. Change token`}
        onClick={() => (isOpen ? closeMenu(false) : openMenu())}
        onKeyDown={(event) => {
          if (!isOpen && event.key === 'ArrowDown') {
            event.preventDefault();
            openMenu();
          }
        }}
      >
        <TokenIcon symbol={value.symbol} size={24} />
        <span className={styles.triggerSymbol}>{value.symbol}</span>
        <Chevron />
      </button>

      {isOpen && (
        <div className={styles.popover}>
          <input
            ref={searchRef}
            type="text"
            className={styles.search}
            value={query}
            placeholder="Search token"
            autoComplete="off"
            role="combobox"
            aria-expanded={true}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={matches.length ? `${id}-option-${activeIndex}` : undefined}
            aria-label={`Search ${label} token`}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
          />

          <ul id={`${id}-list`} ref={listRef} className={styles.list} role="listbox" aria-label={label}>
            {matches.map((token, index) => (
              <li
                key={token.symbol}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={token.symbol === value.symbol}
                data-active={index === activeIndex}
                className={styles.option}
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => choose(token)}
              >
                <TokenIcon symbol={token.symbol} size={26} />
                <span className={styles.optionSymbol}>{token.symbol}</span>
                {token.symbol === pairedSymbol && <span className={styles.optionTag}>in use</span>}
                <span className={styles.optionPrice}>{formatUsd(token.price)}</span>
              </li>
            ))}
          </ul>

          {matches.length === 0 && <p className={styles.empty}>No token matches “{query.trim()}”.</p>}
        </div>
      )}
    </div>
  );
}

function Chevron() {
  return (
    <svg className={styles.chevron} viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M4 6.5 8 10.5 12 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
