import Web3 from 'web3';
import { readFileSync } from 'fs';
import HDWalletProvider from '@truffle/hdwallet-provider';

export const provider = new HDWalletProvider(
  String(process.env.ETH_ADDR_PRIVATE_KEY),
  `https://${process.env.ETH_NETWORK_NAME}.infura.io/v3/${process.env.INFURA_API_KEY}`
);

export const web3 = new Web3(provider);

export const consumerContractABI = JSON.parse(
  readFileSync('src/contract-abi/evm-direct-request-consumer-abi.json', 'utf-8')
);

export const oracleContractABI = JSON.parse(readFileSync('src/contract-abi/oracle.json', 'utf-8'));

export const oracleRequestABI = oracleContractABI.find(
  (obj: { name: string }) => obj.name === 'OracleRequest'
);
export const contract = new web3.eth.Contract(
  consumerContractABI,
  process.env.ETHEREUM_STACKS_CONTRACT_CONSUMER_CONTRACT
);

export const options = {
  from: process.env.ETH_ADDR,
  gasPrice: web3.utils.toHex(web3.utils.toWei('4', 'gwei')),
  gas: web3.utils.toHex(150000),
};

export interface EVMResponse {
  status: boolean;
  txHash: string;
  blockHash: string;
  blockNumber: number;
  requestId: string;
  requesterContractADDR: string;
}

export enum DirectRequestType {
  GET,
  POST,
}
