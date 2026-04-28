import { isAxiosError, type AxiosResponse } from 'axios'

import { axiosClient } from '~/plugins/axiosClient'
import { ResponseError } from '~/exceptions/response-error'
import type {
  ErrorResponse,
  RequestParams,
  ResponseStatus,
} from '~/types/common.types'

interface APIResponse<T> {
  status: ResponseStatus
  data: T
}

export const baseService = {
  request: async <T>({ data, method, url }: RequestParams): Promise<T> => {
    try {
      const response = (await axiosClient.request({
        data,
        method,
        url,
      })) as AxiosResponse<APIResponse<T>>

      return response.data.data
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        const serverError = error.response.data as Partial<ErrorResponse>

        throw new ResponseError({
          code: error.response.status,
          message: serverError?.message ?? 'Unexpected error',
          status: serverError?.status,
        })
      }

      throw new ResponseError({ code: 500, message: 'UNKNOWN_ERROR' })
    }
  },
}
