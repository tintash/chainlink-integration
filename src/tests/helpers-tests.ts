import { hexToDirectRequestParams, paramsToHexPrefixString } from '../helpers';
import { parseOracleRequestValue } from '../adapter-helpers';

test('error: parse oracle request value', () => {
  const param = 'dummy';
  expect(() => parseOracleRequestValue(param)).toThrowError();
});

test('error: request params to hex prefix string', async () => {
  const param = {};
  await expect(paramsToHexPrefixString(param)).rejects.toThrowError('No body param provided.');
});

test('request params to hex prefix string', () => {
  const param = {
    get: 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD',
    path: 'USD',
  };
  const result = paramsToHexPrefixString(param);
  expect(result.buffer).toBe(
    '0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'
  );
  expect(result.length).toEqual(86);
  expect(result.type).toBe('bytes');
});

test.only('error: hex to direct request params', async () => {
  const param = '';
  await expect(hexToDirectRequestParams(param)).rejects.toThrowError('Empty hex buffer provided.');
});

test('hex to direct request params', () => {
  const param =
    '0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d';
  const result = hexToDirectRequestParams(param);
  expect(result.get).toBe('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD');
  expect(result.path).toBe('USD');
});
