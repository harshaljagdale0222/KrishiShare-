import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag, Truck, Shield, MapPin } from 'lucide-react'
import useCartStore from '../../store/cartStore'
import useOrderStore from '../../store/orderStore'
import useAuthStore from '../../store/authStore'
import useLanguageStore from '../../store/languageStore'
import { maharashtraData } from '../../utils/locationData'
import toast from 'react-hot-toast'
import { ChevronDown, Check } from 'lucide-react'

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, getTotalItems, getTotalPrice } = useCartStore()
  const { placeOrder } = useOrderStore()
  const { user } = useAuthStore()
  const { t, language } = useLanguageStore()
  const navigate = useNavigate()

  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [distance, setDistance] = useState(5)

  const initialAddress = user?.location?.split(', ') || []
  const [district, setDistrict] = useState('')
  const [taluka, setTaluka] = useState('')
  const [village, setVillage] = useState('')
  const [pincode, setPincode] = useState('')
  const [isFetchingPin, setIsFetchingPin] = useState(false)
  const [villageSuggestions, setVillageSuggestions] = useState([])
  const [isOtherVillage, setIsOtherVillage] = useState(false)
  const [villageSearch, setVillageSearch] = useState('')
  const [landmark, setLandmark] = useState('')

  const [note, setNote] = useState('')
  const [isOrdering, setIsOrdering] = useState(false)

  const isMR = language === 'mr'
  const isHI = language === 'hi'
  const displayLang = (isMR || isHI) ? language : 'en'

  const deliveryCharge = distance <= 15 ? 0 : (distance - 15) * 50
  const discount = Math.floor(getTotalPrice() * 0.05)
  const finalAmount = getTotalPrice() + deliveryCharge - discount

  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentStep, setPaymentStep] = useState(0)

  const handlePincodeChange = async (val) => {
    const cleanVal = val.replace(/\D/g, '')
    if (cleanVal.length <= 6) {
      setPincode(cleanVal)
      if (cleanVal.length === 6) {
        setIsFetchingPin(true)
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${cleanVal}`)
          const data = await res.json()
          if (data && data[0] && data[0].Status === 'Success') {
            const offices = data[0].PostOffice
            const sample = offices[0]

            const dist = sample.District
            const foundDist = Object.keys(maharashtraData).find(d =>
              dist.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(dist.toLowerCase())
            )

            if (foundDist) {
              const block = sample.Block
              const foundTaluka = maharashtraData[foundDist].talukas.find(t =>
                block.toLowerCase().includes(t.en.toLowerCase()) || t.en.toLowerCase().includes(block.toLowerCase())
              )

              setDistrict(foundDist)
              setTaluka(foundTaluka ? foundTaluka.en : '')
              setVillage('')
              setVillageSearch('')
              setVillageSuggestions(offices.map(o => o.Name))
              toast.success(isMR ? 'पिनकोडनुसार माहिती मिळवली!' : 'Location loaded!')
            }
          } else {
            toast.error(isMR ? 'चुकीचा पिनकोड!' : 'Invalid Pincode!')
          }
        } catch {
          toast.error(isMR ? 'नेटवर्क एरर!' : 'Network error!')
        } finally {
          setIsFetchingPin(false)
        }
      }
    }
  }

  const handleCheckout = async () => {
    if (!district || !taluka || !village || !pincode || !landmark) {
      toast.error(isMR ? '📍 कृपया पिनकोड आणि लँडमार्कसह पत्ता संपूर्ण भरा!' : '📍 Please complete the address including Pincode & Landmark!');
      return
    }

    const fullAddress = `${village}, ${taluka}, ${district}, Maharashtra - ${pincode}`

    // ─── Real API / Payment Gateway Simulation ────────────────
    if (paymentMethod !== 'cod') {
      setIsProcessingPayment(true)
      setPaymentStep(1) // Connecting to Bank...
      await new Promise(r => setTimeout(r, 1500))

      setPaymentStep(2) // Verifying Transaction...
      await new Promise(r => setTimeout(r, 2000))

      setPaymentStep(3) // Payment Successful!
      await new Promise(r => setTimeout(r, 1000))
      setIsProcessingPayment(false)
    }

    setIsOrdering(true)
    const orderData = {
      items: items.map(i => ({
        productId: i._id,
        name: i.name,
        icon: i.icon,
        price: i.price,
        qty: i.quantity,
      })),
      totalAmount: getTotalPrice(),
      ownerId: items[0]?.ownerId || null,
      deliveryCharge,
      discount,
      finalAmount,
      payment: paymentMethod,
      distance,
      address: fullAddress,
      landmark,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      note,
    }

    const result = await placeOrder(orderData)
    setIsOrdering(false)

    if (result) {
      toast.success(isMR ? 'ऑर्डर यशस्वीपणे प्लेस झाली! 📦' : isHI ? 'ऑर्डर सफलतापूर्वक प्लेस की गई! 📦' : 'Order placed successfully! 📦')
      clearCart()
      navigate('/orders')
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="text-8xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('cartEmpty')}</h2>
        <p className="text-gray-400 mb-8">{t('cartEmptyDesc')}</p>
        <Link to="/shop" className="bg-primary-600 text-white px-8 py-3 rounded-full font-bold hover:bg-primary-700 transition">
          🛒 {t('startShopping')}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/shop')} className="p-2 rounded-xl bg-white border border-gray-200 hover:shadow-md transition">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">🛒 {t('cartTitle')}</h1>
            <p className="text-sm text-gray-400">{getTotalItems()} {t('items')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">

            {/* Address */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
              <p className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-1">
                <MapPin size={18} className="text-primary-600" /> {t('address')} <span className="text-red-500">*</span>
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block tracking-wider">{isMR ? 'पिनकोड' : 'Pincode'}</label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="4XXXXX"
                    className={`w-full px-4 py-2.5 outline-none rounded-xl text-sm font-medium transition-all
                      ${isFetchingPin ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-gray-50 focus:border-primary-500'}`}
                  />
                  {isFetchingPin && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block tracking-wider">{isMR ? 'जिल्हा' : isHI ? 'जिला' : 'District'}</label>
                  <select value={district} onChange={(e) => { setDistrict(e.target.value); setTaluka(''); setVillage(''); setVillageSearch(''); setVillageSuggestions([]) }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary-500 text-sm font-medium text-gray-800 transition appearance-none">
                    <option value="">{isMR ? 'निवडा' : 'Select'}</option>
                    {Object.keys(maharashtraData).sort().map(d => (
                      <option key={d} value={d}>{maharashtraData[d][displayLang] || d}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-[34px] text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block tracking-wider">{isMR ? 'तालुका' : isHI ? 'तालुका' : 'Taluka'}</label>
                  <select value={taluka} onChange={(e) => { setTaluka(e.target.value); setVillage(''); setVillageSearch('') }} disabled={!district}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary-500 text-sm font-medium text-gray-800 transition appearance-none disabled:opacity-50">
                    <option value="">{isMR ? 'निवडा' : 'Select'}</option>
                    {district && maharashtraData[district].talukas.map(t => (
                      <option key={t.en} value={t.en}>{t[displayLang] || t.en}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-[34px] text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block tracking-wider">{t('yourVillage')} *</label>
                <div className="relative">
                  {villageSuggestions.length > 0 ? (
                    <select
                      value={isOtherVillage ? 'other' : (villageSuggestions.includes(village) ? village : '')}
                      onChange={e => {
                        if (e.target.value === 'other') {
                          setIsOtherVillage(true);
                          setVillage('');
                          setVillageSearch('other');
                        } else {
                          setIsOtherVillage(false);
                          setVillage(e.target.value);
                          setVillageSearch(e.target.value);
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary-500 text-sm font-medium text-gray-800 transition appearance-none"
                    >
                      <option value="">{isMR ? 'गाव निवडा...' : 'Select Village...'}</option>
                      {villageSuggestions.map(v => <option key={v} value={v}>{v}</option>)}
                      <option value="other">{isMR ? '-- दुसरे गाव --' : '-- Other --'}</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={villageSearch}
                      onChange={(e) => { setIsOtherVillage(false); setVillageSearch(e.target.value); setVillage(e.target.value); }}
                      placeholder={isMR ? "गावचे नाव टाका..." : "Enter village name..."}
                      className="w-full px-4 py-2.5 border border-gray-200 focus:border-primary-500 bg-gray-50 rounded-xl outline-none transition text-gray-800 text-sm"
                    />
                  )}
                  {villageSuggestions.length > 0 && (
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  )}
                </div>
                {(isOtherVillage || (village && !villageSuggestions.includes(village) && villageSuggestions.length > 0)) && (
                  <input
                    type="text"
                    autoFocus
                    placeholder={isMR ? "गावाचे नाव टाका..." : "Enter village name..."}
                    value={village}
                    onChange={e => { setVillage(e.target.value); setVillageSearch(e.target.value); }}
                    className="w-full px-4 py-2.5 border border-gray-200 focus:border-primary-500 bg-white rounded-xl outline-none transition text-gray-800 text-sm mt-2"
                  />
                )}
                {village && !isOtherVillage && villageSuggestions.includes(village) && (
                  <p className="text-[10px] text-green-600 font-bold mt-1 ml-1 flex items-center gap-1">
                    <Check size={10} /> {village} {isMR ? 'या पत्त्यावर डिलिव्हरी होईल.' : 'will be the delivery village.'}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-gray-50">
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block tracking-wider">
                    📍 {isMR ? 'लँडमार्क / जवळचे ठिकाण' : 'Landmark / Nearby'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder={isMR ? "उदा. शाळेच्या जवळ, देऊळाच्या मागे..." : "e.g. Near school, behind temple..."}
                    className="w-full px-4 py-2.5 border border-gray-200 focus:border-primary-500 bg-gray-50 rounded-xl outline-none transition text-gray-800 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Distance */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-1"><Truck size={16} className="text-primary-600" /> {t('deliveryDistance')}</p>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${distance <= 15 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {distance <= 15 ? `🎉 ${t('freeDelivery')}` : (isMR ? `₹${deliveryCharge} चार्ज` : `₹${deliveryCharge} Charge`)}
                </span>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1"><span>0 km</span><span className="font-semibold text-gray-700">{distance} km</span><span>30 km</span></div>
                <input type="range" min="1" max="30" value={distance} onChange={(e) => setDistance(Number(e.target.value))} className="w-full accent-primary-600" />
              </div>
            </div>

            {/* Items */}
            {items.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm leading-tight">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-black text-primary-700 bg-primary-100/50 px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                      📦 {item.weight > 0 ? `${item.weight} ${item.unit}` : item.unit}
                    </span>
                    {item.quantity > 1 && (
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         • {isMR ? 'एकूण:' : 'Total:'} {item.weight > 0 ? `${item.weight * item.quantity} ${item.unit}` : `${item.quantity} Units`}
                       </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-gray-900">₹{item.price}</span>
                    <span className="text-gray-400 text-xs line-through">₹{item.mrp}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border-2 border-primary-500 rounded-xl overflow-hidden">
                      <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="px-3 py-1.5 text-primary-600 hover:bg-primary-50 transition"><Minus size={13} /></button>
                      <span className="px-3 font-bold text-primary-700 text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="px-3 py-1.5 text-primary-600 hover:bg-primary-50 transition"><Plus size={13} /></button>
                    </div>
                    <button onClick={() => { removeItem(item._id); toast.success(t('itemRemoved')) }} className="text-red-400 hover:text-red-600 transition p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="text-right flex-shrink-0"><p className="font-bold text-gray-900">₹{item.price * item.quantity}</p></div>
              </div>
            ))}

            {/* Note */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">📝 {t('specialNote')}</p>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('notePlaceholder')} rows={2}
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-primary-500 bg-gray-50 rounded-xl outline-none transition text-gray-800 text-sm resize-none" />
            </div>

            <button onClick={() => { clearCart(); toast.success(t('cartCleared')) }} className="text-sm text-red-400 hover:text-red-600 font-medium transition flex items-center gap-1">
              <Trash2 size={14} /> {t('removeAll')}
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-36">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">💰 {t('orderSummary')}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600"><span>{t('items')} ({getTotalItems()})</span><span>₹{getTotalPrice()}</span></div>
                <div className="flex justify-between text-green-600"><span className="flex items-center gap-1"><Tag size={13} /> {t('discount')}</span><span>-₹{discount}</span></div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1"><Truck size={13} /> {t('delivery')} ({distance} km)</span>
                  <span className={deliveryCharge === 0 ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>{deliveryCharge === 0 ? t('freeDelivery') : `₹${deliveryCharge}`}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-base"><span>{t('total')}</span><span>₹{finalAmount}</span></div>
              </div>

              {/* Payment */}
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">💳 {t('paymentMethod')}</p>
                <div className="space-y-2">
                  {[
                    { id: 'upi', icon: '📱', label: 'UPI', desc: 'GPay, PhonePe, Paytm' },
                    { id: 'card', icon: '💳', label: 'Card', desc: 'Debit / Credit Card' },
                    { id: 'cod', icon: '💵', label: 'COD', desc: 'Cash on Delivery' },
                  ].map((method) => (
                    <button key={method.id} type="button" onClick={() => setPaymentMethod(method.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition ${paymentMethod === method.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                      <span className="text-xl">{method.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${paymentMethod === method.id ? 'text-primary-700' : 'text-gray-700'}`}>{method.label}</p>
                        <p className="text-xs text-gray-400">{method.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === method.id ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                        {paymentMethod === method.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleCheckout} disabled={isOrdering}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-bold text-lg mt-4 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {isOrdering ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {isMR ? 'ऑर्डर होत आहे...' : 'Placing Order...'}</>
                ) : (
                  <><ShoppingBag size={20} /> {paymentMethod === 'cod' ? t('codOrder') : (isMR ? `${paymentMethod.toUpperCase()} ने पेमेंट करा` : `Pay with ${paymentMethod.toUpperCase()}`)}</>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
                <Shield size={12} /><span>{t('safePayment')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Payment Processing Overlay */}
      {isProcessingPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-300">
            {paymentStep === 1 && (
              <div className="space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-primary-100 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">🏦</div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{isMR ? 'बँकेशी जोडले जात आहे...' : isHI ? 'बैंक से जुड़ रहे हैं...' : 'Connecting to Bank...'}</h3>
                  <p className="text-sm text-gray-400 mt-2">{isMR ? 'कृपया बॅक बटन दाबू नका' : 'Please do not press back button'}</p>
                </div>
              </div>
            )}
            {paymentStep === 2 && (
              <div className="space-y-6">
                <div className="relative w-24 h-24 mx-auto scale-110">
                  <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">🔐</div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{isMR ? 'पेमेंट व्हेरिफाय होत आहे...' : isHI ? 'पेमेंट सत्यापित हो रहा है...' : 'Verifying Payment...'}</h3>
                  <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                    <div className="bg-primary-600 h-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            )}
            {paymentStep === 3 && (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center text-5xl animate-bounce">✓</div>
                <div>
                  <h3 className="text-2xl font-black text-green-600">{isMR ? 'पेमेंट यशस्वी!' : isHI ? 'भुगतान सफल!' : 'Payment Success!'}</h3>
                  <p className="text-sm text-gray-500 mt-2">Transaction ID: TXN{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}