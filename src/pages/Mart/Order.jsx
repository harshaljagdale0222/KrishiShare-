import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, CheckCircle, Clock, XCircle, Truck, Star, RotateCcw } from 'lucide-react'
import useLanguageStore from '../../store/languageStore'
import toast from 'react-hot-toast'

const demoOrders = [
  {
    _id: 'OR001',
    items: [
      { name: 'Hybrid Tomato Seeds', icon: '🍅', qty: 2, price: 250  },
      { name: 'NPK Fertilizer 50kg', icon: '🧪', qty: 1, price: 890  },
    ],
    total: 1390, deliveryCharge: 0, discount: 69,
    finalAmount: 1321,
    status: 'delivered',
    date: '24 Nov 2024',
    deliveredDate: '25 Nov 2024',
    payment: 'UPI',
    address: 'Pune, Maharashtra',
    distance: 8,
  },
  {
    _id: 'OR002',
    items: [
      { name: 'Wheat Seeds HD-2967', icon: '🌾', qty: 1, price: 420 },
    ],
    total: 420, deliveryCharge: 50, discount: 21,
    finalAmount: 449,
    status: 'on_the_way',
    date: '28 Nov 2024',
    deliveredDate: null,
    payment: 'COD',
    address: 'Nashik, Maharashtra',
    distance: 18,
  },
  {
    _id: 'OR003',
    items: [
      { name: 'Drip Irrigation Kit', icon: '💧', qty: 1, price: 2500 },
      { name: 'Soil Testing Kit',    icon: '🧫', qty: 1, price: 599  },
    ],
    total: 3099, deliveryCharge: 0, discount: 155,
    finalAmount: 2944,
    status: 'processing',
    date: '30 Nov 2024',
    deliveredDate: null,
    payment: 'Card',
    address: 'Kolhapur, Maharashtra',
    distance: 5,
  },
  {
    _id: 'OR004',
    items: [
      { name: 'Hand Sprayer 16L', icon: '🔧', qty: 1, price: 750 },
    ],
    total: 750, deliveryCharge: 50, discount: 37,
    finalAmount: 763,
    status: 'cancelled',
    date: '20 Nov 2024',
    deliveredDate: null,
    payment: 'UPI',
    address: 'Sangli, Maharashtra',
    distance: 20,
  },
]

const statusConfig = {
  delivered:   { label: 'Delivered',   icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200',  dot: 'bg-green-500',  step: 4 },
  on_the_way:  { label: 'Yetoy...',    icon: Truck,       color: 'text-blue-600  bg-blue-50  border-blue-200',   dot: 'bg-blue-500',   step: 3 },
  processing:  { label: 'Processing',  icon: Clock,       color: 'text-amber-600 bg-amber-50 border-amber-200',  dot: 'bg-amber-500',  step: 2 },
  cancelled:   { label: 'Cancelled',   icon: XCircle,     color: 'text-red-500   bg-red-50   border-red-200',    dot: 'bg-red-500',    step: 0 },
}

const filters = ['all', 'processing', 'on_the_way', 'delivered', 'cancelled']

const filterLabels = {
  all:        'Sab',
  processing: 'Processing',
  on_the_way: 'Yetoy',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
}

function OrderTimeline({ status }) {
  if (status === 'cancelled') return null

  const steps = [
    { label: 'Order Place',  icon: '📦' },
    { label: 'Processing',   icon: '⚙️' },
    { label: 'On the Way',   icon: '🚚' },
    { label: 'Delivered',    icon: '✅' },
  ]

  const currentStep = statusConfig[status]?.step || 0

  return (
    <div className="mt-4 px-2">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute left-0 right-0 top-4 h-1 bg-gray-200 z-0">
          <div
            className="h-full bg-primary-500 transition-all"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />
        </div>

        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2
              ${i + 1 <= currentStep
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'bg-white border-gray-300 text-gray-300'
              }`}>
              {i + 1 <= currentStep ? '✓' : step.icon}
            </div>
            <p className={`text-xs mt-1 font-medium ${i + 1 <= currentStep ? 'text-primary-600' : 'text-gray-400'}`}>
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Orders() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [expandedId,   setExpandedId]   = useState(null)
  const { t }   = useLanguageStore()
  const navigate = useNavigate()

  const filtered = demoOrders.filter(o =>
    activeFilter === 'all' || o.status === activeFilter
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/shop')}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:shadow-md transition">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">📦 My Orders</h1>
            <p className="text-sm text-gray-400">{demoOrders.length} orders</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Ekun',      value: demoOrders.length,                                           color: 'bg-gray-800'  },
            { label: 'Processing',value: demoOrders.filter(o => o.status === 'processing').length,    color: 'bg-amber-500' },
            { label: 'On Way',    value: demoOrders.filter(o => o.status === 'on_the_way').length,    color: 'bg-blue-500'  },
            { label: 'Delivered', value: demoOrders.filter(o => o.status === 'delivered').length,     color: 'bg-green-600' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} text-white rounded-2xl p-3 text-center`}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs opacity-80 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          {filters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition
                ${activeFilter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 font-medium">Kahi orders nahi!</p>
              <button onClick={() => navigate('/shop')}
                className="mt-4 bg-primary-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-primary-700 transition text-sm">
                🛒 Shopping Kara
              </button>
            </div>
          ) : (
            filtered.map((order) => {
              const status     = statusConfig[order.status]
              const StatusIcon = status.icon
              const isExpanded = expandedId === order._id

              return (
                <div key={order._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                  {/* Card Header */}
                  <div
                    className="p-5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : order._id)}
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-400">Order ID</p>
                        <p className="font-bold text-gray-800 text-sm">{order._id}</p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 mb-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 flex items-center gap-2">
                            <span>{item.icon}</span>
                            {item.name} × {item.qty}
                          </span>
                          <span className="text-sm font-medium text-gray-800">
                            ₹{item.price * item.qty}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{order.date} • {order.payment}</span>
                      <span className="font-bold text-gray-900">₹{order.finalAmount}</span>
                    </div>

                    {/* Timeline */}
                    <OrderTimeline status={order.status} />
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">

                      {/* Price Breakdown */}
                      <div className="bg-white rounded-xl p-4 mb-4 space-y-2 text-sm">
                        <p className="font-semibold text-gray-700 mb-2">💰 Price Details</p>
                        <div className="flex justify-between text-gray-600">
                          <span>Items Total</span>
                          <span>₹{order.total}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Discount (5%)</span>
                          <span>-₹{order.discount}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Delivery ({order.distance} km)</span>
                          <span className={order.deliveryCharge === 0 ? 'text-green-600' : ''}>
                            {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
                          <span>Final Amount</span>
                          <span>₹{order.finalAmount}</span>
                        </div>
                      </div>

                      {/* Delivery Info */}
                      <div className="bg-white rounded-xl p-4 mb-4 text-sm space-y-2">
                        <p className="font-semibold text-gray-700">🚚 Delivery Info</p>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Address</span>
                          <span className="font-medium text-gray-800">{order.address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Payment</span>
                          <span className="font-medium text-gray-800">{order.payment}</span>
                        </div>
                        {order.deliveredDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Delivered On</span>
                            <span className="font-medium text-green-600">{order.deliveredDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {order.status === 'delivered' && (
                          <>
                            <button
                              onClick={() => toast.success('Review submit kela! ⭐')}
                              className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium hover:shadow-sm transition">
                              <Star size={14} /> Review Dya
                            </button>
                            <button
                              onClick={() => navigate('/shop')}
                              className="flex items-center gap-1.5 bg-primary-50 border border-primary-200 text-primary-700 px-4 py-2 rounded-xl text-sm font-medium hover:shadow-sm transition">
                              <RotateCcw size={14} /> Parat Order Kara
                            </button>
                          </>
                        )}
                        {order.status === 'processing' && (
                          <button
                            onClick={() => toast.success('Cancel request pathavla!')}
                            className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:shadow-sm transition">
                            <XCircle size={14} /> Cancel Kara
                          </button>
                        )}
                        {order.status === 'on_the_way' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-700 font-medium">
                            🚚 Tumchyakade yetoy — thoda vel thamba!
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Shop More */}
        {demoOrders.length > 0 && (
          <div className="mt-8 text-center">
            <button onClick={() => navigate('/shop')}
              className="bg-primary-600 text-white px-8 py-3 rounded-full font-bold hover:bg-primary-700 transition">
              🛒 Aajun Shopping Kara
            </button>
          </div>
        )}

      </div>
    </div>
  )
}