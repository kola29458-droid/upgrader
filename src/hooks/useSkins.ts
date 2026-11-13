import { useEffect, useState } from 'react'
import type { Skin } from '../components/SkinCatalog'

type Status = 'loading' | 'ready' | 'error'

// Каталог загружается один раз и дальше берётся из памяти
let cache: Skin[] | null = null
let pending: Promise<Skin[]> | null = null

function loadSkins(): Promise<Skin[]> {
  if (cache) return Promise.resolve(cache)

  if (!pending) {
    pending = fetch('/skins.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<Skin[]>
      })
      .then((data) => {
        cache = data
        return data
      })
      .catch((error) => {
        pending = null
        throw error
      })
  }

  return pending
}

export function useSkins() {
  const [skins, setSkins] = useState<Skin[]>(cache ?? [])
  const [status, setStatus] = useState<Status>(cache ? 'ready' : 'loading')

  useEffect(() => {
    if (cache) return undefined

    let cancelled = false

    loadSkins()
      .then((data) => {
        if (cancelled) return
        setSkins(data)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { skins, status }
}
