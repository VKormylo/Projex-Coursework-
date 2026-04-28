"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./docs/swagger");
const error_handler_1 = require("./middleware/error-handler");
const routes_1 = require("./routes");
exports.app = (0, express_1.default)();
exports.app.set("json replacer", (_key, value) => typeof value === "bigint" ? value.toString() : value);
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json());
exports.app.use((0, morgan_1.default)("dev"));
exports.app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "success",
        data: { ok: true },
    });
});
exports.app.get("/api/docs/openapi.json", (_req, res) => {
    res.json(swagger_1.swaggerSpec);
});
exports.app.use("/api/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
exports.app.use("/api", routes_1.apiRouter);
exports.app.use(error_handler_1.errorHandler);
