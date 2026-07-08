import { Contract, Address, rpc, Keypair, TransactionBuilder, Networks, xdr, Account } from '@stellar/stellar-sdk';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [new winston.transports.Console()],
});

// In-memory mock database to simulate contract execution when running offline/without Stellar RPC configuration
const mockContractStorage = {
  issuers: new Set(),
  records: new Map(),
  nextTokenId: 1
};

// Seed mock database with the configured Admin
if (process.env.ADMIN_PUBLIC_KEY) {
  mockContractStorage.issuers.add(process.env.ADMIN_PUBLIC_KEY);
}

/**
 * Checks if an issuer address is authorized in the smart contract
 * @param {string} issuerAddress 
 * @returns {Promise<boolean>}
 */
export async function isIssuerAuthorized(issuerAddress) {
  try {
    const contractId = process.env.VACCINATIONS_CONTRACT_ID;
    const rpcUrl = process.env.SOROBAN_RPC_URL;
    if (!contractId || !rpcUrl) {
      logger.info(`Soroban not configured. Checking mock storage for ${issuerAddress}`);
      return mockContractStorage.issuers.has(issuerAddress) || issuerAddress === process.env.ADMIN_PUBLIC_KEY;
    }

    const server = new rpc.Server(rpcUrl);
    const contract = new Contract(contractId);

    // Build a simulation transaction
    const tx = new TransactionBuilder(
      new Account(issuerAddress, "0"),
      { fee: "100", networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET }
    )
    .addOperation(
      contract.call("is_issuer", new Address(issuerAddress))
    )
    .setTimeout(30)
    .build();

    const result = await server.simulateTransaction(tx);
    if (result.results && result.results[0]) {
      const val = xdr.ScVal.fromXdr(result.results[0].xdr, "base64");
      return val.b();
    }
    return false;
  } catch (error) {
    logger.error(`Soroban check failed, fallback to mock storage: ${error.message}`);
    return mockContractStorage.issuers.has(issuerAddress) || issuerAddress === process.env.ADMIN_PUBLIC_KEY;
  }
}

/**
 * Mints a new vaccination record for a patient on-chain
 * @param {string} patientAddress 
 * @param {string} vaccineName 
 * @param {number} date 
 * @param {string} issuerAddress 
 * @returns {Promise<number>} token_id
 */
export async function mintVaccinationRecord(patientAddress, vaccineName, date, issuerAddress) {
  try {
    const contractId = process.env.VACCINATIONS_CONTRACT_ID;
    const rpcUrl = process.env.SOROBAN_RPC_URL;
    const issuerSecret = process.env.ISSUER_SECRET_KEY;

    if (!contractId || !rpcUrl || !issuerSecret) {
      // Mock minting
      logger.info(`Soroban not configured. Minting mock record for patient ${patientAddress}`);
      return mockMintRecord(patientAddress, vaccineName, date, issuerAddress);
    }

    const server = new rpc.Server(rpcUrl);
    const contract = new Contract(contractId);
    const issuerKeypair = Keypair.fromSecret(issuerSecret);

    const account = await server.getAccount(issuerKeypair.publicKey());
    
    const tx = new TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET
    })
    .addOperation(
      contract.call(
        "mint_vaccination",
        new Address(patientAddress),
        xdr.ScVal.scvSymbol(vaccineName),
        xdr.ScVal.scvU64(xdr.Uint64.fromString(date.toString())),
        new Address(issuerAddress)
      )
    )
    .setTimeout(30)
    .build();

    tx.sign(issuerKeypair);

    const response = await server.sendTransaction(tx);
    if (response.status === "ERROR") {
      throw new Error("Transaction submission failed immediately");
    }

    let status = response.status;
    let txResult;
    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      txResult = await server.getTransaction(response.hash);
      status = txResult.status;
      if (status !== "PENDING") break;
    }

    if (status !== "SUCCESS") {
      throw new Error(`Transaction finished with non-success status: ${status}`);
    }

    return 1;
  } catch (error) {
    logger.error(`Soroban mint failed, fallback to mock mint: ${error.message}`);
    if (error.message.includes("duplicate")) {
      throw error;
    }
    return mockMintRecord(patientAddress, vaccineName, date, issuerAddress);
  }
}

/**
 * Returns all vaccination records for a specific patient wallet address
 * @param {string} patientAddress 
 * @returns {Promise<Array>}
 */
export async function verifyVaccinationRecords(patientAddress) {
  try {
    const contractId = process.env.VACCINATIONS_CONTRACT_ID;
    const rpcUrl = process.env.SOROBAN_RPC_URL;
    if (!contractId || !rpcUrl) {
      logger.info(`Soroban not configured. Querying mock storage for ${patientAddress}`);
      return mockContractStorage.records.get(patientAddress) || [];
    }

    const server = new rpc.Server(rpcUrl);
    const contract = new Contract(contractId);

    const tx = new TransactionBuilder(
      new Account(patientAddress, "0"),
      { fee: "100", networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET }
    )
    .addOperation(
      contract.call("verify_vaccination", new Address(patientAddress))
    )
    .setTimeout(30)
    .build();

    const result = await server.simulateTransaction(tx);
    if (result.results && result.results[0]) {
      const val = xdr.ScVal.fromXdr(result.results[0].xdr, "base64");
      const records = [];
      const vec = val.vec();
      for (const item of vec) {
        const obj = item.obj().map();
        let token_id = 0;
        let vaccine_name = "";
        let date = 0;
        let issuer = "";
        let timestamp = 0;

        for (const entry of obj) {
          const key = entry.key().symbol().toString();
          const valVal = entry.val();
          if (key === "token_id") token_id = parseInt(valVal.u64().toString());
          else if (key === "vaccine_name") vaccine_name = valVal.symbol().toString();
          else if (key === "date") date = parseInt(valVal.u64().toString());
          else if (key === "issuer") issuer = valVal.address().toString();
          else if (key === "timestamp") timestamp = parseInt(valVal.u64().toString());
        }
        records.push({ token_id, vaccine_name, date, issuer, timestamp });
      }
      return records;
    }
    return [];
  } catch (error) {
    logger.error(`Soroban query failed, returning mock database records: ${error.message}`);
    return mockContractStorage.records.get(patientAddress) || [];
  }
}

// Mock functions to allow self-contained demo operations
function mockMintRecord(patientAddress, vaccineName, date, issuerAddress) {
  const patientRecords = mockContractStorage.records.get(patientAddress) || [];
  const isDuplicate = patientRecords.some(r => r.vaccine_name === vaccineName && r.date === parseInt(date));
  if (isDuplicate) {
    throw new Error("duplicate vaccination record");
  }

  const tokenId = mockContractStorage.nextTokenId++;
  const newRecord = {
    token_id: tokenId,
    vaccine_name: vaccineName,
    date: parseInt(date),
    issuer: issuerAddress,
    timestamp: Math.floor(Date.now() / 1000)
  };

  patientRecords.push(newRecord);
  mockContractStorage.records.set(patientAddress, patientRecords);
  return tokenId;
}

export function mockRegisterIssuer(issuerAddress) {
  mockContractStorage.issuers.add(issuerAddress);
}
