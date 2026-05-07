import { useState, useEffect } from 'react'
import {
  Cloud, Sun, CloudRain, Wind, Droplets,
  Thermometer, MapPin, RefreshCw,
  Search, X, Locate, Compass, Eye, Gauge,
  Sunrise, Sunset, Moon, ChevronRight
} from 'lucide-react'
import useLanguageStore from '../../store/languageStore'

function getWeatherTheme(code, isDay = 1) {
  if (code === 0) return { icon: isDay ? '☀️' : '🌙', labelKey: 'swachhAakaash' }
  if (code <= 3) return { icon: isDay ? '⛅' : '☁️', labelKey: 'partiallyCloudy' }
  if (code <= 49) return { icon: '🌫️', labelKey: 'dhukyachaMausam' }
  if (code <= 69 || (code >= 80 && code <= 82)) return { icon: '🌧️', labelKey: 'paaus' }
  if (code <= 79) return { icon: '❄️', labelKey: 'baraf' }
  return { icon: '⛈️', labelKey: 'thunderstorm' }
}

const getAQIStatus = (aqi) => {
  if (!aqi) return { label: 'Good', color: 'bg-green-500' }
  if (aqi <= 50) return { label: 'Good', color: 'bg-green-500' }
  if (aqi <= 100) return { label: 'Satisfactory', color: 'bg-lime-400' }
  if (aqi <= 200) return { label: 'Moderate', color: 'bg-yellow-500' }
  return { label: 'Poor', color: 'bg-red-500' }
}

const getUVStatus = (uv) => {
  if (uv <= 2) return { label: 'Low', color: 'bg-green-500' }
  if (uv <= 5) return { label: 'Moderate', color: 'bg-yellow-500' }
  if (uv <= 7) return { label: 'High', color: 'bg-orange-500' }
  return { label: 'Extreme', color: 'bg-red-500' }
}

export default function WeatherPage() {
  const [weather, setWeather] = useState(null)
  const [aqiValue, setAqiValue] = useState(null)
  const [selectedLoc, setSelectedLoc] = useState({ name: 'Pune', subLoc: 'Shivajinagar', lat: 18.5204, lon: 73.8567 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const { t, language } = useLanguageStore()

  const fetchWeather = async (lat, lon, city, area) => {
    setLoading(true)
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,uv_index` +
        `&hourly=temperature_2m,weather_code,relative_humidity_2m,visibility,precipitation_probability` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum` +
        `&timezone=Asia%2FKolkata&forecast_days=7`
      )
      const data = await res.json()

      const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`)
      if (aqiRes.ok) {
        const aqiData = await aqiRes.json()
        setAqiValue(aqiData.current.us_aqi)
      }

      setWeather(data)
      setSelectedLoc({ name: city, subLoc: area, lat, lon })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const detectLocation = () => {
    setLoading(true)
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
          const geo = await res.json()
          const adr = geo.address
          const city = adr.city || adr.town || adr.district || 'Maharashtra'
          const area = adr.suburb || adr.neighbourhood || adr.village || adr.hamlet || adr.suburb || city
          const displayArea = (area.toLowerCase() === city.toLowerCase()) ? 'Current Area' : area
          fetchWeather(latitude, longitude, city, displayArea)
        } catch {
          fetchWeather(latitude, longitude, 'Pune', 'Shivajinagar')
        }
      },
      () => fetchWeather(18.5204, 73.8567, 'Pune', 'Shivajinagar'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery) return
    setIsSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1&addressdetails=1`)
      const data = await res.json()
      if (data.length > 0) {
        const { lat, lon, address } = data[0]
        const city = address.city || address.town || address.district || 'Location'
        const area = address.suburb || address.neighbourhood || address.village || city
        fetchWeather(lat, lon, city, area)
      }
    } finally {
      setIsSearching(false)
      setSearchQuery('')
    }
  }

  useEffect(() => { detectLocation() }, [])

  const current = weather?.current
  const daily = weather?.daily
  const hourly = weather?.hourly

  const next24 = hourly ? hourly.time.slice(0, 24).map((time, i) => ({
    time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temp: Math.round(hourly.temperature_2m[i]),
    code: hourly.weather_code[i],
    rain: hourly.precipitation_probability[i]
  })) : []

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-outfit">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <img src="/weather-bg.png" className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
      </div>

      <div className="relative z-10 p-6 pt-16 max-w-xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-white text-left drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center ring-2 ring-white/10 shadow-2xl">
              <MapPin size={28} className="fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            </div>
            <div>
              <h2 className="text-4xl font-black italic tracking-tighter leading-none">{selectedLoc.name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <Locate size={12} className={loading ? "animate-pulse text-amber-400" : "text-amber-400"} />
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-amber-400">{selectedLoc.subLoc}</p>
              </div>
            </div>
          </div>
          <button onClick={detectLocation} className="w-12 h-12 bg-white/10 backdrop-blur-3xl rounded-2xl flex items-center justify-center text-white ring-1 ring-white/20 shadow-xl">
            <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {!weather ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-white space-y-6">
            <div className="w-10 h-10 border-4 border-white/20 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Connecting to climate sensors...</p>
          </div>
        ) : (
          <>
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search specific area (e.g. Nashik)"
                  className="w-full bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[25px] px-8 py-5 text-white font-black placeholder:text-white/30 outline-none focus:ring-2 ring-amber-400/50 transition-all font-outfit"
                />
                <button type="submit" className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                  {isSearching ? <RefreshCw size={20} className="animate-spin" /> : <Search size={22} />}
                </button>
              </form>

              {/* Main Temp */}
              <div className="text-center text-white py-10">
                <h1 className="text-[140px] font-black leading-none tracking-tighter mb-2 drop-shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                  {Math.round(current.temperature_2m)}°
                </h1>
                <p className="text-3xl font-black italic tracking-tight opacity-95">{t(getWeatherTheme(current.weather_code).labelKey)}</p>
                <p className="text-lg font-black tracking-widest mt-2">{`↑${Math.round(daily.temperature_2m_max[0])}° / ↓${Math.round(daily.temperature_2m_min[0])}°`}</p>
              </div>

              {/* Summary */}
              <div className="bg-white/10 backdrop-blur-3xl rounded-[35px] border border-white/20 p-8 shadow-2xl">
                <p className="text-white font-black text-xl leading-snug tracking-tight">
                  Highs of {Math.round(daily.temperature_2m_max[0])}-{Math.round(daily.temperature_2m_max[0] + 2)}°C. Perfect for field work.
                </p>
              </div>

              {/* Hourly Section */}
              <div className="bg-white/15 backdrop-blur-3xl rounded-[35px] border border-white/25 p-6 shadow-2xl overflow-hidden">
                <h4 className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em] mb-4 ml-2 italic">Hourly Forecast</h4>
                <div className="flex gap-10 overflow-x-auto pb-4 scrollbar-hide px-2">
                  {next24.map((h, i) => (
                    <div key={i} className="flex flex-col items-center gap-4 shrink-0 min-w-[70px]">
                      <span className="text-[12px] font-black text-white/50">{i === 0 ? 'Now' : h.time}</span>
                      <span className="text-3xl filter drop-shadow-lg">{getWeatherTheme(h.code).icon}</span>
                      <span className="text-xl font-black text-white">{h.temp}°</span>
                      <span className="text-[11px] font-black text-cyan-400">{h.rain}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Stats */}
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-white/15 backdrop-blur-3xl rounded-[40px] border border-white/30 p-8 flex flex-col justify-between aspect-square shadow-2xl">
                  <div className="text-white/50 text-[11px] font-black uppercase tracking-[0.3em]">AQI</div>
                  <div className="space-y-4">
                    <h4 className="text-white font-black text-3xl tracking-tighter leading-none">{getAQIStatus(aqiValue).label}({aqiValue || 0})</h4>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${getAQIStatus(aqiValue).color}`} style={{ width: `${Math.min(100, (aqiValue / 400) * 100)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="bg-white/15 backdrop-blur-3xl rounded-[40px] border border-white/30 p-8 flex flex-col justify-between aspect-square shadow-2xl">
                  <div className="text-white/50 text-[11px] font-black uppercase tracking-[0.3em]">UV INDEX</div>
                  <div className="space-y-1">
                    <p className="text-white/80 font-black text-sm">{getUVStatus(current.uv_index).label}</p>
                    <h4 className="text-white font-black text-6xl leading-none tracking-tighter drop-shadow-xl">{Math.round(current.uv_index)}</h4>
                    <div className="h-1.5 w-full bg-white/10 rounded-full mt-6 overflow-hidden">
                      <div className={`h-full ${getUVStatus(current.uv_index).color}`} style={{ width: `${Math.min(100, (current.uv_index / 15) * 100)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="bg-white/15 backdrop-blur-3xl rounded-[40px] border border-white/30 p-8 flex flex-col justify-between aspect-square shadow-2xl">
                  <div className="text-white/50 text-[11px] font-black uppercase tracking-[0.3em]">HUMIDITY</div>
                  <div>
                    <p className="text-white/80 font-black text-[10px] mb-2">Lower than yesterday</p>
                    <h4 className="text-white font-black text-6xl leading-none drop-shadow-xl">{current.relative_humidity_2m}%</h4>
                  </div>
                </div>
                <div className="bg-white/15 backdrop-blur-3xl rounded-[40px] border border-white/30 p-8 flex flex-col justify-between aspect-square shadow-2xl">
                  <div className="text-white/50 text-[11px] font-black uppercase tracking-[0.3em]">WIND</div>
                  <div className="flex items-center gap-4">
                    <h4 className="text-white font-black text-5xl leading-none tracking-tighter drop-shadow-xl">{Math.round(current.wind_speed_10m)}</h4>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[10px] font-black text-white/40 leading-none">KM/H</span>
                      <Compass size={22} className="text-white/20" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 7-Day List */}
              <div className="bg-white/10 backdrop-blur-3xl rounded-[40px] border border-white/20 p-8 shadow-2xl">
                <h4 className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em] mb-6 italic">7-Day Forecast</h4>
                <div className="space-y-8">
                  {daily.time.map((date, i) => {
                    const day = i === 0 ? 'Today' : new Date(date).toLocaleDateString([], { weekday: 'long' })
                    return (
                      <div key={date} className="flex items-center justify-between text-white">
                        <span className="w-24 font-black text-lg">{day}</span>
                        <div className="flex items-center gap-4 flex-1 justify-center">
                          <span className="text-[10px] font-black text-white/40">{Math.round(daily.precipitation_sum[i])}%</span>
                          <span className="text-3xl">{getWeatherTheme(daily.weather_code[i]).icon}</span>
                        </div>
                        <div className="flex gap-6 font-black min-w-[80px] justify-end">
                          <span className="text-xl">{Math.round(daily.temperature_2m_max[i])}°</span>
                          <span className="text-xl opacity-30">{Math.round(daily.temperature_2m_min[i])}°</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Sun/Moon */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-3xl rounded-[35px] border border-white/20 p-6 space-y-4">
                  <p className="text-white/40 text-[10px] font-black uppercase">Sunrise</p>
                  <p className="text-white font-black text-3xl">{new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-white/40 text-[10px] font-black uppercase mt-4">Sunset</p>
                  <p className="text-white font-black text-3xl">{new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-3xl rounded-[35px] border border-white/20 p-6 flex flex-col justify-between">
                  <p className="text-white/40 text-[10px] font-black uppercase">Moon Phase</p>
                  <div className="text-white">
                    <Moon size={32} className="opacity-20 mb-3" />
                    <p className="font-black text-sm">Waxing Crescent</p>
                    <p className="text-[9px] opacity-40 font-bold uppercase mt-2">Rise 11:31 AM</p>
                    <p className="text-[9px] opacity-40 font-bold uppercase">Set 12:18 AM</p>
                  </div>
                </div>
              </div>
            </div>

            <style dangerouslySetInnerHTML={{
              __html: `
              .scrollbar-hide::-webkit-scrollbar { display: none; }
              .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
          </>
        )}
      </div>
    </div>
  )
}