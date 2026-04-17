import { useState, useEffect, useCallback } from 'react'

export function useDraft(key: string): [string, (v: string) => void, () => void] {
  const [value, setValue] = useState(() => localStorage.getItem(key) ?? '')

  useEffect(() => {
    setValue(localStorage.getItem(key) ?? '')
  }, [key])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value) {
        localStorage.setItem(key, value)
      } else {
        localStorage.removeItem(key)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [key, value])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(key)
    setValue('')
  }, [key])

  return [value, setValue, clearDraft]
}
