"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asBigInt = asBigInt;
exports.toJson = toJson;
const error_handler_1 = require("../middleware/error-handler");
function asBigInt(id) {
    if (!/^\d+$/.test(id)) {
        throw new error_handler_1.HttpError(400, `Invalid id: ${id}`);
    }
    return BigInt(id);
}
function toJson(value) {
    return JSON.parse(JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
}
