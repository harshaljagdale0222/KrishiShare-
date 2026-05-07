import { CheckCircle, Clock, XCircle, Truck } from 'lucide-react'
import useLanguageStore from '../../store/languageStore'
import useBookingStore from '../../store/bookingStore'
import useOrderStore from '../../store/orderStore'
import { useEffect } from 'react'

const getStatusConfig = (t) => ({
  completed: { label: t('purnZale') || 'Completed', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  pending:   { label: t('pending')   || 'Pending',    icon: Clock,       color: 'text-amber-600 bg-amber-50' },
  delivered: { label: t('delivered') || 'Delivered',  icon: Truck,       color: 'text-blue-600  bg-blue-50'  },
  accepted:  { label: t('accepted')  || 'Accepted',   icon: CheckCircle, color: 'text-blue-600  bg-blue-50'  },
  cancelled: { label: t('radKele')   || 'Cancelled',  icon: XCircle,     color: 'text-red-500   bg-red-50'   },
  rejected:  { label: t('radKele')   || 'Rejected',   icon: XCircle,     color: 'text-red-500   bg-red-50'   },
})

export default function RecentActivity() {
  const { t, language } = useLanguageStore()
  const { bookings, fetchMyBookings } = useBookingStore()
  const { myOrders, fetchMyOrders } = useOrderStore()
  const statusConfig = getStatusConfig(t)

  useEffect(() => {
    fetchMyBookings()
    fetchMyOrders()
  }, [])

  const combined = [
    ...bookings.map(b => ({
      id: b._id,
      type: 'booking',
      item: b.equipmentName,
      owner: b.owner,
      date: new Date(b.date).toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-GB', { day: 'numeric', month: 'short' }),
      ts: new Date(b.createdAt || b.date).getTime(),
      amount: `₹${b.amount}`,
      status: b.status
    })),
    ...myOrders.map(o => ({
      id: o._id,
      type: 'order',
      item: o.items?.[0]?.name + (o.items?.length > 1 ? ' ...' : ''),
      owner: 'KrishiMart',
      date: new Date(o.createdAt).toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-GB', { day: 'numeric', month: 'short' }),
      ts: new Date(o.createdAt).getTime(),
      amount: `₹${o.totalAmount || o.finalAmount}`,
      status: o.status
    }))
  ].sort((a, b) => b.ts - a.ts).slice(0, 5)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-800">🕐 {t('recentActivity')}</h3>
        <button className="text-sm text-primary-600 hover:underline font-medium">{t('viewAll')}</button>
      </div>

      <div className="divide-y divide-gray-50">
        {combined.length > 0 ? combined.map((item) => {
          const config = statusConfig[item.status] || statusConfig.pending
          const StatusIcon = config.icon
          return (
            <div key={item.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
                  ${item.type === 'booking' ? 'bg-green-100' : 'bg-orange-100'}`}>
                  {item.type === 'booking' ? '🚜' : '📦'}
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm truncate max-w-[150px]">{item.item}</p>
                  <p className="text-xs text-gray-400">{item.owner} • {item.date}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className="font-bold text-gray-900 text-sm">{item.amount}</p>
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${config.color}`}>
                  <StatusIcon size={10} />
                  {config.label}
                </span>
              </div>
            </div>
          )
        }) : (
          <div className="p-10 text-center text-gray-400 text-sm">
            {language === 'mr' ? 'अद्याप कोणतेही क्रियाकलाप नाहीत' : 'No recent activities yet'}
          </div>
        )}
      </div>
    </div>
  )
}