import { create } from 'zustand'
import type { CalcInput, CalcResult, CalcHistoryRecord } from '@/types'
import { addCalcHistory, getCalcHistory, clearCalcHistory } from '@/lib/storage'

interface CalcStore {
  input: CalcInput
  result: CalcResult | null
  mode: 'forward' | 'reverse'
  history: CalcHistoryRecord[]
  setInput: (input: Partial<CalcInput>) => void
  setResult: (result: CalcResult | null) => void
  setMode: (mode: 'forward' | 'reverse') => void
  addRecord: (record: CalcHistoryRecord) => void
  loadHistory: () => void
  clearHistory: () => void
}

const defaultInput: CalcInput = {
  schoolId: '',
  xuekaoGrades: [{ subject: '语文', grade: 'B' }, { subject: '数学', grade: 'B' }],
  xiaokaoScore: null,
  gaokaoScore: null,
}

export const useCalcStore = create<CalcStore>((set) => ({
  input: defaultInput,
  result: null,
  mode: 'forward',
  history: [],
  setInput: (partial) =>
    set((state) => ({ input: { ...state.input, ...partial } })),
  setResult: (result) => set({ result }),
  setMode: (mode) => set({ mode }),
  addRecord: (record) => {
    addCalcHistory(record)
    set((state) => ({ history: [record, ...state.history].slice(0, 20) }))
  },
  loadHistory: () => set({ history: getCalcHistory() }),
  clearHistory: () => {
    clearCalcHistory()
    set({ history: [] })
  },
}))
