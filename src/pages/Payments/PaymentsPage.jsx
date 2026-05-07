import { useState } from 'react'
import {
  IndianRupee, CheckCircle, Clock, TrendingUp,
  Wheat, ShoppingBag, ChevronDown, ChevronUp,
  Calendar, Phone, Download
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useHarvestStore from '../../store/harvestStore'
import useOrderStore from '../../store/orderStore'

// ─── Demo extra harvest payments (past seasons) ──────────
const demoHarvestPayments = [
  {
    _id:         'HP001',
    factoryName: 'Pravara Sahakari Karkhana',
    cropType:    'Oos (Sugarcane)',
    acres:       4,
    yield:       140,
    frpRate:     330,
    totalAmount: 46200,
    received:    46200,
    pending:     0,
    status:      'paid',
    date:        '2024-03-15',
    paymentDate: '2024-03-22',
    season:      '2023-24',
  },
  {
    _id:         'HP002',
    factoryName: 'Shri Datta Sugar Factory',
    cropType:    'Shankeshwar',
    acres:       2.5,
    yield:       87,
    frpRate:     315,
    totalAmount: 27405,
    received:    27405,
    pending:     0,
    status:      'paid',
    date:        '2023-12-10',
    paymentDate: '2023-12-24',
    season:      '2023-24',
  },
]

// ─── Status Config ────────────────────────────────────────
const statusConfig = {
  paid:    { label:'Paisa Mila!',  color:'bg-green-100 text-green-700 border-green-200', dot:'bg-green-500',  icon:<CheckCircle size={13} /> },
  pending: { label:'Pending',      color:'bg-amber-100 text-amber-700 border-amber-200', dot:'bg-amber-500',  icon:<Clock size={13} />        },
  partial: { label:'Partial',      color:'bg-blue-100  text-blue-700  border-blue-200',  dot:'bg-blue-500',   icon:<Clock size={13} />        },
}

// ─── Summary Card ─────────────────────────────────────────
function SummaryCard({ totalReceived, totalPending, harvestTotal, martTotal }) {
  return (
    <div className="space-y-3">
      {/* Main Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-5 text-white">
        <p className="text-green-200 text-sm">Ekun Milalele Paise</p>
        <p className="text-4xl font-bold mt-1">₹{totalReceived.toLocaleString()}</p>
        {totalPending > 0 && (
          <p className="text-green-200 text-sm mt-2 flex items-center gap-1">
            <Clock size={13} /> ₹{totalPending.toLocaleString()} pending aahe
          </p>
        )}
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wheat size={16} className="text-amber-600" />
            <p className="text-xs font-semibold text-amber-700">Harvest (FRP)</p>
          </div>
          <p className="text-xl font-bold text-amber-700">₹{harvestTotal.toLocaleString()}</p>
          <p className="text-xs text-amber-500 mt-0.5">Sugar factory payments</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag size={16} className="text-blue-600" />
            <p className="text-xs font-semibold text-blue-700">Mart Orders</p>
          </div>
          <p className="text-xl font-bold text-blue-700">₹{martTotal.toLocaleString()}</p>
          <p className="text-xs text-blue-500 mt-0.5">Refund / cashback</p>
        </div>
      </div>
    </div>
  )
}

// ─── Harvest Payment Card ─────────────────────────────────
function HarvestPaymentCard({ payment }) {
  const [expanded, setExpanded] = useState(false)
  const s = statusConfig[payment.status] || statusConfig.pending

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden
      ${payment.status === 'paid' ? 'border-green-200' : 'border-amber-200'}`}>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-gray-800">{payment.factoryName}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Calendar size={11} /> Season {payment.season}
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${s.color}`}>
            {s.icon} {s.label}
          </span>
        </div>

        {/* Key Numbers */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-400">FRP Rate</p>
            <p className="font-bold text-gray-800">₹{payment.frpRate}</p>
            <p className="text-xs text-gray-400">per qtl</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-400">Yield</p>
            <p className="font-bold text-gray-800">{payment.yield} qtl</p>
            <p className="text-xs text-gray-400">{payment.acres} acres</p>
          </div>
          <div className="bg-green-50 rounded-xl p-2.5 text-center border border-green-200">
            <p className="text-xs text-green-600">Total</p>
            <p className="font-bold text-green-700">₹{payment.totalAmount.toLocaleString()}</p>
            <p className="text-xs text-green-500">earned</p>
          </div>
        </div>

        {/* Progress bar for partial */}
        {payment.status === 'partial' && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Mila: ₹{payment.received.toLocaleString()}</span>
              <span className="text-amber-600">Pending: ₹{payment.pending.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${(payment.received / payment.totalAmount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Expand Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-600 transition mt-1">
          <span>{expanded ? 'Kami bagha' : 'Jast bagha'}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            {[
              { label:'🌱 Pik',             value: payment.cropType                                         },
              { label:'📅 Harvest Date',    value: new Date(payment.date).toLocaleDateString('en-IN')       },
              { label:'💳 Payment Date',    value: payment.paymentDate
                  ? new Date(payment.paymentDate).toLocaleDateString('en-IN')
                  : '—'                                                                                      },
              { label:'💰 Received',        value: `₹${payment.received.toLocaleString()}`                 },
              { label:'⏳ Pending',         value: payment.pending > 0 ? `₹${payment.pending.toLocaleString()}` : 'Kahi nahi' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-400">{item.label}</span>
                <span className="font-semibold text-gray-700">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom strip */}
      {payment.status === 'paid' && (
        <div className="bg-green-50 border-t border-green-100 px-4 py-2 flex items-center gap-2">
          <CheckCircle size={13} className="text-green-600" />
          <span className="text-xs text-green-700 font-medium">
            Purna payment mila — {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
          </span>
        </div>
      )}
      {payment.status === 'pending' && (
        <div className="bg-amber-50 border-t border-amber-100 px-4 py-2 flex items-center gap-2">
          <Clock size={13} className="text-amber-600" />
          <span className="text-xs text-amber-700 font-medium">
            Payment yenyachi vaat aahe...
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Mart Payment Card ────────────────────────────────────
function MartPaymentCard({ order }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-gray-800 text-sm">
            {order.items?.[0]?.name}
            {order.items?.length > 1 ? ` +${order.items.length - 1} items` : ''}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            📅 {order.date} · 💳 {order.payment?.toUpperCase()}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
          ${order.status === 'delivered'
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
          {order.status === 'delivered' ? '✅ Paid' : '⏳ Pending'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">#{order._id?.slice(-6)}</p>
        <p className="font-bold text-gray-800">₹{order.finalAmount}</p>
      </div>
    </div>
  )
}

// ─── Main Payments Page ───────────────────────────────────
export default function PaymentsPage() {
  const { user }             = useAuthStore()
  const { getFarmerRequests } = useHarvestStore()
  const { getFarmerOrders }   = useOrderStore()

  const [activeTab, setActiveTab] = useState('all')

  const farmerId = user?._id || 'demo-farmer-id'

  // Live harvest contracts
  const liveContracts = getFarmerRequests(farmerId)
    .filter(r => r.status === 'accepted' || r.status === 'contracted')
    .map(r => ({
      _id:         r._id,
      factoryName: r.factoryName,
      cropType:    r.cropType,
      acres:       r.acres,
      yield:       r.acres * 35,
      frpRate:     340,  // default — real app madhe bid madhe store hoil
      totalAmount: r.acres * 35 * 340,
      received:    0,
      pending:     r.acres * 35 * 340,
      status:      'pending',
      date:        r.date,
      paymentDate: null,
      season:      '2025-26',
    }))

  // All harvest payments (live + demo history)
  const allHarvestPayments = [...liveContracts, ...demoHarvestPayments]

  // Mart orders
  const martOrders = getFarmerOrders?.(farmerId) || []

  // Totals
  const harvestReceived = allHarvestPayments
    .filter(p => p.status === 'paid')
    .reduce((s, p) => s + p.received, 0)

  const harvestPending = allHarvestPayments
    .filter(p => p.status === 'pending' || p.status === 'partial')
    .reduce((s, p) => s + p.pending, 0)

  const martTotal = martOrders
    .filter(o => o.status === 'delivered')
    .reduce((s, o) => s + o.finalAmount, 0)

  const totalReceived = harvestReceived + martTotal
  const totalPending  = harvestPending

  const tabs = [
    { id:'all',     label:'Sab'           },
    { id:'harvest', label:'🌾 Harvest'    },
    { id:'mart',    label:'🛒 Mart'       },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-16">
          <h1 className="text-2xl font-bold">💰 Mazi Payments</h1>
          <p className="text-green-200 text-sm mt-1">Harvest FRP + Mart Orders</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-10 pb-8 space-y-4">

        {/* Summary */}
        <SummaryCard
          totalReceived={totalReceived}
          totalPending={totalPending}
          harvestTotal={harvestReceived}
          martTotal={martTotal}
        />

        {/* Pending Alert */}
        {totalPending > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center gap-3">
            <Clock size={20} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-800">₹{totalPending.toLocaleString()} Pending aahe</p>
              <p className="text-amber-600 text-xs mt-0.5">Factory payment pathvnar — contract nantarcha {' '}
                {allHarvestPayments.find(p => p.status === 'pending')?.frpRate
                  ? `${allHarvestPayments.find(p => p.status === 'pending')?.paymentDays || 14} divsat`
                  : '14 divsat'
                } madhe
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition
                ${activeTab === tab.id
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Harvest Payments ── */}
        {(activeTab === 'all' || activeTab === 'harvest') && (
          <div className="space-y-3">
            {activeTab === 'all' && (
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Wheat size={16} className="text-amber-600" /> Harvest FRP Payments
              </h3>
            )}
            {allHarvestPayments.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-2">🌾</div>
                <p className="text-gray-400 text-sm">Abhi kahi harvest payments nahi</p>
                <p className="text-gray-300 text-xs mt-1">Sugar factory contract kelya nantarach dikhel</p>
              </div>
            ) : (
              allHarvestPayments.map((payment) => (
                <HarvestPaymentCard key={payment._id} payment={payment} />
              ))
            )}
          </div>
        )}

        {/* ── Mart Payments ── */}
        {(activeTab === 'all' || activeTab === 'mart') && (
          <div className="space-y-3">
            {activeTab === 'all' && (
              <h3 className="font-bold text-gray-700 flex items-center gap-2 mt-2">
                <ShoppingBag size={16} className="text-blue-600" /> Mart Orders
              </h3>
            )}
            {martOrders.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-2">🛒</div>
                <p className="text-gray-400 text-sm">Abhi kahi mart orders nahi</p>
              </div>
            ) : (
              martOrders.map((order) => (
                <MartPaymentCard key={order._id} order={order} />
              ))
            )}
          </div>
        )}

        {/* FRP Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="font-semibold text-blue-800 text-sm mb-2">ℹ️ FRP Rate Mahiti</p>
          <p className="text-blue-700 text-xs leading-relaxed">
            FRP (Fair and Remunerative Price) he government tharvte. 2025-26 season sathi
            ₹340/quintal set kela aahe. Factory contract nantarcha 14 divsat madhe paisa
            tumchya bank account madhe yetaat.
          </p>
        </div>
      </div>
    </div>
  )
}