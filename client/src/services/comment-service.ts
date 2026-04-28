import { URLs } from '~/constants/request'
import { baseService } from './base-service'
import type { CommentDto } from '~/types/sprint.types'

interface CommentsResponse {
  comments: CommentDto[]
}
interface CommentResponse {
  comment: CommentDto
}

export const commentService = {
  listByTask: (taskId: string) =>
    baseService.request<CommentsResponse>({
      method: 'GET',
      url: URLs.comments.byTask(taskId),
    }),

  create: (taskId: string, body: string) =>
    baseService.request<CommentResponse>({
      method: 'POST',
      url: URLs.comments.create,
      data: { taskId, body },
    }),
}
