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
  SignedContractCallOptions,
  bufferCVFromString,
  TxBroadcastResultRejected,
} from '@stacks/transactions';
import { optionalCVOf } from '@stacks/transactions/dist/clarity/types/optionalCV';
import { getOracleContract } from './event-helpers';
import { hexToBuffer } from './helpers';

export interface OracleFulfillment {
  request_id: BufferCV;
  expiration: UIntCV;
  sender: StandardPrincipalCV;
  payment: UIntCV;
  spec_id: BufferCV;
  callback: ContractPrincipalCV;
  nonce: UIntCV;
  data_version: UIntCV;
  request_count: UIntCV;
  sender_buff: BufferCV;
  data: BufferCV;
}

export interface ChainlinkFulfillmentResponse {
  result: string;
  fulfillment: OracleFulfillment;
}

export function parseOracleRequestValue(encoded_data: string): OracleFulfillment {
  const cl_val: ClarityValue = deserializeCV(hexToBuffer(encoded_data));
  if (cl_val.type == ClarityType.Tuple) {
    const cl_val_data = cl_val.data;
    const request_id = cl_val_data['request_id'] as BufferCV;
    const sender: StandardPrincipalCV = cl_val_data['sender'] as StandardPrincipalCV;
    const expiration = cl_val_data['expiration'] as UIntCV;
    const payment = cl_val_data['payment'] as UIntCV;
    const spec_id: BufferCV = cl_val_data['spec_id'] as BufferCV;
    const callback = cl_val_data['callback'] as ContractPrincipalCV;
    const nonce = cl_val_data['nonce'] as UIntCV;
    const data_version = cl_val_data['data_version'] as UIntCV;
    const request_count = cl_val_data['request_count'] as UIntCV;
    const sender_buff: BufferCV = cl_val_data['sender_id_buff'] as BufferCV;
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
      request_count: request_count,
      sender_buff: sender_buff,
      data: data,
    };
    return result;
  }
  throw new Error('Invalid oracle request data received back!');
}

export async function createOracleFulfillmentTx(
  linkFulfillment: ChainlinkFulfillmentResponse,
  chainId: ChainID
): Promise<StacksTransaction> {
  const oracle = getOracleContract(chainId);
  const oracleFulfillmentFunction = 'fullfill-oracle-request';
  const oraclePaymentKey = String(process.env.STX_ADDR_PRIVATE_KEY);
  const network = new StacksMocknet();
  const fulfillment = linkFulfillment.fulfillment;
  const txOptions: SignedContractCallOptions = {
    contractAddress: oracle.address,
    contractName: oracle.name,
    functionName: oracleFulfillmentFunction,
    functionArgs: [
      fulfillment.request_id,
      fulfillment.payment,
      fulfillment.callback,
      fulfillment.expiration,
      fulfillment.request_count,
      fulfillment.sender_buff,
      optionalCVOf(bufferCVFromString(linkFulfillment.result)),
    ],
    senderKey: oraclePaymentKey,
    validateWithAbi: true,
    network,
    postConditions: [],
    anchorMode: 1,
  };
  const transaction = await makeContractCall(txOptions);
  const broadcastResult = await broadcastTransaction(transaction, network);
  const txRejected = broadcastResult as TxBroadcastResultRejected;
  const error = txRejected.error;
  if (error) {
    throw new Error(error + ' with reason: ' + txRejected.reason);
  }
  return transaction;
}
