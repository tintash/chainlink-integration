"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const adapter_1 = require("./routes/adapter");
const initiator_1 = require("./routes/initiator");
const express_2 = require("@awaitjs/express");
const helpers_1 = require("./helpers");
const morgan_1 = __importDefault(require("morgan"));
const bodyParser = __importStar(require("body-parser"));
const app = express_2.addAsync(express_1.default());
app.use(bodyParser.json({ type: 'application/json', limit: '500MB' }));
const logger = morgan_1.default('dev');
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use(logger);
const adapterRouter = adapter_1.createAdapterRouter();
const initiatorRouter = initiator_1.createInitiatorRouter();
app.use('/cryptocompare/callback', adapterRouter);
app.use('/cryptocompare', initiatorRouter);
app.use((req, res, next) => {
    const ei_ci_acckey = req.headers["x-chainlink-ea-accesskey"];
    const ei_ci_secret = req.headers["x-chainlink-ea-secret"];
    console.log('Acces ', ei_ci_acckey);
    console.log(' Secret ', ei_ci_secret);
    console.log('Process env ', process.env.EI_CI_ACCESSKEY);
    console.log('Process env secret ', process.env.EI_CI_SECRET);
    if (typeof ei_ci_acckey !== 'undefined' && typeof ei_ci_secret !== 'undefined') {
        if (ei_ci_acckey === process.env.EI_CI_ACCESSKEY && ei_ci_secret === process.env.EI_CI_SECRET) {
            res.status(200).json({
                status: 200,
                message: 'Success'
            });
            return;
        }
    }
    res.status(404).json({
        status: 404,
        message: 'Not Found'
    });
});
const port = helpers_1.normalizePort(process.env.PORT || '3000');
app.set('port', port);
const server = http_1.default.createServer(app);
server.listen(port, '0.0.0.0');
console.log('Server initiated!');
//# sourceMappingURL=app.js.map