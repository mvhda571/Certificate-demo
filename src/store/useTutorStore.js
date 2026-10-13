import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const MAX_STORED_MESSAGES = 50;
const initialState = {
  messages: [],
  subject: 'general',
  webSearch: false,
};

export const useTutorStore = create(persist(
  (set) => ({
    ...initialState,
    setSubject: (subject) => set({ subject }),
    setWebSearch: (webSearch) => set({ webSearch }),
    addMessage: (message) => set((state) => ({
      messages: [...state.messages, message].slice(-MAX_STORED_MESSAGES),
    })),
    updateMessage: (id, updates) => set((state) => ({
      messages: state.messages.map((message) => (
        message.id === id ? { ...message, ...updates } : message
      )),
    })),
    newConversation: () => set({ messages: [] }),
  }),
  {
    name: 'certificate-ai-tutor',
    storage: createJSONStorage(() => localStorage),
    partialize: ({ messages, subject, webSearch }) => ({
      messages: messages.slice(-MAX_STORED_MESSAGES),
      subject,
      webSearch,
    }),
  },
));
