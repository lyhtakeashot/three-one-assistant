import { create } from 'zustand'
import type { FilterState, TierType } from '@/types'

interface FilterStore extends FilterState {
  setSelectedSubjects: (subjects: string[]) => void
  toggleSubject: (subject: string) => void
  setMinACount: (count: number) => void
  setMinBCount: (count: number) => void
  setSearchQuery: (query: string) => void
  setTierFilter: (tier: TierType) => void
  setCategoryFilter: (category: string | null) => void
  reset: () => void
}

const initialState: FilterState = {
  selectedSubjects: [],
  minACount: 0,
  minBCount: 0,
  searchQuery: '',
  tierFilter: 'all',
  categoryFilter: null,
}

export const useFilterStore = create<FilterStore>((set) => ({
  ...initialState,
  setSelectedSubjects: (subjects) => set({ selectedSubjects: subjects }),
  toggleSubject: (subject) =>
    set((state) => ({
      selectedSubjects: state.selectedSubjects.includes(subject)
        ? state.selectedSubjects.filter((s) => s !== subject)
        : [...state.selectedSubjects, subject],
    })),
  setMinACount: (count) => set({ minACount: count }),
  setMinBCount: (count) => set({ minBCount: count }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setTierFilter: (tier) => set({ tierFilter: tier }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  reset: () => set(initialState),
}))
