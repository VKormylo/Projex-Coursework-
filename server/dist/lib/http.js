"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asBigInt = asBigInt;
const error_handler_1 = require("../middleware/error-handler");
function asBigInt(id) {
    const raw = Array.isArray(id) ? id[0] : id;
    if (!raw) {
        throw new error_handler_1.HttpError(400, "Invalid id: empty");
    }
    if (!/^\d+$/.test(raw)) {
        throw new error_handler_1.HttpError(400, `Invalid id: ${raw}`);
    }
    return BigInt(raw);
}
