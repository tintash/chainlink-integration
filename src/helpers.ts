import request from 'request';

export function normalizePort(val: any) {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}

export interface PriceFeedRequestFulfillment {
    result: number;
    payload: any
}

export interface PriceFeedRequest {
    get: string;
    path: string;
    payload: string;
}

export async function serveCallbackToStacksNode(data: PriceFeedRequestFulfillment) {
    const stacks_node_url = String(process.env.STACKS_ROUTE);
    const options = {
        url: stacks_node_url,
        method: 'POST',
        // headers: '',
        json: {
            result: data.result*100,
            data: data.payload
        }
    }
    return new Promise((resolve, reject) => {
        request(options, (error, response) => {
            if (error) {
                reject(error);
                console.log('callback not served');
            }
            resolve(response);
            console.log('callback served');
        });
    })
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