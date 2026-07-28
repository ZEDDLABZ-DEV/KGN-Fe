/* eslint-disable @typescript-eslint/no-explicit-any */
export const getApiErrorMessage = (err: any, fallback: string): string =>
  err?.response?.data?.message || fallback

export const isForbidden = (err: any): boolean => err?.response?.status === 403
