import { useState, useCallback } from 'react'
import type { School } from '@/types'

const MAX_COMPARE = 5

export function useCompare() {
  const [compareList, setCompareList] = useState<School[]>([])

  const addSchool = useCallback((school: School) => {
    setCompareList((prev) => {
      if (prev.length >= MAX_COMPARE) return prev
      if (prev.find((s) => s.id === school.id)) return prev
      return [...prev, school]
    })
  }, [])

  const removeSchool = useCallback((schoolId: string) => {
    setCompareList((prev) => prev.filter((s) => s.id !== schoolId))
  }, [])

  const isCompareMax = compareList.length >= MAX_COMPARE

  return { compareList, addSchool, removeSchool, isCompareMax }
}
