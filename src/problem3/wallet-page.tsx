interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain;
}

type Blockchain =
  | 'Osmosis'
  | 'Ethereum'
  | 'Arbitrum'
  | 'Zilliqa'
  | 'Neo';

type Props = BoxProps;

const BLOCKCHAIN_PRIORITY: Record<Blockchain, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const WalletPage = (props: Props) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  const sortedBalances = useMemo(
    () =>
      balances
        .filter(
          (balance: WalletBalance) =>
            balance.amount > 0 &&
            BLOCKCHAIN_PRIORITY[balance.blockchain] !== undefined,
        )
        .sort(
          (a: WalletBalance, b: WalletBalance) =>
            BLOCKCHAIN_PRIORITY[b.blockchain] -
            BLOCKCHAIN_PRIORITY[a.blockchain],
        ),
    [balances],
  );

  const rows = sortedBalances.map((balance: WalletBalance) => {
    const usdValue = prices[balance.currency] * balance.amount;
    const formattedAmount = balance.amount.toFixed(6);

    return (
      <WalletRow
        key={`${balance.blockchain}-${balance.currency}`}
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={formattedAmount}
      />
    );
  });

  return <Box {...props}>{rows}</Box>;
};