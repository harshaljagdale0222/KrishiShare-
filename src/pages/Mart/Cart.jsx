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
    // Pincode is optional if District/Taluka/Village are filled manually
    const isManualComplete = district && taluka && village;
    
    if (!isManualComplete || !landmark) {
      toast.error(isMR ? '📍 कृपया जिल्हा, तालुका, गाव आणि लँडमार्क संपूर्ण भरा!' : '📍 Please complete the District, Taluka, Village & Landmark!');
      return
    }

    const fullAddress = `${village}, ${taluka}, ${district}, Maharashtra${pincode ? ` - ${pincode}` : ''}`

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
      payment: 'cod', 
      distance,
      address: fullAddress,
      landmark,
      paymentStatus: 'pending',
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
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block tracking-wider">
                  {isMR ? 'पिनकोड' : 'Pincode'}
                </label>
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

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                  {isMR ? 'किंवा' : 'OR'}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
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
                    <div className="flex items-center border-2 border-primary-500 rounded-xl overflow-hidden bg-white shadow-sm">
                      <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="px-3 py-1.5 text-primary-600 hover:bg-primary-50 transition border-r-2 border-primary-500 active:bg-primary-100"><Minus size={13} /></button>
                      <input 
                        type="number"
                        min="0"
                        max={item.stock || 999}
                        value={item.quantity || ''}
                        placeholder="0"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                          if (val > (item.stock || 999)) {
                            toast.error(isMR ? `फक्त ${item.stock} स्टॉक शिल्लक आहे!` : `Only ${item.stock} stock available!`);
                            updateQuantity(item._id, item.stock);
                          } else if (val >= 0) {
                            updateQuantity(item._id, val);
                          }
                        }}
                        className="w-12 h-full bg-white/50 text-center font-black text-primary-700 text-sm outline-none focus:bg-white transition-colors placeholder-gray-300"
                      />
                      <button 
                        disabled={item.quantity >= (item.stock || 999)}
                        onClick={() => updateQuantity(item._id, item.quantity + 1)} 
                        className="px-3 py-1.5 text-primary-600 hover:bg-primary-50 transition border-l-2 border-primary-500 disabled:opacity-30 disabled:cursor-not-allowed active:bg-primary-100"
                      >
                        <Plus size={13} />
                      </button>
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

              {/* Checkout Button */}
              <button onClick={handleCheckout} disabled={isOrdering}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-5 rounded-2xl font-black text-lg mt-4 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-xl shadow-primary-500/20 active:scale-95">
                {isOrdering ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {isMR ? 'विनंती पाठवत आहे...' : 'Sending Request...'}</>
                ) : (
                  <><ShoppingBag size={20} /> {isMR ? 'ऑर्डरची विनंती पाठवा' : 'Send Order Request'}</>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400 font-bold uppercase tracking-widest">
                <Shield size={14} className="text-emerald-500" />
                <span>{isMR ? '१००% सुरक्षित व्यवहार' : '100% Safe & Secure'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}