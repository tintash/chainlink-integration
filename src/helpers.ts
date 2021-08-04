import { StacksMocknet, StacksNetwork } from '@stacks/network';
import {
  BufferCV,
  bufferCVFromString,
  ChainID,
  contractPrincipalCV,
  createSTXPostCondition,
  FungibleConditionCode,
} from '@stacks/transactions';
import { getOracleContract } from './event-helpers';
import BigNum from 'bn.js';
import * as MockData from './mock/direct-requests.json';

export const isDevEnv = process.env.NODE_ENV === 'development';
export const isTestEnv = process.env.NODE_ENV === 'test';
export const isProdEnv =
  process.env.NODE_ENV === 'production' ||
  process.env.NODE_ENV === 'prod' ||
  !process.env.NODE_ENV ||
  (!isTestEnv && !isDevEnv);

export interface PriceFeedRequestFulfillment {
  result: number;
  payload: any;
}

export interface PriceFeedRequest {
  get: string;
  path: string;
  payload: string;
}

export function isInvalidComparison(req: any) {
  return typeof req.body.value_of === 'undefined' || typeof req.body.value_in === 'undefined';
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

export function createDirectRequestTxOptions(network: StacksNetwork, id: number) {
  const mock_request = MockData[id];
  const consumer_address = getOracleContract(ChainID.Testnet).address;
  const post_condition = createSTXPostCondition(
    'ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC',
    FungibleConditionCode.Equal,
    new BigNum(500)
  );
  const sender_principal_buff = bufferToHexPrefixString(Buffer.from(String(process.env.STX_ADDR)));
  const txOptions = {
    contractAddress: consumer_address,
    contractName: 'direct-request',
    functionName: 'request-api',
    functionArgs: [
      bufferCVFromString(mock_request['job-id-buff']),
      bufferCVFromString(sender_principal_buff),
      bufferCVFromString(mock_request['params-buff']),
      contractPrincipalCV('ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC', 'direct-request'),
    ],
    senderKey: String(process.env.TEST_ACC_PAYMENT_KEY),
    validateWithAbi: true,
    network,
    postConditions: [post_condition],
    anchorMode: 1,
  };
  return txOptions;
}

export function parsePort(portVal: number | string | undefined): number | undefined {
  if (portVal === undefined) {
    return undefined;
  }
  if (/^[-+]?(\d+|Infinity)$/.test(portVal.toString())) {
    const port = Number(portVal);
    if (port < 1 || port > 65535) {
      throw new Error(`Port ${port} is invalid`);
    }
    return port;
  } else {
    throw new Error(`Port ${portVal} is invalid`);
  }
}

export function timeout(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}
