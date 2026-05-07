import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import translations from '../utils/translations'

const useLanguageStore = create(
  persist(
    (set, get) => ({
      language: 'mr', // Default Marathi

      setLanguage: (lang) => set({ language: lang }),

      // Helper - translation gheta
      t: (key) => {
        const lang = get().language
        return translations[lang]?.[key] || translations['en'][key] || key
      },
    }),
    {
      name: 'krishi-language',
    }
  )
)

export default useLanguageStore