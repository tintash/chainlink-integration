import  {ChainID } from '@stacks/transactions';
import { executeChainlinkRequest, PriceFeedRequest } from './helpers';

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
    const value_of = 'ETH';
    const value_in = 'USD';
    const compareURL = 'https://min-api.cryptocompare.com/data/price?fsym='+value_of+'&tsyms='+value_in;

    const data: PriceFeedRequest = {
        get: compareURL,
        path: value_in,
        payload: encoded_data
    };
    
    try {
        const response = await executeChainlinkRequest(String(process.env.TEST_JOB_ID), data);
        console.log(response);
    } catch (err) {
        console.log(err);
    }
}
