import { useCallback, useState } from 'react';
import { ApiError } from '../services/http-client';

export interface Feedback {
  severity: 'success' | 'error';
  message: string;
}

/** Centraliza o feedback de sucesso/erro de mutações, no mesmo formato usado em MessagesPage. */
export function useFeedback() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const notifySuccess = useCallback((message: string) => {
    setFeedback({ severity: 'success', message });
  }, []);

  const notifyError = useCallback((message: string, error?: unknown) => {
    const detail = error instanceof Error ? ` ${error.message}` : '';
    const requestId =
      error instanceof ApiError && error.requestId ? ` Protocolo: ${error.requestId}.` : '';
    setFeedback({ severity: 'error', message: `${message}${detail}${requestId}` });
  }, []);

  const clear = useCallback(() => setFeedback(null), []);

  return { feedback, notifySuccess, notifyError, clear };
}
