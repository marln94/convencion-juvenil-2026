import { createApiClient } from '@convencion/api-client'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

export const api = createApiClient(BASE_URL)