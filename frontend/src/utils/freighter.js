/**
 * Interface with Freighter extension browser wallet
 */

const USE_MOCK = import.meta.env.NEXT_PUBLIC_USE_CONTRACT_MOCK === 'true' || true;

export async function isFreighterInstalled() {
  if (USE_MOCK) return true;
  return typeof window !== 'undefined' && window.stellarPubnet !== undefined;
}

export async function getFreighterPublicKey() {
  if (USE_MOCK) {
    return 'GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH';
  }
  
  try {
    const { getPublicKey } = await import('@stellar/freighter-api');
    return await getPublicKey();
  } catch (error) {
    console.warn("Freighter API missing, simulating mock address.");
    return 'GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH';
  }
}

export async function signTransactionWithFreighter(xdr) {
  if (USE_MOCK) {
    console.log("[CONTRACT MOCK] Signed XDR transaction hash:", xdr);
    return 'MOCK_SIGNED_TRANSACTION_XDR_PAYLOAD';
  }

  try {
    const { signTransaction } = await import('@stellar/freighter-api');
    return await signTransaction(xdr);
  } catch (error) {
    throw new Error('Freighter wallet signing declined or failed');
  }
}
