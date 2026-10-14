'use client'

import { useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Textarea } from '@/components/ui/textarea'

const SAVE_DELAY_MS = 600

export function GlossarySettings() {
  const [glossary, setGlossary] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const savedValueRef = useRef('')
  const latestValueRef = useRef('')
  latestValueRef.current = glossary

  useEffect(() => {
    let cancelled = false

    invoke<string>('get_user_glossary')
      .then((value) => {
        if (cancelled) return
        const next = value ?? ''
        savedValueRef.current = next
        setGlossary(next)
        setIsLoaded(true)
      })
      .catch((error) => {
        console.error('Failed to load glossary:', error)
        if (!cancelled) {
          setStatus('error')
          setErrorMessage('Не удалось загрузить словарь')
          setIsLoaded(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (!isLoaded || latestValueRef.current === savedValueRef.current) return
      void invoke('set_user_glossary', { glossary: latestValueRef.current })
        .then(() => {
          savedValueRef.current = latestValueRef.current
        })
        .catch((error) => {
          console.error('Failed to save glossary on close:', error)
        })
    }
  }, [isLoaded])

  useEffect(() => {
    if (!isLoaded || glossary === savedValueRef.current) return

    setStatus('saving')
    const timer = window.setTimeout(() => {
      invoke('set_user_glossary', { glossary })
        .then(() => {
          savedValueRef.current = glossary
          setStatus('saved')
          setErrorMessage('')
        })
        .catch((error) => {
          console.error('Failed to save glossary:', error)
          setStatus('error')
          setErrorMessage(error instanceof Error ? error.message : String(error))
        })
    }, SAVE_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [glossary, isLoaded])

  const statusText = status === 'saving'
    ? 'Сохраняется...'
    : status === 'saved'
      ? 'Сохранено. Действует для всех следующих записей и summary.'
      : status === 'error'
        ? errorMessage || 'Не удалось сохранить'
        : 'Заполняется один раз и хранится между запусками.'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Словарь</h3>
      <p className="text-sm text-gray-600 mb-4">
        Один список на всё приложение. Whisper получает начало списка как подсказку распознавания,
        замены <span className="font-mono">=&gt;</span> применяются к Whisper и Parakeet,
        а summary получает весь список при каждой генерации.
      </p>
      <Textarea
        value={glossary}
        onChange={(event) => setGlossary(event.target.value)}
        disabled={!isLoaded}
        spellCheck={false}
        className="min-h-[180px] font-mono text-sm"
        placeholder={'DrillOps\nWASAPI: звук Windows\nдриллопс => DrillOps\nстенд => стендап (планёрка)'}
      />
      <p className={`mt-3 text-xs ${status === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
        {statusText}
      </p>
      <p className="mt-2 text-xs text-gray-500">
        Строка без стрелки — термин или короткое пояснение. Строка <span className="font-mono">как слышится =&gt; как писать</span> заменяет слово в расшифровке. Звёздочка в конце основы, например <span className="font-mono">элсипишк* =&gt; LCP</span>, покрывает русские окончания. Строки с # — комментарии.
      </p>
    </div>
  )
}
