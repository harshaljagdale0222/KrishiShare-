import useLanguageStore from '../../store/languageStore'
import useOrderStore from '../../store/orderStore'
import useBookingStore from '../../store/bookingStore'

export default function QuickStats() {
  const { t } = useLanguageStore()
  const { getAllOrders } = useOrderStore()
  const { allBookings }  = useBookingStore()

  const myOrders   = getAllOrders()
  const myBookings = allBookings

  // Calculate Stats
  const totalOrders   = myOrders.length
  const totalBookings = myBookings.length
  
  const orderExpense   = myOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.finalAmount || 0), 0)
  const bookingExpense = myBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.amount || 0), 0)
  const totalExpense   = orderExpense + bookingExpense

  const onWayOrders = myOrders.filter(o => ['accepted', 'packing'].includes(o.status)).length
  const recentBookings = myBookings.filter(b => b.status === 'pending').length

  // Calculate Rating & Reviews from Real Data
  const ratedBookings = myBookings.filter(b => b.rating > 0)
  const ratedOrders   = myOrders.filter(o => o.feedbackRating > 0) // Adjusted based on common schema
  
  const totalReviews = ratedBookings.length + ratedOrders.length
  const avgRating = totalReviews > 0 
    ? ( (ratedBookings.reduce((sum, b) => sum + b.rating, 0) + ratedOrders.reduce((sum, o) => sum + (o.feedbackRating || 0), 0)) / totalReviews ).toFixed(1)
    : '5.0' // Default for new users

  const stats = [
    { 
      icon: '🚜', 
      label: t('totalBookings'), 
      value: totalBookings, 
      sub: recentBookings > 0 ? `${recentBookings} ${t('pending')}` : t('allSettled') || 'All up to date',  
      color: 'bg-green-50  border-green-200',  
      textColor: 'text-green-700',  
      subColor: 'text-green-500'  
    },
    { 
      icon: '🛒', 
      label: t('totalOrders'),   
      value: totalOrders,  
      sub: onWayOrders > 0 ? `${onWayOrders} ${t('onTheWay')}` : t('delivered') || 'Delivered',  
      color: 'bg-orange-50 border-orange-200', 
      textColor: 'text-orange-700', 
      subColor: 'text-orange-500' 
    },
    { 
      icon: '💰', 
      label: t('totalExpense'),   
      value: `₹${totalExpense.toLocaleString()}`, 
      sub: t('thisMonth'), 
      color: 'bg-blue-50 border-blue-200',  
      textColor: 'text-blue-700',   
      subColor: 'text-blue-500'   
    },
    { 
      icon: '⭐', 
      label: t('rating'),         
      value: avgRating, 
      sub: `${totalReviews} ${t('reviews')}`,   
      color: 'bg-purple-50 border-purple-200', 
      textColor: 'text-purple-700', 
      subColor: 'text-purple-500' 
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className={`border-2 rounded-2xl p-5 ${stat.color} hover:shadow-md transition`}>
          <div className="text-3xl mb-3">{stat.icon}</div>
          <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
          <p className="text-gray-600 text-sm font-medium mt-0.5">{stat.label}</p>
          <p className={`text-xs mt-1 ${stat.subColor}`}>{stat.sub}</p>
        </div>
      ))}
    </div>
  )
}