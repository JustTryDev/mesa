'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, X, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'

/**
 * 챗봇 플로팅 배너 컴포넌트
 *
 * 비유: 도서관의 안내 데스크 직원과 같습니다.
 * 평소에는 "질문 있으세요?" 표지판(플로팅 버튼)만 보이다가,
 * 클릭하면 대화 창이 열려서 MESA에 대해 물어볼 수 있습니다.
 *
 * 특징:
 * 1. 우측 하단 플로팅 버튼 (BookOpen 아이콘 — 학술 느낌)
 * 2. 클릭 시 채팅 패널이 애니메이션과 함께 열림
 * 3. 홈페이지 내용만 기반으로 답변 (OpenAI gpt-5.2 사용)
 * 4. 한국어/영어 다국어 지원
 */

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function ChatBot() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 새 메시지가 올 때 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 채팅 창이 열리면 입력창에 포커스
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // 메시지 전송
  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.message },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: t.chatbot.error },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t.chatbot.error },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Enter 키로 전송
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* 플로팅 버튼 — 우측 하단 */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-colors',
          'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900',
          'hover:bg-zinc-800 dark:hover:bg-zinc-100',
          isOpen && 'scale-0 opacity-0'
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="챗봇 열기"
      >
        <BookOpen className="w-6 h-6" />
      </motion.button>

      {/* 채팅 패널 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-50 w-[360px] sm:w-[400px] h-[520px] flex flex-col rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white dark:text-zinc-900" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {t.chatbot.title}
                  </p>
                  <p className="text-xs text-zinc-400">Powered by GPT</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-hide">
              {/* 인사 메시지 (항상 표시) */}
              {messages.length === 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-md bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-300">
                    {t.chatbot.greeting}
                  </div>
                </div>
              )}

              {/* 대화 메시지 */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                      msg.role === 'user'
                        ? 'rounded-tr-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                        : 'rounded-tl-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* 로딩 인디케이터 */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-zinc-100 dark:bg-zinc-800">
                    <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.chatbot.placeholder}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:ring-offset-1 disabled:opacity-50 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 disabled:opacity-30 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                  aria-label="전송"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
