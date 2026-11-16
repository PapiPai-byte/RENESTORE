// @ts-nocheck
import { tokenStorage } from '@/lib/utils';

export interface SuggestedFaq {
  id: number;
  question: string;
  category: string;
}

export type ChatSSEEvent =
  | { token: string }
  | { type: 'done' }
  | { type: 'start'; matched: number }
  | { error: string }
  | { followups: string[] };

/**
 * Stream a chat message via Server-Sent Events.
 * Yields tokens as they arrive, then metadata events.
 */
export async function* streamChat(
  message: string,
  page?: string,
): AsyncGenerator<ChatSSEEvent, void, unknown> {
  const controller = new AbortController();

  try {
    const token = tokenStorage.getAccessToken() ?? '';
    // VITE_API_URL already includes /api, so append /chat/stream directly
    const resp = await fetch(`${import.meta.env.VITE_API_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, page }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${text}`);
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          try {
            const event = JSON.parse(data) as ChatSSEEvent;
            yield event;
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      yield { error: err.message };
    }
  } finally {
    controller.abort();
  }
}

export const chatApi = {
  streamChat,

  async getSuggestedFaqs(page = 'all'): Promise<SuggestedFaq[]> {
    // VITE_API_URL already includes /api
    const resp = await fetch(`${import.meta.env.VITE_API_URL}/chat/faqs/suggested?page=${page}`);
    if (!resp.ok) return [];
    return resp.json();
  },

  async incrementFaqClick(id: number): Promise<void> {
    // VITE_API_URL already includes /api
    await fetch(`${import.meta.env.VITE_API_URL}/chat/faqs/${id}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStorage.getAccessToken() ?? ''}`,
      },
    });
  },
};
