import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Smartphone, Mail, ShieldCheck } from 'lucide-react'
import { useGoogleLogin, useGoogleOneTapLogin, GoogleLogin } from '@react-oauth/google'
import useAuthStore from '../../store/authStore'
import useLanguageStore from '../../store/languageStore'
import toast from 'react-hot-toast'

export default function Login() {
  const [mode, setMode] = useState('password') // 'password' or 'otp'
  const [step, setStep] = useState(1) // 1: Email, 2: OTP
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [timer, setTimer] = useState(0)
  const [canResend, setCanResend] = useState(false)

  const { login, googleLogin, sendOTP, verifyOTP, loading } = useAuthStore()
  const { t, language } = useLanguageStore()
  const navigate = useNavigate()
  const isMR = language === 'mr'

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const res = await googleLogin(tokenResponse.access_token)
      if (res.success) {
        if (!res.user?.phone || !res.user?.location) navigate('/complete-profile')
        else navigate(res.user?.role === 'farmer' ? '/dashboard' : '/store-dashboard')
      }
    },
    onError: () => toast.error('Google Login fail zala! Try again.'),
    prompt: 'select_account'
  })

  useGoogleOneTapLogin({
    onSuccess: async (credentialResponse) => {
      // One Tap gives a JWT (credential). We'll send this to backend.
      const res = await googleLogin(credentialResponse.credential)
      if (res.success) {
        if (!res.user?.phone || !res.user?.location) navigate('/complete-profile')
        else navigate(res.user?.role === 'farmer' ? '/dashboard' : '/store-dashboard')
      }
    },
    onError: () => console.log('One Tap Failed'),
  })
  
  useEffect(() => {
    let interval
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000)
    } else {
      setCanResend(true)
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [timer])

  const validate = () => {
    const e = {}
    if (!email.trim()) e.email = isMR ? 'ईमेल आवश्यक आहे' : 'Email required'
    if (mode === 'password' && !password.trim()) e.password = isMR ? 'पासवर्ड आवश्यक आहे' : 'Password required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSendOTP = async () => {
    if (!email.trim()) return toast.error('Email dya!')
    const success = await sendOTP(email.trim())
    if (success) {
      setStep(2)
      setTimer(60)
      setCanResend(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    if (mode === 'password') {
      const result = await login(email.trim(), password)
      if (result.success) {
        if (!result.user?.phone || !result.user?.location) navigate('/complete-profile')
        else navigate(result.user?.role === 'farmer' ? '/dashboard' : '/store-dashboard')
      }
    } else {
      if (step === 1) {
        await handleSendOTP(false)
      } else {
        const fullOtp = otp.join('')
        if (fullOtp.length < 6) return toast.error(isMR ? '६ अंकी ओटीपी टाका!' : 'Enter 6-digit OTP!')
        const result = await verifyOTP(email.trim(), fullOtp)
        if (result.success) {
          if (!result.user?.phone || !result.user?.location) navigate('/complete-profile')
          else navigate(result.user?.role === 'farmer' ? '/dashboard' : '/store-dashboard')
        }
      }
    }
  }

  const handleOtpChange = (value, index) => {
    if (isNaN(Number(value))) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) document.getElementById(`otp-${index + 1}`).focus()
  }

  const label = (txt, errKey) => (
    <div className="flex justify-between items-center ml-1">
      <label className="text-[13px] font-bold text-emerald-900">{txt}</label>
      {errors[errKey] && <span className="text-[10px] font-bold text-red-500 uppercase">{errors[errKey]}</span>}
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-outfit">
      <img src="/assets/full_auth_bg.png" alt="Farm" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-[3px]" />

      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden border border-emerald-100">
          
          <div className="pt-12 pb-8 px-8 text-center bg-emerald-50/50">
            <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-5 shadow-xl shadow-emerald-500/30">🌾</div>
            <h2 className="text-3xl font-black text-emerald-900 tracking-tight">KrishiShare</h2>
            <p className="text-emerald-700/60 font-black text-[11px] uppercase tracking-[0.2em] mt-2">
              {mode === 'otp' ? (isMR ? 'OTP ने प्रवेश करा' : 'Login with OTP') : (isMR ? 'पुन्हा आपले स्वागत आहे!' : 'Welcome Back!')}
            </p>
          </div>

          <div className="p-10 space-y-8">
            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
              <button onClick={() => { setMode('password'); setStep(1) }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'password' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}><Mail size={14} /> Password</button>
              <button onClick={() => { setMode('otp'); setStep(1) }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'otp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}><Smartphone size={14} /> OTP</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                {label(isMR ? 'ईमेल पत्ता *' : 'Email Address *', 'email')}
                <input type="email" disabled={mode === 'otp' && step === 2} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-emerald-100 bg-slate-50 outline-none focus:border-emerald-600 font-bold transition-all" />
              </div>

              {mode === 'password' ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    {label(isMR ? 'पासवर्ड *' : 'Password *', 'password')}
                  </div>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                      className="w-full px-6 py-4 pr-14 rounded-2xl border-2 border-emerald-100 bg-slate-50 outline-none focus:border-emerald-600 font-bold transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-emerald-600 transition">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              ) : step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-wider bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                    <ShieldCheck size={14} /> {isMR ? '६ अंकी ओटीपी पाठवला आहे!' : '6-Digit OTP sent!'}
                  </div>
                  <div className="flex justify-between gap-3">
                    {otp.map((digit, i) => (
                      <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(e.target.value, i)} 
                        className="w-full h-16 text-center text-2xl font-black bg-slate-50 border-2 border-emerald-100 rounded-2xl focus:border-emerald-600 outline-none shadow-inner" />
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    <button type="button" onClick={() => setStep(1)} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline block text-center">Wrong Email? Edit</button>
                    <div className="pt-4 border-t border-emerald-50 text-center">
                      {timer > 0 ? (
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                          {isMR ? `ओटीपी मिळाला नाही? ${timer} सेकंदात पुन्हा पाठवा` : `Didn't receive? Resend in ${timer}s`}
                        </p>
                      ) : (
                        <div className="flex gap-4">
                           <button type="button" onClick={() => handleSendOTP()} className="flex-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">
                             {isMR ? 'ईमेलवर पुन्हा पाठवा' : 'Resend on Email'}
                           </button>
                           <button type="button" onClick={() => toast.success(isMR ? 'WhatsApp वर OTP पाठवला!' : 'OTP sent on WhatsApp!')} className="flex-1 text-[10px] font-black text-[#25D366] uppercase tracking-widest hover:underline flex items-center justify-center gap-1">
                             📱 {isMR ? 'WhatsApp वर पाठवा' : 'Resend on WhatsApp'}
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-3xl font-black text-base uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-3">
                {loading ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : (mode === 'otp' && step === 1 ? 'Send OTP' : (isMR ? 'प्रवेश करा' : 'Sign In'))}
              </button>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-200 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" size="sm" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors">Forgot Password?</Link>
              </div>
            </form>

            <div className="relative flex items-center my-10">
              <div className="flex-grow border-t border-emerald-50"></div>
              <span className="px-5 text-[10px] font-black text-emerald-100 uppercase tracking-[0.3em]">Direct Access</span>
              <div className="flex-grow border-t border-emerald-50"></div>
            </div>

            <div className="w-full flex justify-center animate-in slide-in-from-bottom-2 duration-700">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  const res = await googleLogin(credentialResponse.credential)
                  if (res.success) {
                    if (!res.user?.phone || !res.user?.location) navigate('/complete-profile')
                    else navigate(res.user?.role === 'farmer' ? '/dashboard' : '/store-dashboard')
                  }
                }}
                onError={() => toast.error('Google Login fail zala! Try again.')}
                useOneTap
                theme="outline"
                size="large"
                width="370"
                shape="pill"
                locale={isMR ? 'mr' : 'en'}
              />
            </div>

            <p className="mt-12 text-center text-emerald-800/30 font-bold text-sm">
              {t('noAccount')}{' '}
              <Link to="/register" className="text-emerald-600 hover:underline font-black">{t('registerNow')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}