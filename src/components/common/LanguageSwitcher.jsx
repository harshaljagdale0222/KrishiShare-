import { useState, useRef, useEffect } from 'react'
import { Globe, Check } from 'lucide-react'
import useLanguageStore from '../../store/languageStore'

const languages = [
  { code: 'mr', label: 'मराठी',   flag: '🇮🇳', native: 'मराठी'   },
  { code: 'hi', label: 'हिंदी',   flag: '🇮🇳', native: 'हिंदी'   },
  { code: 'en', label: 'English', flag: '🇬🇧', native: 'English' },
]

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = languages.find(l => l.code === language) || languages[0]

  // Outside click ne close
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 rounded-xl transition text-sm font-medium text-gray-700"
      >
        <Globe size={15} className="text-primary-600" />
        <span>{current.flag} {current.native}</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang.code); setOpen(false) }}
              className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-gray-50 transition
                ${language === lang.code ? 'text-primary-600 font-semibold bg-primary-50' : 'text-gray-700'}`}
            >
              <span>{lang.flag} {lang.native}</span>
              {language === lang.code && <Check size={14} className="text-primary-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}