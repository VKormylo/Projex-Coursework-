"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const comments_controller_1 = require("./comments.controller");
const createCommentSchema = zod_1.z.object({
    taskId: zod_1.z.string().regex(/^\d+$/),
    authorId: zod_1.z.string().regex(/^\d+$/),
    body: zod_1.z.string().min(1),
});
exports.commentsRouter = (0, express_1.Router)();
exports.commentsRouter.get("/task/:taskId", auth_1.authenticate, comments_controller_1.listTaskComments);
exports.commentsRouter.post("/", auth_1.authenticate, (0, validate_1.validateBody)(createCommentSchema), comments_controller_1.createTaskComment);
