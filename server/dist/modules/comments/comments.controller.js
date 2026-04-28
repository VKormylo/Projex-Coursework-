"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTaskComments = listTaskComments;
exports.createTaskComment = createTaskComment;
const http_1 = require("../../lib/http");
const comments_service_1 = require("./comments.service");
async function listTaskComments(req, res) {
    const taskId = (0, http_1.asBigInt)(req.params.taskId);
    const comments = await (0, comments_service_1.getCommentsByTask)(taskId);
    res.status(200).json({
        status: "success",
        data: { comments },
    });
}
async function createTaskComment(req, res) {
    const comment = await (0, comments_service_1.createCommentRecord)({
        taskId: (0, http_1.asBigInt)(req.body.taskId),
        authorId: (0, http_1.asBigInt)(req.body.authorId),
        body: req.body.body,
    });
    res.status(201).json({
        status: "success",
        data: { comment },
    });
}
