"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitiatorRouter = void 0;
const express_1 = __importDefault(require("express"));
const helpers_1 = require("../helpers");
function createInitiatorRouter() {
    const router = express_1.default.Router();
    router.use(express_1.default.json());
    router.post('/', async (req, res) => {
        if (helpers_1.isInvalidComparison(req)) {
            res.status(500).json({
                status: 500,
                message: 'bad request body'
            });
            return;
        }
        const value_of = String(req.body.value_of).toUpperCase();
        const value_in = String(req.body.value_in).toUpperCase();
        const payload_data = (req.body.data) ? req.body.data : {};
        const compareURL = 'https://min-api.cryptocompare.com/data/price?fsym=' + value_of + '&tsyms=' + value_in;
        const data = {
            get: compareURL,
            path: value_in,
            payload: payload_data
        };
        try {
            const response = await helpers_1.executeChainlinkRequest(String(process.env.TEST_JOB_ID), data);
            res.status(200).send(response);
        }
        catch (err) {
            res.send(err);
        }
    });
    return router;
}
exports.createInitiatorRouter = createInitiatorRouter;
;
//# sourceMappingURL=initiator.js.map