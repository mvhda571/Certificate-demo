import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiBookOpen,
  FiCheck,
  FiCopy,
  FiGlobe,
  FiMessageCircle,
  FiPlus,
  FiSend,
  FiStopCircle,
} from 'react-icons/fi';
import { useTutorStore } from '../store/useTutorStore.js';
import { useThemeStore } from '../store/themeStore';
import 'katex/dist/katex.min.css';
import './TutorPage.css';

const MAX_LENGTH = 4000;
const subjects = ['general', 'ielts', 'sat', 'mathematics', 'language', 'literature', 'history', 'english'];

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function TutorPage() {
  const { t } = useTranslation();
  const language = useThemeStore((state) => state.language);
  const setLanguage = useThemeStore((state) => state.setLanguage);
  const messages = useTutorStore((state) => state.messages);
  const subject = useTutorStore((state) => state.subject);
  const webSearch = useTutorStore((state) => state.webSearch);
  const setSubject = useTutorStore((state) => state.setSubject);
  const setWebSearch = useTutorStore((state) => state.setWebSearch);
  const addMessage = useTutorStore((state) => state.addMessage);
  const updateMessage = useTutorStore((state) => state.updateMessage);
  const newConversation = useTutorStore((state) => state.newConversation);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const abortRef = useRef(null);
  const textareaRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function resizeTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }

  async function sendMessage(text = input, retryMessageId) {
    const retryUserMessage = retryMessageId
      ? messages.find((message) => message.id === retryMessageId)
      : null;
    const content = (retryUserMessage?.content || text).trim();
    if (!content || sending) return;

    const userMessage = retryUserMessage || { id: createId(), role: 'user', content };
    if (!userMessage) return;

    if (!retryMessageId) addMessage(userMessage);
    const assistantId = createId();
    addMessage({ id: assistantId, role: 'assistant', content: '', status: 'streaming', sources: { web: [], notes: [] } });
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const history = retryMessageId
      ? messages.slice(0, messages.findIndex((message) => message.id === retryMessageId) + 1)
      : [...messages, userMessage];
    const apiMessages = history
      .filter((message) => message.status !== 'error' && message.status !== 'streaming')
      .slice(-12)
      .map(({ role, content: messageContent }) => ({ role, content: messageContent }));

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
        body: JSON.stringify({ messages: apiMessages, subject, webSearch }),
        signal: controller.signal,
      });
      if (!response.ok) {
        let message = `Server error (${response.status})`;
        try {
          const errorBody = await response.json();
          if (typeof errorBody.error === 'string') message = errorBody.error;
        } catch {
          // Keep the useful HTTP status message when the server response is not JSON.
        }
        throw new Error(message);
      }
      if (!response.body) throw new Error('Oqimli javobni o‘qib bo‘lmadi.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === 'delta') {
            updateMessage(assistantId, {
              content: (useTutorStore.getState().messages.find((message) => message.id === assistantId)?.content || '') + event.text,
            });
          } else if (event.type === 'sources') {
            updateMessage(assistantId, { sources: { web: event.web || [], notes: event.notes || [] } });
          } else if (event.type === 'done') {
            updateMessage(assistantId, { status: 'done', model: event.model });
          } else if (event.type === 'error') {
            throw new Error(event.message || t('tutor.error'));
          }
        }
        if (done) break;
      }
      if (buffer.trim()) {
        const event = JSON.parse(buffer);
        if (event.type === 'done') updateMessage(assistantId, { status: 'done', model: event.model });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        updateMessage(assistantId, { status: 'stopped' });
      } else {
        updateMessage(assistantId, { status: 'error', error: error.message || t('tutor.error') });
      }
    } finally {
      abortRef.current = null;
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function stopResponse() {
    abortRef.current?.abort();
  }

  async function copyMessage(message) {
    await navigator.clipboard.writeText(message.content);
    setCopiedId(message.id);
    window.setTimeout(() => setCopiedId(''), 1800);
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  const exampleQuestions = t('tutor.examples', { returnObjects: true });

  return (
    <div className="tutor-shell">
      <div className="tutor-layout">
        <section className="hero-panel">
          <div className="hero-topline">
            <div className="brand-mark"><FiBookOpen aria-hidden="true" /></div>
            <div className="language-switch" aria-label="Language">
              {['uz', 'en', 'ru'].map((item) => (
                <button
                  className={language === item ? 'language-option active' : 'language-option'}
                  key={item}
                  onClick={() => setLanguage(item)}
                  type="button"
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <p className="eyebrow">{t('tutor.eyebrow')}</p>
          <h1 className="page-title">{t('tutor.title')}</h1>
          <p className="hero-description">{t('tutor.description')}</p>
          <div className="subject-row" aria-label={t('tutor.examplesTitle')}>
            {subjects.map((item) => (
              <button
                className={`pill subject-pill${subject === item ? ' selected' : ''}`}
                key={item}
                onClick={() => setSubject(item)}
                type="button"
              >
                {t(`tutor.subjects.${item}`)}
              </button>
            ))}
          </div>
          <div className="hero-actions">
            <button
              aria-pressed={webSearch}
              className={`btn-secondary web-toggle${webSearch ? ' enabled' : ''}`}
              onClick={() => setWebSearch(!webSearch)}
              type="button"
            >
              <FiGlobe aria-hidden="true" />
              {webSearch ? t('tutor.internetOn') : t('tutor.internet')}
            </button>
            <button
              className="btn-secondary"
              disabled={!messages.length || sending}
              onClick={() => newConversation()}
              type="button"
            >
              <FiPlus aria-hidden="true" />
              {t('tutor.newChat')}
            </button>
          </div>
        </section>

        <section aria-label={t('tutor.ai')} className="card-panel chat-panel">
          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="empty-state"
                exit={{ opacity: 0, y: -8 }}
                initial={{ opacity: 0, y: 8 }}
                key="empty"
              >
                <div className="empty-icon"><FiMessageCircle aria-hidden="true" /></div>
                <h2>{t('tutor.examplesTitle')}</h2>
                <p>{t('tutor.empty')}</p>
                <div className="example-grid">
                  {exampleQuestions.map((question) => (
                    <button className="example-card" key={question} onClick={() => sendMessage(question)} type="button">
                      <span>{question}</span>
                      <FiSend aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                animate={{ opacity: 1 }}
                className="message-list"
                initial={{ opacity: 0 }}
                key="messages"
              >
                {messages.map((message) => (
                  <article className={`message-row ${message.role}`} key={message.id}>
                    <div className="message-avatar">{message.role === 'assistant' ? <FiBookOpen aria-hidden="true" /> : t('tutor.you').slice(0, 1)}</div>
                    <div className="message-content">
                      <div className="message-heading">
                        <strong>{message.role === 'assistant' ? t('tutor.ai') : t('tutor.you')}</strong>
                        {message.model && <span className="model-label">{t('tutor.model', { model: message.model })}</span>}
                      </div>
                      <div className="markdown-body">
                        {message.role === 'assistant' ? (
                          message.content ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {message.content}
                            </ReactMarkdown>
                          ) : message.status === 'streaming' ? (
                            <span className="typing-indicator" aria-label={t('tutor.thinking')}><i /><i /><i /></span>
                          ) : null
                        ) : <p>{message.content}</p>}
                        {message.status === 'streaming' && message.content && <span className="stream-cursor" />}
                      </div>
                      {message.role === 'assistant' && message.status === 'streaming' && !message.content && (
                        <p className="thinking-label">{t('tutor.thinking')}</p>
                      )}
                      {message.error && <p className="error-message">{message.error}</p>}
                      {message.status === 'stopped' && <p className="stopped-label">{t('tutor.stopped')}</p>}
                      {message.role === 'assistant' && (
                        <>
                          {!!message.sources?.web?.length && (
                            <div className="source-section">
                              <span className="source-label"><FiGlobe aria-hidden="true" />{t('tutor.webSources')}</span>
                              <div className="source-list">
                                {message.sources.web.map((source) => (
                                  <a href={source.url} key={source.url} rel="noreferrer" target="_blank">{source.title}</a>
                                ))}
                              </div>
                            </div>
                          )}
                          {!!message.sources?.notes?.length && (
                            <div className="source-section">
                              <span className="source-label"><FiBookOpen aria-hidden="true" />{t('tutor.notes')}</span>
                              <div className="source-list">
                                {message.sources.notes.map((note, index) => (
                                  <span className="note-source" key={`${note.title}-${note.heading}-${index}`}>
                                    {note.title}{note.heading ? ` · ${note.heading}` : ''}
                                    {note.fan && ` · ${t('tutor.noteMeta', { fan: note.fan, sinf: note.sinf || '' })}`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="message-tools">
                            {message.content && (
                              <button className="text-action" onClick={() => copyMessage(message)} type="button">
                                {copiedId === message.id ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
                                {copiedId === message.id ? t('tutor.copied') : t('tutor.copy')}
                              </button>
                            )}
                            {message.status === 'error' && (
                              <button
                                className="text-action retry-action"
                                onClick={() => {
                                  const index = messages.findIndex((item) => item.id === message.id);
                                  const previousUserMessage = messages.slice(0, index).reverse()
                                    .find((item) => item.role === 'user');
                                  if (previousUserMessage) {
                                    sendMessage(previousUserMessage.content, previousUserMessage.id);
                                  }
                                }}
                                type="button"
                              >
                                {t('tutor.retry')}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                ))}
                <div ref={bottomRef} />
              </motion.div>
            )}
          </AnimatePresence>

          <form className="composer" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="tutor-input">{t('tutor.placeholder')}</label>
            <textarea
              id="tutor-input"
              maxLength={MAX_LENGTH}
              onChange={(event) => {
                setInput(event.target.value);
                resizeTextarea();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={t('tutor.placeholder')}
              ref={textareaRef}
              rows={1}
              value={input}
            />
            <div className="composer-footer">
              <span className="composer-hint">{t('tutor.hint')}</span>
              <div className="composer-controls">
                <span className="character-count">{t('tutor.characters', { count: input.length })}</span>
                {sending ? (
                  <button aria-label={t('tutor.stop')} className="send-button stop-button" onClick={stopResponse} type="button">
                    <FiStopCircle aria-hidden="true" /><span>{t('tutor.stop')}</span>
                  </button>
                ) : (
                  <button aria-label={t('tutor.send')} className="send-button" disabled={!input.trim()} type="submit">
                    <FiSend aria-hidden="true" /><span>{t('tutor.send')}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </section>
        <footer className="page-footer">Certificate AI <span>·</span> {t('tutor.footer')}</footer>
      </div>
    </div>
  );
}
