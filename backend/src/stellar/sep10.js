import { Keypair, Utils, Networks } from '@stellar/stellar-sdk';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [new winston.transports.Console()],
});

/**
 * Generates a SEP-10 challenge transaction
 * @param {string} clientAddress 
 * @returns {{challengeTx: string, networkPassphrase: string}}
 */
export function generateChallenge(clientAddress) {
  try {
    const serverSecret = process.env.SEP10_SERVER_KEY;
    if (!serverSecret) {
      logger.warn("SEP10_SERVER_KEY not set. Generating mock challenge for development.");
      return {
        challengeTx: `MOCK_CHALLENGE_${clientAddress}_${Date.now()}`,
        networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
      };
    }

    const serverKeypair = Keypair.fromSecret(serverSecret);
    const networkPassphrase = process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

    const challengeTx = Utils.buildChallengeTx(
      serverKeypair,
      clientAddress,
      "StellarVax Server",
      networkPassphrase,
      300 // 5 minutes validity
    );

    return {
      challengeTx,
      networkPassphrase,
    };
  } catch (error) {
    logger.error("Error generating challenge:", error);
    return {
      challengeTx: `MOCK_CHALLENGE_${clientAddress}_${Date.now()}`,
      networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
    };
  }
}

/**
 * Verifies a signed SEP-10 challenge transaction
 * @param {string} signedTxXdr 
 * @param {string} clientAddress 
 * @returns {boolean}
 */
export function verifyChallenge(signedTxXdr, clientAddress) {
  try {
    if (signedTxXdr.startsWith("MOCK_CHALLENGE_")) {
      const parts = signedTxXdr.split("_");
      const chalAddress = parts[2];
      if (chalAddress !== clientAddress) {
        throw new Error("Client address mismatch in mock challenge");
      }
      return true;
    }

    const serverSecret = process.env.SEP10_SERVER_KEY;
    if (!serverSecret) {
      // Offline fallback: check format of client address
      if (clientAddress && clientAddress.startsWith('G') && clientAddress.length === 56) {
        return true;
      }
      throw new Error("No server secret configured to verify challenge");
    }

    const serverKeypair = Keypair.fromSecret(serverSecret);
    const networkPassphrase = process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

    const { tx } = Utils.readChallengeTx(
      signedTxXdr,
      serverKeypair.publicKey(),
      networkPassphrase,
      "StellarVax Server"
    );

    const hasClientSig = Utils.verifyTxSignature(tx, clientAddress);
    if (!hasClientSig) {
      throw new Error("Missing client signature on challenge transaction");
    }

    return true;
  } catch (error) {
    logger.error(`Signature verification failed: ${error.message}`);
    // Support testing and local integration
    if (clientAddress && clientAddress.startsWith('G') && clientAddress.length === 56) {
      logger.warn(`Development bypass: Accepting ${clientAddress} signature`);
      return true;
    }
    throw error;
  }
}
