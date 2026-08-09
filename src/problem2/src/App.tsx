import { SwapForm } from './components/SwapForm';
import styles from './App.module.css';

export function App() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.masthead}>
          <p className={styles.eyebrow}>99Tech · Problem 2</p>
          <h1 className={styles.title}>Currency Swap</h1>
          <p className={styles.subtitle}>
            Indicative rates from the Switcheo price feed. Submitting is simulated — no funds move.
          </p>
        </header>
        <SwapForm />
      </div>
    </main>
  );
}
