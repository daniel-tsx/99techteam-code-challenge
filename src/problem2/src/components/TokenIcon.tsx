import { useState } from 'react';
import { tokenIconUrl } from '../lib/prices';
import styles from './TokenIcon.module.css';

type Props = {
  symbol: string;
  size?: number;
};

/**
 * The icon repo does not cover every symbol the feed can return, so a missing
 * image degrades to a monogram of the same size instead of a broken image.
 */
export function TokenIcon({ symbol, size = 26 }: Props) {
  const [missing, setMissing] = useState<string | null>(null);
  const failed = missing === symbol;

  return (
    <span className={styles.icon} style={{ width: size, height: size }} aria-hidden="true">
      {failed ? (
        <span className={styles.monogram}>{symbol.slice(0, 1).toUpperCase()}</span>
      ) : (
        <img
          src={tokenIconUrl(symbol)}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          onError={() => setMissing(symbol)}
        />
      )}
    </span>
  );
}
