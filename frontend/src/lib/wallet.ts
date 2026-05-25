// Wallet Detection and Connection
export async function detectAndConnectWallet(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    // Check for MetaMask or compatible wallet
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      console.log('No Web3 wallet detected');
      return null;
    }

    // Request account access
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    });

    return accounts[0];
  } catch (error) {
    console.error('Wallet connection error:', error);
    return null;
  }
}

// Get Connected Wallet
export function getConnectedWallet(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const ethereum = (window as any).ethereum;
    if (!ethereum || !ethereum.selectedAddress) return null;
    return ethereum.selectedAddress;
  } catch {
    return null;
  }
}

// Switch Network (Base chain)
export async function switchToBaseNetwork(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return false;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }], // Base mainnet
      });
      return true;
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x2105',
              chainName: 'Base',
              rpcUrls: ['https://mainnet.base.org'],
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: ['https://basescan.org'],
            },
          ],
        });
        return true;
      }
      throw switchError;
    }
  } catch (error) {
    console.error('Network switch error:', error);
    return false;
  }
}

// Listen for Account Changes
export function onAccountChanged(callback: (account: string | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const ethereum = (window as any).ethereum;
  if (!ethereum) return () => {};

  ethereum.on('accountsChanged', (accounts: string[]) => {
    callback(accounts[0] || null);
  });

  return () => {
    ethereum.removeListener('accountsChanged', callback);
  };
}

// Listen for Chain Changes
export function onChainChanged(callback: (chainId: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const ethereum = (window as any).ethereum;
  if (!ethereum) return () => {};

  ethereum.on('chainChanged', callback);

  return () => {
    ethereum.removeListener('chainChanged', callback);
  };
}

// Format Wallet Address
export function formatWalletAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Validate Address Format
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
