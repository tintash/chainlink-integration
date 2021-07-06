import { hexToDirectRequestParams, paramsToHexPrefixString } from "../helpers";
import { parseOracleRequestValue } from "../adapter-helpers";

test('error: parse oracle request value', () => {
    const param = 'dummy'; 
    expect(() => parseOracleRequestValue(param)).toThrowError();
});

test('error: request params to hex prefix string', async () => {
    const param = {};
    await expect(paramsToHexPrefixString(param))
    .rejects
    .toThrowError('No body param provided.');
});

test('request params to hex prefix string', async () => {
    const param = {
        get: 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD',
        path: 'USD'
    };
    const result = await paramsToHexPrefixString(param);
    expect(result.buffer).toBe('0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d');
    expect(result.length).toEqual(86);
    expect(result.type).toBe('bytes');
});

test('error: hex to direct request params', async () => {
    const param = '';
    await expect(hexToDirectRequestParams(param))
    .rejects
    .toThrowError('Empty hex buffer provided.');
});

test('hex to direct request params', async () => {
    const param = '0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d'
    const result = await hexToDirectRequestParams(param);
    expect(result.get).toBe('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD');
    expect(result.path).toBe('USD');
});


test('parse oracle request', async () => {
    const param = "0x0c000000090863616c6c6261636b061a888a0a096bd302b3a4130616c00458e243ee533708636f6e73756d6572046461746102000000567b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d0c646174612d76657273696f6e01000000000000000000000000000000000a65787069726174696f6e01000000000000000000000000000f423f056e6f6e63650100000000000000000000000000000000077061796d656e74010000000000000000000000000000012c0a726571756573742d696401000000000000000000000000000000010673656e646572051a888a0a096bd302b3a4130616c00458e243ee533707737065632d69640200000042307833333334333436363634333933343336333836353631333633343337363233383338363333353330333336343631363333383330333833323633333036313334";
    const result = parseOracleRequestValue(param);
    expect(result.request_id.type).toBe(1);
    expect(result.sender.type).toBe(5);
    expect(result.sender.address.hash160).toBe('888a0a096bd302b3a4130616c00458e243ee5337');
})