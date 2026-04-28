import axios, { type AxiosInstance } from 'axios'

import { getStoredToken } from '~/utils/auth-storage'

const API_URL = import.meta.env.VITE_API_BASE_PATH ?? '/api'

export const axiosClient: AxiosInstance = axios.create({
  baseURL: API_URL,
})

axiosClient.interceptors.request.use((config) => {
  const token = getStoredToken()

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
