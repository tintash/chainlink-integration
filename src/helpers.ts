import request from 'request';

export interface PriceFeedRequestFulfillment {
    result: number;
    payload: any
}

export interface PriceFeedRequest {
    get: string;
    path: string;
    payload: string;
}

export async function executeChainlinkRequest(jobId: string, data: PriceFeedRequest) {
    const chainlinkNodeURL = String(process.env.EI_CHAINLINKURL) + String(process.env.EI_LINK_JOB_PATH) + jobId + '/runs';
    const options = {
        url: chainlinkNodeURL,
        method: 'POST',
        headers: createChainlinkRequestHeaders(),
        json: data
    }

    return new Promise((resolve, reject) => {
        request(options, (error: any, response: unknown, body: any) => {
            if (error) {
                console.log('Initiator error', error);
                reject(error);
            }
            resolve(response);
        });
    })
}

export function isInvalidComparison(req: any) {
    return (typeof req.body.value_of === 'undefined') || (typeof req.body.value_in === 'undefined');
}

export function createChainlinkRequestHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-Chainlink-EA-AccessKey': process.env.EI_IC_ACCESSKEY,
        'X-Chainlink-EA-Secret': process.env.EI_IC_SECRET
    }
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

export const printTopic = 'print';