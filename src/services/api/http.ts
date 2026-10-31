import { create, isAxiosError } from 'axios';

import { API_BASE_URL } from '@/constants/api';

const TIMEOUT_MS = 15000;

/** The only HTTP client used for customer authentication. */
export const apiClient = create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  validateStatus: () => true,
});

export type ApiPostResult = {
  status: number;
  body: unknown;
};

export async function postJson(path: string, body: unknown): Promise<ApiPostResult> {
  if (!API_BASE_URL.startsWith('https://')) {
    return { status: 0, body: { message: 'The API address must use HTTPS.' } };
  }

  try {
    const response = await apiClient.post<unknown>(path, body);
    return { status: response.status, body: response.data ?? null };
  } catch (error) {
    const timedOut = isAxiosError(error) && error.code === 'ECONNABORTED';
    return {
      status: 0,
      body: {
        message: timedOut ? 'The request timed out. Please try again.' : 'Unable to connect. Please try again.',
      },
    };
  }
}
