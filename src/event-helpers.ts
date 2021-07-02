import  { ChainID } from '@stacks/transactions';
import { parseOracleRequestValue } from './adapter-helpers';
import {  bufferCVToASCIIString, bufferToHexPrefixString, DirectRequestParams, executeChainlinkRequest, hexToDirectRequestParams } from './helpers';

export interface OracleContractIdentifier {
    address: string;
    name: string;
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
        const oracle_topic_data = parseOracleRequestValue(encoded_data);
        const job_spec_id = bufferCVToASCIIString(oracle_topic_data.spec_id); //process.env.TEST_JOB_ID
        console.log('JOB_SPEC_ID -> ', job_spec_id);
        const hex = bufferToHexPrefixString(oracle_topic_data.data.buffer);
        const data: DirectRequestParams = await hexToDirectRequestParams(hex);
        console.log('JOB_DATA -> ', data);
        data.payload = encoded_data;
        const response = await executeChainlinkRequest(job_spec_id, data);
        console.log(response);
    } catch (err) {
        console.log(err);
    }
}
