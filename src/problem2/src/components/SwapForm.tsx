import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Token } from '../types';
import { fetchTokens } from '../lib/prices';
import {
  AMOUNT_PATTERN,
  MAX_AMOUNT,
  formatQuoteDate,
  formatTokenAmount,
  formatUsd,
} from '../lib/format';
import { TokenIcon } from './TokenIcon';
import { TokenSelect } from './TokenSelect';
import styles from './SwapForm.module.css';

/** Stands in for a backend round trip. */
const SUBMIT_DELAY_MS = 1200;

const DEFAULT_PAY = 'ETH';
const DEFAULT_RECEIVE = 'USDC';

const NO_TOKENS: Token[] = [];

type Feed =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; tokens: Token[] };

type Submission = 'idle' | 'pending' | 'done';

export function SwapForm() {
  const [feed, setFeed] = useState<Feed>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [refetching, setRefetching] = useState(false);

  const [paySymbol, setPaySymbol] = useState(DEFAULT_PAY);
  const [receiveSymbol, setReceiveSymbol] = useState(DEFAULT_RECEIVE);
  const [amount, setAmount] = useState('');
  const [touched, setTouched] = useState(false);
  const [submission, setSubmission] = useState<Submission>('idle');

  /** Confirms a manual refresh landed; a new object each time so repeats restart the timer. */
  const [notice, setNotice] = useState<{ key: number; changed: boolean } | null>(null);

  const amountRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLButtonElement>(null);
  const returningToForm = useRef(false);
  const lastQuote = useRef('');

  useEffect(() => {
    const controller = new AbortController();
    // Only fall back to skeletons when there is nothing to show; refreshing over
    // existing rates keeps the form on screen and usable.
    setFeed((current) => (current.status === 'error' ? { status: 'loading' } : current));
    setRefetching(true);

    fetchTokens(controller.signal)
      .then((tokens) => {
        if (tokens.length < 2) throw new Error('The price feed returned no tradable tokens.');
        const quote = latestQuote(tokens);
        // Only a deliberate press gets a confirmation; the first load has nothing to confirm.
        if (reloadKey > 0) setNotice({ key: reloadKey, changed: quote !== lastQuote.current });
        lastQuote.current = quote;
        setFeed({ status: 'ready', tokens });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setFeed({
          status: 'error',
          message: error instanceof Error ? error.message : 'Could not load token prices.',
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setRefetching(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  // The selected symbols are the only stored selection state; the tokens they
  // point at — and everything downstream — are derived.
  const tokens = feed.status === 'ready' ? feed.tokens : NO_TOKENS;
  const [payToken, receiveToken] = useMemo(
    () => resolvePair(tokens, paySymbol, receiveSymbol),
    [tokens, paySymbol, receiveSymbol],
  );

  const amountValue = Number(amount);
  const hasAmount = amount !== '' && amount !== '.';
  const amountError = !hasAmount
    ? 'Enter an amount to swap.'
    : !Number.isFinite(amountValue) || amountValue <= 0
      ? 'Enter an amount greater than zero.'
      : amountValue > MAX_AMOUNT
        ? `Enter ${formatTokenAmount(MAX_AMOUNT)} or less.`
        : null;

  const rate = payToken && receiveToken ? payToken.price / receiveToken.price : null;
  const isAmountUsable = hasAmount && Number.isFinite(amountValue) && amountValue > 0;
  const receiveAmount = rate !== null && isAmountUsable ? amountValue * rate : null;
  const payValueUsd = payToken && isAmountUsable ? amountValue * payToken.price : null;

  const quotedAt = useMemo(() => latestQuote(tokens), [tokens]);

  // `!refetching` is the other half of the Refresh button's `disabled={isBusy}`: a swap
  // and a price refresh can never overlap, so the rate cannot move mid-submission.
  const canSubmit =
    feed.status === 'ready' &&
    !refetching &&
    payToken !== null &&
    receiveToken !== null &&
    amountError === null &&
    submission === 'idle';
  const showError = touched && amountError !== null;

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  // Focus moves after the render that toggles `inert`; focusing an inert field is a no-op.
  useEffect(() => {
    if (submission === 'done') {
      successRef.current?.focus();
    } else if (returningToForm.current) {
      returningToForm.current = false;
      amountRef.current?.focus();
    }
  }, [submission]);

  function handleAmountChange(next: string) {
    if (AMOUNT_PATTERN.test(next)) setAmount(next);
  }

  // Choosing the currency already on the other side swaps the two rather than
  // rejecting the choice, so both sides can never hold the same currency.
  function selectPay(symbol: string) {
    if (payToken && symbol === receiveToken?.symbol) setReceiveSymbol(payToken.symbol);
    setPaySymbol(symbol);
  }

  function selectReceive(symbol: string) {
    if (receiveToken && symbol === payToken?.symbol) setPaySymbol(receiveToken.symbol);
    setReceiveSymbol(symbol);
  }

  function swapSides() {
    if (!payToken || !receiveToken) return;
    setPaySymbol(receiveToken.symbol);
    setReceiveSymbol(payToken.symbol);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    setSubmission('pending');
    await new Promise((resolve) => setTimeout(resolve, SUBMIT_DELAY_MS));
    setSubmission('done');
  }

  function reset() {
    returningToForm.current = true;
    setSubmission('idle');
    setAmount('');
    setTouched(false);
  }

  const isBusy = submission !== 'idle';
  const isDone = submission === 'done';

  return (
    <div className={styles.card}>
      <form className={styles.form} onSubmit={handleSubmit} inert={isDone} noValidate>
        <div className={styles.panels}>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <label className={styles.panelLabel} htmlFor="pay-amount">
                You pay
              </label>
              <span className={styles.panelMeta}>
                {payValueUsd !== null ? `≈ ${formatUsd(payValueUsd)}` : ''}
              </span>
            </div>
            <div className={styles.panelBody}>
              <input
                ref={amountRef}
                id="pay-amount"
                className={styles.value}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={amount}
                disabled={feed.status !== 'ready' || isBusy}
                aria-invalid={showError}
                aria-describedby={showError ? 'amount-error' : undefined}
                onChange={(event) => handleAmountChange(event.target.value)}
                onBlur={() => {
                  if (amount !== '') setTouched(true);
                }}
              />
              {payToken ? (
                <TokenSelect
                  label="You pay"
                  tokens={tokens}
                  value={payToken}
                  pairedSymbol={receiveToken?.symbol ?? ''}
                  disabled={isBusy}
                  onSelect={selectPay}
                />
              ) : (
                <TokenSelectSkeleton />
              )}
            </div>
          </div>

          <button
            type="button"
            className={styles.swapButton}
            onClick={swapSides}
            disabled={feed.status !== 'ready' || isBusy}
            aria-label={
              payToken && receiveToken
                ? `Swap direction to pay ${receiveToken.symbol} and receive ${payToken.symbol}`
                : 'Swap direction'
            }
          >
            <SwapIcon />
          </button>

          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span className={styles.panelLabel} id="receive-label">
                You receive
              </span>
              <span className={styles.panelMeta}>
                {payValueUsd !== null ? `≈ ${formatUsd(payValueUsd)}` : ''}
              </span>
            </div>
            <div className={styles.panelBody}>
              <output
                className={`${styles.value} ${receiveAmount === null ? styles.valueEmpty : ''}`}
                htmlFor="pay-amount"
                aria-labelledby="receive-label"
              >
                {receiveAmount !== null ? formatTokenAmount(receiveAmount) : '0.00'}
              </output>
              {receiveToken ? (
                <TokenSelect
                  label="You receive"
                  tokens={tokens}
                  value={receiveToken}
                  pairedSymbol={payToken?.symbol ?? ''}
                  disabled={isBusy}
                  onSelect={selectReceive}
                />
              ) : (
                <TokenSelectSkeleton />
              )}
            </div>
          </div>
        </div>

        <p className={styles.errorRow} id="amount-error" role="alert">
          {showError ? amountError : ''}
        </p>

        <dl className={styles.details}>
          <div className={styles.detailRow}>
            <dt>Rate</dt>
            <dd role="status">
              {payToken && receiveToken && rate !== null
                ? `1 ${payToken.symbol} = ${formatTokenAmount(rate)} ${receiveToken.symbol}`
                : '—'}
            </dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Quoted</dt>
            <dd>
              {feed.status === 'ready' ? formatQuoteDate(quotedAt) : '—'}
              <button
                type="button"
                className={styles.refresh}
                // Stays focusable while busy so a keyboard press does not drop focus to the body.
                disabled={isBusy}
                aria-disabled={refetching}
                aria-busy={refetching}
                onClick={() => {
                  if (!refetching) setReloadKey((key) => key + 1);
                }}
              >
                <RefreshIcon spinning={refetching} />
                Refresh
              </button>
            </dd>
          </div>
        </dl>

        {feed.status === 'error' ? (
          <div className={styles.feedError} role="alert">
            <p>{feed.message}</p>
            <button type="button" className={styles.retry} onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </button>
          </div>
        ) : (
          <button type="submit" className={styles.submit} disabled={!canSubmit}>
            {submission === 'pending' ? (
              <>
                <Spinner />
                Swapping…
              </>
            ) : feed.status === 'loading' ? (
              'Loading prices…'
            ) : refetching ? (
              'Updating rates…'
            ) : hasAmount ? (
              'Confirm Swap'
            ) : (
              'Enter an amount'
            )}
          </button>
        )}
      </form>

      {isDone && payToken && receiveToken && (
        <div className={styles.success}>
          <span className={styles.successMark} aria-hidden="true">
            <CheckIcon />
          </span>
          <h2 className={styles.successTitle} id="success-title">
            Swap submitted
          </h2>
          <p className={styles.successPair} id="success-detail">
            <TokenIcon symbol={payToken.symbol} size={22} />
            {formatTokenAmount(amountValue)} {payToken.symbol}
            <span aria-hidden="true" className={styles.successArrow}>
              →
            </span>
            <span className={styles.visuallyHidden}>for</span>
            <TokenIcon symbol={receiveToken.symbol} size={22} />
            {receiveAmount !== null ? formatTokenAmount(receiveAmount) : ''} {receiveToken.symbol}
          </p>
          {/* Focus lands here when the panel opens, so it carries the outcome with it. */}
          <button
            ref={successRef}
            type="button"
            className={styles.successAction}
            aria-describedby="success-title success-detail"
            onClick={reset}
          >
            Make another swap
          </button>
        </div>
      )}

      {/* Always mounted so the live region announces on insert, and its height is
          reserved so a confirmation can never move the card. */}
      <div className={styles.noticeSlot} role="status" aria-live="polite">
        {notice && (
          <span className={styles.notice}>
            <span className={styles.noticeMark} aria-hidden="true">
              <CheckIcon size={13} />
            </span>
            {notice.changed ? 'Rates updated' : 'Rates refreshed · no change'}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Falls back through: the current selection, the preferred default, then the
 * first token that keeps both sides different — so the two sides can never
 * hold the same currency.
 */
function latestQuote(tokens: Token[]): string {
  return tokens.reduce((latest, token) => (token.quotedAt > latest ? token.quotedAt : latest), '');
}

function resolvePair(tokens: Token[], pay: string, receive: string): [Token | null, Token | null] {
  if (tokens.length < 2) return [null, null];

  const find = (symbol: string) => tokens.find((token) => token.symbol === symbol) ?? null;
  const payToken = find(pay) ?? find(DEFAULT_PAY) ?? tokens[0];
  const other = (token: Token | null) => (token && token !== payToken ? token : null);
  const receiveToken =
    other(find(receive)) ??
    other(find(DEFAULT_RECEIVE)) ??
    tokens.find((token) => token !== payToken)!;

  return [payToken, receiveToken];
}

function TokenSelectSkeleton() {
  return <span className={styles.selectSkeleton} aria-hidden="true" />;
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d="M5 2.5v11m0 0L2.5 11M5 13.5 7.5 11M11 13.5v-11m0 0L8.5 5M11 2.5 13.5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Always visible, so the button keeps its shape; it only spins while refetching. */
function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={styles.refreshIcon}
      data-spinning={spinning}
      viewBox="0 0 24 24"
      width="12"
      height="12"
      aria-hidden="true"
    >
      <path
        d="M21 12a9 9 0 1 1-9-9c2.5 0 4.9 1 6.7 2.7L21 8M21 3v5h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return <span className={styles.spinner} aria-hidden="true" />;
}
