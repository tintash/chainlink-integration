import { ChainID } from '@stacks/transactions';
import { parseOracleRequestValue } from './adapter-helpers';
import {
  bufferCVToASCIIString,
  DirectRequestParams,
  executeChainlinkRequest,
  hexToDirectRequestParams,
} from './helpers';

import { getJobSpecMinPayment, validatePayment } from './initiator-helpers';

export interface OracleContractIdentifier {
  address: string;
  name: string;
}

export interface JobSpecResponse {
  type: string;
  id: string;
  attributes: JobSpecResponseAttributes;
}

export interface JobSpecResponseAttributes {
  id: string;
  minPayment: Number;
}

export function getOracleContract(chainId: ChainID) {
  const contractId =
    chainId === ChainID.Mainnet
      ? process.env.MAINNET_CHAINLINK_ORACLE_CONTRACT_ID
      : process.env.TESTNET_CHAINLINK_ORACLE_CONTRACT_ID;
  const name =
    chainId === ChainID.Mainnet
      ? process.env.MAINNET_CHAINLINK_ORACLE_CONTRACT_NAME
      : process.env.TESTNET_CHAINLINK_ORACLE_CONTRACT_NAME;
  const result: OracleContractIdentifier = {
    address: String(contractId),
    name: String(name),
  };
  return result;
}

export function getOracleContractPrincipal(chainId: ChainID): string {
  const oracle = getOracleContract(chainId);
  return oracle.address + '.' + oracle.name;
}

export function isOracleContract(principal: string): boolean {
  return (
    principal === getOracleContractPrincipal(ChainID.Testnet) ||
    principal === getOracleContractPrincipal(ChainID.Mainnet)
  );
}

export async function executeChainlinkInitiator(encoded_data: string) {
  try {
    const oracleTopicData = parseOracleRequestValue(encoded_data);
    const jobSpecId = bufferCVToASCIIString(oracleTopicData.specId);
    const transferedAmount = oracleTopicData.payment.value;
    console.log('Chainlink JOB_SPEC_ID:< ', jobSpecId, ' >');
    const jobCost: bigint = await getJobSpecMinPayment(jobSpecId);
    const validation: boolean = await validatePayment(transferedAmount, jobCost)
    if (validation == false || !validation) {
      throw `rejecting job ${jobSpecId} with payment ${jobCost} below minimum threshold ${transferedAmount.toString()}`;
    }
    const hex = oracleTopicData.data.buffer.toString();
    const data: DirectRequestParams = hexToDirectRequestParams(hex);
    console.log('Chainlink JOB_DATA:< ', data, ' >');
    data.payload = encoded_data;
    const response = await executeChainlinkRequest(jobSpecId, data);
    console.log('Chainlink Initiator Response:< ', response, ' >');
  } catch (err) {
    console.log('Chainlink Initiator Error:< ', err, ' >');
  }
}
