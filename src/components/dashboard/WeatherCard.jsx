import { Droplets, Wind, CloudRain } from 'lucide-react'
import { useState, useEffect } from 'react'
import useLanguageStore from '../../store/languageStore'

const getWeatherData = (t, language) => {
  const isMR = language === 'mr'
  const isHI = language === 'hi'

  return {
    city: isMR ? 'पुणे, महाराष्ट्र' : isHI ? 'पुणे, महाराष्ट्र' : 'Pune, Maharashtra',
    temp: 28,
    feelsLike: 31,
    condition: isMR ? 'थोडं ढगाळ' : isHI ? 'आंशिक रूप से बादल' : 'Partly Cloudy',
    humidity: 65,
    wind: 12,
    forecast: [
      { day: isMR ? 'आज' : isHI ? 'आज' : 'Today',    icon: '⛅', high: 28, low: 18, rain: '20%' },
      { day: isMR ? 'उद्या' : isHI ? 'कल' : 'Tom.',  icon: '🌧️', high: 24, low: 17, rain: '80%' },
      { day: isMR ? 'परवा' : isHI ? 'परसों' : 'Day 3', icon: '🌦️', high: 26, low: 19, rain: '50%' },
      { day: isMR ? 'गुरु' : isHI ? 'गुरु' : 'Thu',    icon: '☀️', high: 31, low: 20, rain: '5%'  },
      { day: isMR ? 'शुक्र' : isHI ? 'शुक्र' : 'Fri',   icon: '☀️', high: 33, low: 21, rain: '0%'  },
    ],
    advice: isMR ? '🌧️ उद्या पाऊस आहे — आज शेतात पाणी देऊ नका!' : isHI ? '🌧️ कल बारिश है — आज खेत में पानी न दें!' : '🌧️ Rain expected tomorrow — avoid watering today!',
  }
}

export default function WeatherCard() {
  const { t, language } = useLanguageStore()
  const weatherData = getWeatherData(t, language)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-blue-100 text-sm">📍 {weatherData.city}</p>
          <p className="text-blue-200 text-xs mt-0.5">
            {time.toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="text-5xl">⛅</div>
      </div>

      <div className="mb-4">
        <div className="flex items-end gap-2">
          <span className="text-6xl font-bold">{weatherData.temp}°</span>
          <span className="text-blue-200 mb-2">C</span>
        </div>
        <p className="text-blue-100">{weatherData.condition}</p>
        <p className="text-blue-200 text-sm">{t('feelsLike')} {weatherData.feelsLike}°C</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <Droplets size={16} className="mx-auto mb-1 text-blue-200" />
          <p className="font-bold text-sm">{weatherData.humidity}%</p>
          <p className="text-blue-200 text-xs">{t('humidity')}</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <Wind size={16} className="mx-auto mb-1 text-blue-200" />
          <p className="font-bold text-sm">{weatherData.wind} km/h</p>
          <p className="text-blue-200 text-xs">{t('wind')}</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <CloudRain size={16} className="mx-auto mb-1 text-blue-200" />
          <p className="font-bold text-sm">20%</p>
          <p className="text-blue-200 text-xs">{t('rain')}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1 mb-4">
        {weatherData.forecast.map((day) => (
          <div key={day.day} className="bg-white/10 rounded-xl p-2 text-center">
            <p className="text-blue-200 text-xs mb-1">{day.day}</p>
            <p className="text-lg">{day.icon}</p>
            <p className="text-xs font-bold">{day.high}°</p>
            <p className="text-blue-300 text-xs">{day.rain}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/15 rounded-xl p-3">
        <p className="text-sm font-medium">🌾 {t('weatherAdvice')}:</p>
        <p className="text-blue-100 text-sm mt-0.5">{weatherData.advice}</p>
      </div>
    </div>
  )
}