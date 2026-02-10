"use client"

import { useRef, useCallback, useEffect, useState } from "react"

interface UseAutosaveOptions<T> {
  data: T
  onSave: (data: T) => void
  interval?: number // ms, default 2000
  enabled?: boolean
}

export function useAutosave<T>({
  data,
  onSave,
  interval = 2000,
  enabled = true,
}: UseAutosaveOptions<T>) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const dataRef = useRef(data)
  const savedDataRef = useRef<string>("")
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // Keep dataRef in sync
  dataRef.current = data

  const save = useCallback(() => {
    const currentData = JSON.stringify(dataRef.current)
    if (currentData === savedDataRef.current) return

    setIsSaving(true)
    onSave(dataRef.current)
    savedDataRef.current = currentData
    setLastSaved(new Date())

    // Brief visual indicator
    setTimeout(() => setIsSaving(false), 600)
  }, [onSave])

  // Set up interval-based autosave
  useEffect(() => {
    if (!enabled) return

    timerRef.current = setInterval(save, interval)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [save, interval, enabled])

  // Save on unmount
  useEffect(() => {
    return () => {
      save()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initialize savedDataRef with initial data
  useEffect(() => {
    savedDataRef.current = JSON.stringify(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { lastSaved, isSaving, saveNow: save }
}
