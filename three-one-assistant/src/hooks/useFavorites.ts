import { useState, useEffect, useCallback } from 'react'
import { getFavorites, addFavorite, removeFavorite, isFavorite } from '@/lib/storage'

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    setFavorites(getFavorites())
  }, [])

  const toggle = useCallback((schoolId: string) => {
    if (isFavorite(schoolId)) {
      setFavorites(removeFavorite(schoolId))
    } else {
      setFavorites(addFavorite(schoolId))
    }
  }, [])

  const check = useCallback((schoolId: string) => {
    return favorites.includes(schoolId)
  }, [favorites])

  return { favorites, toggle, check }
}
