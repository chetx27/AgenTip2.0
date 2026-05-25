export async function getBestYieldStrategy(amount: number, wallet?: string) {
  if (amount <= 0) return null;
  return {
    protocol: 'Aave v3',
    apy: parseFloat((8 + Math.random() * 6).toFixed(1))
  };
}
