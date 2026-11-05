import { useState, useEffect, useCallback } from 'react'

export function useDraft(key: string): [string, (v: string) => void, () => void] {
  const [value, setValue] = useState(() => localStorage.getItem(key) ?? '')

  // The key changes without a remount — ClaimComposer keys on
  // claimDraftKey(parentId, side, viewer), which moves as the reader walks the
  // tree — so the draft has to be re-read when it does.
  //
  // Done during render rather than in an effect. React restarts the render
  // before committing, so the stale draft is never painted and the save effect
  // below never runs against a mismatched (key, value) pair. The effect version
  // rendered the previous key's text for a frame, then scheduled a save of it
  // under the NEW key, and only escaped writing it because the 500ms debounce
  // cleared the timer first.
  const [loadedKey, setLoadedKey] = useState(key)
  if (key !== loadedKey) {
    setLoadedKey(key)
    setValue(localStorage.getItem(key) ?? '')
  }

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
