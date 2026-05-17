import React, { useState } from 'react'
import { Mail, Key, ShieldCheck, ArrowLeft, Loader, CheckCircle2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../../api'
import toast from 'react-hot-toast'
import useLanguageStore from '../../store/languageStore'

const ForgotPassword = () => {
  const { t } = useLanguageStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: Reset Pass
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '' })

  const handleSendOTP = async (e) => {
    e.preventDefault()
    if (!form.email) return toast.error('Email dakhil kara!')
    setLoading(true)
    try {
      await authAPI.sendOTP(form.email)
      toast.success('OTP pathavla aahe!')
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP pathavta ala nahi.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (!form.otp) return toast.error('OTP dakhil kara!')
    setLoading(true)
    try {
      // We use the verify-otp endpoint
      await authAPI.verifyOTP(form.email, form.otp)
      toast.success('OTP Verify zala! Ata password badla.')
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP chukla aahe!')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!form.newPassword || !form.confirmPassword) return toast.error('Sarv mahiti bhara!')
    if (form.newPassword !== form.confirmPassword) return toast.error('Password match hot nahit!')
    
    setLoading(true)
    try {
      await authAPI.resetPassword(form)
      toast.success('Password badalla aahe! Login kara.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password badalta ala nahi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-outfit flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100 relative overflow-hidden">
        
        <Link to="/login" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to Login
        </Link>

        <div className="mb-10">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none mb-3">Forgot<br/><span className="text-emerald-600">Password?</span></h2>
          <p className="text-slate-400 text-xs font-bold leading-relaxed">
            {step === 1 && 'Enter your registered email to receive an OTP.'}
            {step === 2 && 'Enter the 6-digit OTP sent to your email.'}
            {step === 3 && 'Create a strong new password for your account.'}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" size={20} />
                <input 
                  type="email" required value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  placeholder="example@gmail.com"
                />
              </div>
            </div>
            <button disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all">
              {loading ? <Loader className="animate-spin" size={16} /> : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2 text-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Verification Code</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" required maxLength={6} value={form.otp}
                  onChange={e => setForm({...form, otp: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 font-black text-2xl text-emerald-600 tracking-[0.5em] focus:ring-2 focus:ring-emerald-500/20 outline-none text-center" 
                  placeholder="000000"
                />
              </div>
            </div>
            <button disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all">
              {loading ? <Loader className="animate-spin mx-auto" size={16} /> : 'Verify OTP'}
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-emerald-600">
              Resend OTP?
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleReset} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" required value={form.newPassword}
                  onChange={e => setForm({...form, newPassword: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" required value={form.confirmPassword}
                  onChange={e => setForm({...form, confirmPassword: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all">
              {loading ? <Loader className="animate-spin mx-auto" size={16} /> : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
