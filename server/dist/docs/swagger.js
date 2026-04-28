"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
exports.swaggerSpec = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(process.cwd(), "openapi.json"), "utf-8"));
