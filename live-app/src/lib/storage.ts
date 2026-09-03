import { STORAGE_KEYS } from './constants'
import type { CalcHistoryRecord, ProfileData } from '@/types'

// 收藏夹操作
export function getFavorites(): string[] {
  const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES)
  return raw ? JSON.parse(raw) : []
}

export function addFavorite(schoolId: string): string[] {
  const current = getFavorites()
  if (current.includes(schoolId)) return current
  const updated = [...current, schoolId]
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated))
  return updated
}

export function removeFavorite(schoolId: string): string[] {
  const current = getFavorites()
  const updated = current.filter((id) => id !== schoolId)
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated))
  return updated
}

export function isFavorite(schoolId: string): boolean {
  return getFavorites().includes(schoolId)
}

// 计算历史操作
export function getCalcHistory(): CalcHistoryRecord[] {
  const raw = localStorage.getItem(STORAGE_KEYS.CALC_HISTORY)
  return raw ? JSON.parse(raw) : []
}

export function addCalcHistory(record: CalcHistoryRecord): void {
  const current = getCalcHistory()
  const updated = [record, ...current].slice(0, 20)
  localStorage.setItem(STORAGE_KEYS.CALC_HISTORY, JSON.stringify(updated))
}

export function clearCalcHistory(): void {
  localStorage.setItem(STORAGE_KEYS.CALC_HISTORY, JSON.stringify([]))
}

// 档案操作
export function getProfile(): ProfileData | null {
  const raw = localStorage.getItem(STORAGE_KEYS.PROFILE)
  return raw ? JSON.parse(raw) : null
}

export function saveProfile(data: ProfileData): void {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data))
}
