"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdapterRouter = void 0;
const express_1 = __importDefault(require("express"));
const helpers_1 = require("../helpers");
function createAdapterRouter() {
    const router = express_1.default.Router();
    router.use(express_1.default.json());
    router.post('/', async (req, res) => {
        console.log(req.body);
        const price = parseFloat(req.body.data.result);
        console.log(req.body.data);
        res.status(200).json({
            symbol: "ETH-USD",
            value: price,
            data: req.body.data
        });
        helpers_1.serveCallbackToStacksNode(req.body.data);
    });
    return router;
}
exports.createAdapterRouter = createAdapterRouter;
;
//# sourceMappingURL=adapter.js.map