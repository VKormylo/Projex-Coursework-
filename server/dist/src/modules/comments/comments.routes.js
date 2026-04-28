"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const http_1 = require("../../lib/http");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const createCommentSchema = zod_1.z.object({
    taskId: zod_1.z.string().regex(/^\d+$/),
    authorId: zod_1.z.string().regex(/^\d+$/),
    body: zod_1.z.string().min(1),
});
exports.commentsRouter = (0, express_1.Router)();
exports.commentsRouter.get("/task/:taskId", auth_1.authenticate, async (req, res) => {
    const taskId = (0, http_1.asBigInt)(req.params.taskId);
    const comments = await prisma_1.prisma.taskComment.findMany({ where: { taskId } });
    res.json((0, http_1.toJson)(comments));
});
exports.commentsRouter.post("/", auth_1.authenticate, (0, validate_1.validateBody)(createCommentSchema), async (req, res) => {
    const comment = await prisma_1.prisma.taskComment.create({
        data: {
            taskId: (0, http_1.asBigInt)(req.body.taskId),
            authorId: (0, http_1.asBigInt)(req.body.authorId),
            body: req.body.body,
        },
    });
    res.status(201).json((0, http_1.toJson)(comment));
});
