import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const MAX_CONVERSATIONS = 30;
export const MAX_MESSAGES_PER_CONVERSATION = 100;
const TITLE_LENGTH = 40;
const DEFAULT_SETTINGS = { subject: 'general', webSearch: false };

export function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createMessage(fields) {
  return { id: createId(), createdAt: Date.now(), ...fields };
}

// Suhbat nomi birinchi savoldan olinadi (~40 belgi).
export function makeConversationTitle(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > TITLE_LENGTH ? `${clean.slice(0, TITLE_LENGTH - 1).trimEnd()}…` : clean;
}

// Eng yangi 30 ta suhbat qoladi, eng eskisi avtomatik o'chadi.
function prune(conversations) {
  return [...conversations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS);
}

function mapConversation(conversations, id, update) {
  return conversations.map((conversation) => (conversation.id === id ? update(conversation) : conversation));
}

// Sahifa yangilanganda yarim qolgan javoblar "to'xtatildi" holatiga o'tadi.
function settleInterrupted(conversations) {
  return conversations.map((conversation) => ({
    ...conversation,
    messages: conversation.messages.map((message) => (
      message.status === 'streaming' ? { ...message, status: 'stopped', searching: false } : message
    )),
  }));
}

export const useTutorStore = create(persist(
  (set, get) => ({
    conversations: [],
    activeId: null,
    // Hali xabarsiz (ro'yxatga qo'shilmagan) yangi suhbat sozlamalari.
    draft: { ...DEFAULT_SETTINGS },

    // "Yangi suhbat" toza holatdan boshlanadi: Umumiy fan, internet o'chiq.
    startNewConversation: () => set({ activeId: null, draft: { ...DEFAULT_SETTINGS } }),
    selectConversation: (id) => set({ activeId: id }),

    // overrides: masalan IELTS Speaking uchun { mode, subject, webSearch, title }.
    createConversation: (firstMessage, overrides = {}) => {
      const now = Date.now();
      const { draft } = get();
      const conversation = {
        id: createId(),
        title: makeConversationTitle(overrides.title || firstMessage.content || firstMessage.titleHint),
        subject: overrides.subject ?? draft.subject,
        webSearch: overrides.webSearch ?? draft.webSearch,
        mode: overrides.mode ?? null,
        messages: [firstMessage],
        createdAt: now,
        updatedAt: now,
      };
      set((state) => ({ conversations: prune([conversation, ...state.conversations]), activeId: conversation.id }));
      return conversation.id;
    },

    addMessage: (conversationId, message) => set((state) => ({
      conversations: prune(mapConversation(state.conversations, conversationId, (conversation) => ({
        ...conversation,
        messages: [...conversation.messages, message].slice(-MAX_MESSAGES_PER_CONVERSATION),
        updatedAt: Date.now(),
      }))),
    })),

    updateMessage: (conversationId, messageId, updates) => set((state) => ({
      conversations: mapConversation(state.conversations, conversationId, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) => (
          message.id === messageId
            ? { ...message, ...(typeof updates === 'function' ? updates(message) : updates) }
            : message
        )),
      })),
    })),

    removeMessage: (conversationId, messageId) => set((state) => ({
      conversations: mapConversation(state.conversations, conversationId, (conversation) => ({
        ...conversation,
        messages: conversation.messages.filter((message) => message.id !== messageId),
      })),
    })),

    renameConversation: (id, title) => {
      const clean = makeConversationTitle(title);
      if (!clean) return;
      set((state) => ({
        conversations: mapConversation(state.conversations, id, (conversation) => ({ ...conversation, title: clean })),
      }));
    },

    deleteConversation: (id) => set((state) => ({
      conversations: state.conversations.filter((conversation) => conversation.id !== id),
      activeId: state.activeId === id ? null : state.activeId,
    })),

    // Fan va internet sozlamasi faol suhbatga, u bo'lmasa yangi suhbat qoralamasiga yoziladi.
    updateSettings: (settings) => set((state) => (state.activeId
      ? {
        conversations: mapConversation(state.conversations, state.activeId, (conversation) => ({
          ...conversation,
          ...settings,
        })),
      }
      : { draft: { ...state.draft, ...settings } })),
  }),
  {
    name: 'certificate-ai-tutor',
    version: 2,
    storage: createJSONStorage(() => localStorage),
    partialize: ({ conversations, activeId, draft }) => ({ conversations, activeId, draft }),
    // 1-versiya: bitta suhbat ({ messages, subject, webSearch }) → suhbatlar ro'yxati.
    migrate: (persisted, version) => {
      if (version >= 2 || !persisted) return persisted;
      const messages = Array.isArray(persisted.messages)
        ? persisted.messages.filter((message) => message?.id && typeof message.content === 'string')
        : [];
      const firstUser = messages.find((message) => message.role === 'user');
      const settings = {
        subject: typeof persisted.subject === 'string' ? persisted.subject : DEFAULT_SETTINGS.subject,
        webSearch: Boolean(persisted.webSearch),
      };
      if (!messages.length || !firstUser) return { conversations: [], activeId: null, draft: settings };
      const now = Date.now();
      const conversation = {
        id: createId(),
        title: makeConversationTitle(firstUser.content),
        ...settings,
        messages: messages.slice(-MAX_MESSAGES_PER_CONVERSATION),
        createdAt: now,
        updatedAt: now,
      };
      return { conversations: [conversation], activeId: conversation.id, draft: settings };
    },
    merge: (persisted, current) => {
      const conversations = Array.isArray(persisted?.conversations) ? persisted.conversations : [];
      return {
        ...current,
        ...persisted,
        conversations: settleInterrupted(conversations),
        activeId: conversations.some((item) => item.id === persisted?.activeId) ? persisted.activeId : null,
        draft: { ...DEFAULT_SETTINGS, ...persisted?.draft },
      };
    },
  },
));

// Yuborilgan rasmlar faqat shu sessiya xotirasida turadi (localStorage tez to'lib qoladi).
// Saqlanadigan xabarda faqat imageCount qoladi.
export const useTutorAttachments = create(() => ({ images: {} }));
export const setMessageImages = (messageId, dataUrls) => useTutorAttachments.setState((state) => ({
  images: { ...state.images, [messageId]: dataUrls },
}));

export function useActiveConversation() {
  return useTutorStore((state) => state.conversations.find((conversation) => conversation.id === state.activeId) || null);
}
