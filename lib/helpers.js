"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChainlinkRequestHeaders = exports.isInvalidComparison = exports.executeChainlinkRequest = exports.serveCallbackToStacksNode = exports.normalizePort = void 0;
const request_1 = __importDefault(require("request"));
function normalizePort(val) {
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
exports.normalizePort = normalizePort;
async function serveCallbackToStacksNode(data) {
    const stacks_node_url = String(process.env.STACKS_ROUTE);
    const options = {
        url: stacks_node_url,
        method: 'POST',
        // headers: '',
        json: {
            result: data.result * 100,
            data: data.payload
        }
    };
    return new Promise((resolve, reject) => {
        request_1.default(options, (error, response) => {
            if (error) {
                reject(error);
                console.log('callback not served');
            }
            resolve(response);
            console.log('callback served');
        });
    });
}
exports.serveCallbackToStacksNode = serveCallbackToStacksNode;
async function executeChainlinkRequest(jobId, data) {
    const chainlinkNodeURL = String(process.env.EI_CHAINLINKURL) + String(process.env.EI_LINK_JOB_PATH) + jobId + '/runs';
    const options = {
        url: chainlinkNodeURL,
        method: 'POST',
        headers: createChainlinkRequestHeaders(),
        json: data
    };
    return new Promise((resolve, reject) => {
        request_1.default(options, (error, response, body) => {
            if (error) {
                reject(error);
            }
            resolve(response);
        });
    });
}
exports.executeChainlinkRequest = executeChainlinkRequest;
function isInvalidComparison(req) {
    return (typeof req.body.value_of === 'undefined') || (typeof req.body.value_in === 'undefined');
}
exports.isInvalidComparison = isInvalidComparison;
function createChainlinkRequestHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-Chainlink-EA-AccessKey': process.env.EI_IC_ACCESSKEY,
        'X-Chainlink-EA-Secret': process.env.EI_IC_SECRET
    };
}
exports.createChainlinkRequestHeaders = createChainlinkRequestHeaders;
//# sourceMappingURL=helpers.js.map