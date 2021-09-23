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
  requestId: BufferCV;
  expiration: UIntCV;
  sender: StandardPrincipalCV;
  specId: BufferCV;
  callback: ContractPrincipalCV;
  nonce: UIntCV;
  dataVersion: UIntCV;
  requestCount: UIntCV;
  senderBuff: BufferCV;
  payment: UIntCV;
  data: BufferCV;
}

export interface ChainlinkFulfillmentResponse {
  result: string;
  fulfillment: OracleFulfillment;
}

export function parseOracleRequestValue(encodedData: string): OracleFulfillment {
  const dsClarityValue: ClarityValue = deserializeCV(hexToBuffer(encodedData));
  if (dsClarityValue.type == ClarityType.Tuple) {
    const cvData = dsClarityValue.data;
    const requestId = cvData['request_id'] as BufferCV;
    const sender: StandardPrincipalCV = cvData['sender'] as StandardPrincipalCV;
    const expiration = cvData['expiration'] as UIntCV;
    const specId: BufferCV = cvData['spec_id'] as BufferCV;
    const callback = cvData['callback'] as ContractPrincipalCV;
    const nonce = cvData['nonce'] as UIntCV;
    const dataVersion = cvData['data_version'] as UIntCV;
    const requestCount = cvData['request_count'] as UIntCV;
    const senderBuff: BufferCV = cvData['sender_id_buff'] as BufferCV;
    const payment = cvData['payment'] as UIntCV;
    const data: BufferCV = cvData['data'] as BufferCV;
    const result: OracleFulfillment = {
      requestId: requestId,
      expiration: expiration,
      sender: sender,
      specId: specId,
      callback: callback,
      payment: payment,
      nonce: nonce,
      dataVersion: dataVersion,
      requestCount: requestCount,
      senderBuff: senderBuff,
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
  network.coreApiUrl = String(process.env.STACKS_CORE_API_URL);
  const fulfillment = linkFulfillment.fulfillment;
  const txOptions: SignedContractCallOptions = {
    contractAddress: oracle.address,
    contractName: oracle.name,
    functionName: oracleFulfillmentFunction,
    functionArgs: [
      fulfillment.requestId,
      fulfillment.callback,
      fulfillment.expiration,
      fulfillment.requestCount,
      fulfillment.senderBuff,
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
    throw new Error(`${error} with reason: ${txRejected.reason}`);
  }
  return transaction;
}
