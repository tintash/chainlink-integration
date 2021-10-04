import { StacksMainnet, StacksMocknet, StacksNetwork, StacksTestnet } from '@stacks/network';
import {
  BufferCV,
  bufferCVFromString,
  ChainID,
  contractPrincipalCV,
  createAssetInfo,
  createFungiblePostCondition,
  FungibleConditionCode,
} from '@stacks/transactions';
import request from 'request';
import { getOracleContract } from './event-helpers';
import BigNum from 'bn.js';

export interface PriceFeedRequestFulfillment {
  result: number;
  payload: any;
}

export interface PriceFeedRequest {
  get: string;
  path: string;
  payload: string;
}

export async function executeChainlinkRequest(jobId: string, data: DirectRequestParams) {
  const chainlinkNodeURL =
    String(process.env.EI_CHAINLINKURL) + String(process.env.EI_LINK_JOB_PATH) + jobId + '/runs';
  const options = {
    url: chainlinkNodeURL,
    method: 'POST',
    headers: createChainlinkRequestHeaders(),
    json: data,
  };

  return new Promise((resolve, reject) => {
    request(options, (error: any, response: unknown, body: any) => {
      if (error) {
        reject(error);
      }
      resolve(response);
    });
  });
}

export function isInvalidComparison(req: any) {
  return typeof req.body.value_of === 'undefined' || typeof req.body.value_in === 'undefined';
}

export function createChainlinkRequestHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Chainlink-EA-AccessKey': process.env.EI_IC_ACCESSKEY,
    'X-Chainlink-EA-Secret': process.env.EI_IC_SECRET,
  };
}

/**
 * Decodes a `0x` prefixed hex string to a buffer.
 * @param hex - A hex string with a `0x` prefix.
 */
export function hexToBuffer(hex: string): Buffer {
  if (!hex.startsWith('0x')) {
    throw new Error(`Hex string is missing the "0x" prefix: "${hex}"`);
  }
  if (hex.length % 2 !== 0) {
    throw new Error(`Hex string is an odd number of digits: ${hex}`);
  }
  return Buffer.from(hex.substring(2), 'hex');
}

// eslint-disable-next-line @typescript-eslint/ban-types
const enumMaps = new Map<object, Map<unknown, unknown>>();

export function getEnumDescription<T extends string, TEnumValue extends number>(
  enumVariable: { [key in T]: TEnumValue },
  value: number
): string {
  const enumMap = enumMaps.get(enumVariable);
  if (enumMap !== undefined) {
    const enumKey = enumMap.get(value);
    if (enumKey !== undefined) {
      return `${value} '${enumKey}'`;
    } else {
      return `${value}`;
    }
  }

  // Create a map of `[enumValue: number]: enumNameString`
  const enumValues = Object.entries(enumVariable)
    .filter(([, v]) => typeof v === 'number')
    .map<[number, string]>(([k, v]) => [v as number, k]);
  const newEnumMap = new Map(enumValues);
  enumMaps.set(enumVariable, newEnumMap);
  return getEnumDescription(enumVariable, value);
}

export function bufferToHexPrefixString(buff: Buffer): string {
  return '0x' + buff.toString('hex');
}

export function paramsToHexPrefixString(params: DirectRequestParams): DirectRequestBuffer {
  if (Object.keys(params).length === 0) throw new Error('No body param provided.');
  const buffer = Buffer.from(JSON.stringify(params));
  return {
    buffer: bufferToHexPrefixString(buffer),
    length: buffer.length,
    type: 'bytes',
  };
}

export function hexToDirectRequestParams(hex: string): DirectRequestParams {
  if (hex === '') throw new Error('Empty hex buffer provided.');
  const buffer = hexToBuffer(hex);
  const elements: DirectRequestParams = JSON.parse(buffer.toString());
  if (typeof elements === 'undefined') throw new Error('Invalid hex buffer provided.');
  if (Object.keys(elements).length === 0) throw new Error('Hex decoded to empty object.');
  return elements;
}

export function hexToASCII(param: string) {
  let hex = param;
  if (hex.startsWith('0x')) {
    hex = hex.substring(2);
  }
  let ascii = '';
  for (let i = 0; i < hex.length; i += 2) {
    const part = hex.substring(i, i + 2);
    const ch = String.fromCharCode(parseInt(part, 16));
    ascii = ascii + ch;
  }
  return ascii;
}

export function bufferCVToASCIIString(buff: BufferCV): string {
  const ascii = hexToASCII(buff.buffer.toString('utf8'));
  return ascii;
}

export interface DirectRequestParams {
  [name: string]: string;
}

export interface DirectRequestBuffer {
  buffer: string;
  length: number;
  type: string;
}

export const printTopic = 'print';

export function createDirectRequestTxOptions(network: StacksNetwork, mockRequest: any) {
  const consumerAddress = getOracleContract(ChainID.Testnet).address;
  const assetInfo = createAssetInfo(String(process.env.STX_ADDR), 'stxlink-token', 'stxlink-token');
  const postCondition = createFungiblePostCondition(
    String(process.env.TEST_ACC_STX),
    FungibleConditionCode.Equal,
    new BigNum(1),
    assetInfo
  );
  const jobIdBuff = bufferToHexPrefixString(Buffer.from(String(mockRequest['job-id']())));
  const paramBuff = bufferToHexPrefixString(Buffer.from(JSON.stringify(mockRequest.params)));
  const senderPrincipalBuff = bufferToHexPrefixString(
    Buffer.from(String(process.env.TEST_ACC_STX))
  );
  const oracle = getOracleContract(ChainID.Testnet);
  const txOptions = {
    contractAddress: consumerAddress,
    contractName: 'direct-request',
    functionName: 'create-request',
    functionArgs: [
      bufferCVFromString(jobIdBuff),
      bufferCVFromString(senderPrincipalBuff),
      bufferCVFromString(paramBuff),
      contractPrincipalCV(oracle.address, oracle.name),
      contractPrincipalCV(String(process.env.STX_ADDR), 'direct-request'),
      contractPrincipalCV(String(process.env.STX_ADDR), 'direct-request'),
    ],
    senderKey: String(process.env.TEST_ACC_PAYMENT_KEY),
    validateWithAbi: true,
    network,
    fee: new BigNum(100000),
    postConditions: [postCondition],
    anchorMode: 1,
  };
  return txOptions;
}

export function getStacksNetwork(): StacksNetwork {
  const chainID = String(process.env.STACKS_NETWORK);
  switch (chainID) {
    case '0':
      return new StacksMocknet();
    case '1':
      return new StacksTestnet();
    case '2':
      return new StacksMainnet();
  }
  throw new Error('STACKS_CHAIN_ID not set in environment variables');
}

export async function getTxParamsAndEvents(txId: string): Promise<any> {
  return fetch(`https://stacks-node-api.testnet.stacks.co/extended/v1/tx/${txId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(res => {
      if (!res) throw new Error('TxID does not exist');
      else if (res.tx_id == txId && res.contract_call.function_args.length == 0) {
        throw new Error('No function args');
      }
      const txParams = res.contract_call.function_args;
      const txEvents = res.events;
      return { txParams, txEvents };
    });
}
//
export async function formatParams(paramArray: any) {
  const paramNames: any[] = [];
  const paramValues: any[] = [];

  paramArray.forEach((e: any) => {
    const { repr, type, name } = e;
    if (repr && name) {
      paramNames.push(name);
      if (type.includes('buff')) {
        paramValues.push(bufferCVFromString(hexToString(repr.replace('0x', ''))));
      } else paramValues.push(contractPrincipalCV(repr.substring(0, 41), repr.substring(42)));
    }
  });

  return { paramNames, paramValues };
}
export function hexToString(hex: string) {
  var string = '';
  for (var i = 0; i < hex.length; i += 2) {
    string += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return string;
}

export function extractTransferredAmount(events: any) {
  var amount = '';
  for (var i = 0; i < events.length; i++) {
    const { event_type, asset } = events[i];
    if (event_type == 'fungible_token_asset' && asset.asset_event_type == 'transfer') {
      amount = asset.amount;
      break;
    }
  }
  return amount;
}

export function extractData(events: any) {
  var data = '';
  for (var i = 0; i < events.length; i++) {
    const { event_type, contract_log } = events[i];
    if (event_type == 'smart_contract_log' && contract_log.topic == 'print') {
      data = contract_log.value.hex;
      break;
    }
  }
  return data;
}
