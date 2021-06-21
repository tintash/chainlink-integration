import { StacksMocknet } from '@stacks/network';
import {
    UIntCV,
    StandardPrincipalCV,
    BufferCV,
    ContractPrincipalCV,
    ChainID,
    ClarityType,
    ClarityValue,
    deserializeCV,
    StacksTransaction,
    broadcastTransaction,
    makeContractCall,
    uintCV,
    SignedContractCallOptions,
} from '@stacks/transactions';
import { getOracleContract } from './event-helpers';
import { hexToBuffer } from './helpers';

export interface OracleFulfillment {
    request_id: UIntCV;
    expiration: UIntCV;
    sender: StandardPrincipalCV;
    payment: UIntCV;
    spec_id: BufferCV;
    callback: ContractPrincipalCV;
    nonce: UIntCV;
    data_version: UIntCV;
    data: BufferCV;
}

export interface ChainlinkFulfillmentResponse {
    result: string;
    fulfillment: OracleFulfillment;
}

export function parseOracleRequestValue(encoded_data: string) {
    const cl_val: ClarityValue = deserializeCV(hexToBuffer(encoded_data));
    if (cl_val.type == ClarityType.Tuple) {
        const cl_val_data = cl_val.data;
        const request_id = cl_val_data['request-id'] as UIntCV;
        const sender: StandardPrincipalCV = cl_val_data['sender'] as StandardPrincipalCV;
        const expiration = cl_val_data['expiration'] as UIntCV;
        const payment = cl_val_data['payment'] as UIntCV;
        const spec_id: BufferCV = cl_val_data['spec-id'] as BufferCV;
        const callback = cl_val_data['callback'] as ContractPrincipalCV;
        const nonce = cl_val_data['nonce'] as UIntCV;
        const data_version = cl_val_data['data-version'] as UIntCV;
        const data: BufferCV = cl_val_data['data'] as BufferCV;
        const result: OracleFulfillment = {
        request_id: request_id,
        expiration: expiration,
        sender: sender,
        payment: payment,
        spec_id: spec_id,
        callback: callback,
        nonce: nonce,
        data_version: data_version,
        data: data,
        };
        console.log('Sajjad->', data);
        return result;
    }
    throw new Error('Invalid oracle request data received back!');
}

export async function createOracleFulfillmentTx(
    linkFulfillment: ChainlinkFulfillmentResponse,
    chainId: ChainID
): Promise<StacksTransaction> {
    const oracle = getOracleContract(chainId);
    const oracleFulfillmenatFunction = 'fullfill-oracle-request';
    const oraclePaymentKey = String(process.env.ORACLE_PAYMENT_KEY);
    const network = new StacksMocknet();
    const fulfillment = linkFulfillment.fulfillment;
    const txOptions: SignedContractCallOptions = {
        contractAddress: oracle.address,
        contractName: oracle.name,
        functionName: oracleFulfillmenatFunction,
        functionArgs: [
        fulfillment.request_id,
        fulfillment.payment,
        fulfillment.callback,
        fulfillment.expiration,
        uintCV(linkFulfillment.result),
        ],
        senderKey: oraclePaymentKey,
        validateWithAbi: true,
        network,
        postConditions: [],
        anchorMode: 1
    };
    console.log('Sajjad->', txOptions);
    const transaction = await makeContractCall(txOptions);
    console.log('Sajjad->', transaction);
    const _ = broadcastTransaction(transaction, network);
    return transaction;
}
