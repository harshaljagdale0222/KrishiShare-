import { useState, useEffect } from 'react'
import { Search, ShoppingCart, Star, Plus, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import useCartStore from '../../store/cartStore'
import useLanguageStore from '../../store/languageStore'
import useProductStore from '../../store/productStore'
import toast from 'react-hot-toast'

const categories = [
  { id: 'all',        icon: '🌾', labelKey: 'allCategories' },
  { id: 'seeds',      icon: '🌱', labelKey: 'seeds'         },
  { id: 'fertilizer', icon: '🧪', labelKey: 'fertilizer'    },
  { id: 'pesticide',  icon: '🐛', labelKey: 'pesticide'     },
  { id: 'tools',      icon: '🔧', labelKey: 'tools'         },
  { id: 'irrigation', icon: '💧', labelKey: 'irrigation'    },
]

function ProductDetailModal({ product, onClose, onAddToCart }) {
  const { t } = useLanguageStore()
  if (!product) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="relative h-64 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center text-8xl shrink-0">
          {product.icon}
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition">×</button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-gray-800">{product.name}</h2>
              <p className="text-gray-500 font-medium">{product.weight > 0 ? `${product.weight} ${product.unit}` : product.unit}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary-600">₹{product.price}</span>
              <p className="text-sm text-gray-400 line-through">₹{product.mrp}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 py-2 border-y border-gray-100">
            <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg font-bold text-sm">
              <Star size={14} className="fill-amber-600" /> {product.rating}
            </div>
            <span className="text-gray-400 text-sm">{product.reviews} reviews</span>
            <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {product.stock > 0 ? `${t('available')} (${product.stock})` : t('outOfStock')}
            </span>
          </div>

          <div>
            <h3 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-widest">{t('description')}</h3>
            <p className="text-gray-600 leading-relaxed">{product.desc}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-gray-50 p-3 rounded-2xl">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Category</p>
              <p className="text-sm font-bold text-gray-700 capitalize">{product.category}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-2xl">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Weight/Size</p>
              <p className="text-sm font-bold text-gray-700">{product.weight > 0 ? `${product.weight} ${product.unit}` : product.unit}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={() => { onAddToCart(product); onClose() }}
            disabled={product.stock <= 0}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary-600/30 transition disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <ShoppingCart size={20} /> {t('addToCart')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product, onOpenDetail }) {
  const { items, addItem, updateQuantity } = useCartStore()
  const { t } = useLanguageStore()
  const cartItem = items.find(i => i._id === product._id)
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100)

  const tagLabel = {
    bestseller: t('bestseller'),
    topRated:   t('topRated'),
    popular:    t('popular'),
  }

  const tagColor = {
    bestseller: 'bg-amber-400 text-white',
    topRated:   'bg-purple-500 text-white',
    popular:    'bg-green-500 text-white',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col h-full">
      <div 
        className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 text-center relative cursor-pointer group"
        onClick={() => onOpenDetail(product)}
      >
        <div className="text-6xl transition-transform group-hover:scale-110 duration-300">{product.icon}</div>
        {product.tag && (
          <span className={`absolute top-2 left-2 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${tagColor[product.tag]}`}>
            {tagLabel[product.tag]}
          </span>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-red-500 font-black text-xs uppercase tracking-widest">{t('outOfStock')}</span>
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="cursor-pointer mb-2" onClick={() => onOpenDetail(product)}>
          <p className="font-bold text-gray-800 text-sm leading-tight line-clamp-1">{product.name}</p>
          <p className="text-gray-400 text-[10px] mt-0.5">
            {product.weight > 0 ? `${product.weight} ${product.unit}` : product.unit}
          </p>
        </div>
        
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-bold text-gray-900">₹{product.price}</span>
              <span className="text-gray-400 text-[10px] line-through">₹{product.mrp}</span>
            </div>
            <div className="flex items-center gap-1 bg-amber-400/10 text-amber-600 px-1.5 py-0.5 rounded-md">
              <Star size={10} className="fill-amber-600" />
              <span className="text-[10px] font-bold">{product.rating}</span>
            </div>
          </div>

          <div>
            {!cartItem ? (
              <button
                onClick={() => { addItem(product); toast.success(`${product.icon} ${product.name} cart madhe add!`) }}
                disabled={product.stock <= 0}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <ShoppingCart size={12} /> {t('addToCart')}
              </button>
            ) : (
              <div className="flex items-center justify-between bg-primary-50 border border-primary-500 rounded-xl overflow-hidden h-[34px]">
                <button onClick={() => updateQuantity(product._id, cartItem.quantity - 1)}
                  className="px-3 h-full text-primary-600 hover:bg-primary-100 transition font-bold">
                  <Minus size={12} />
                </button>
                <span className="font-bold text-primary-700 text-xs">{cartItem.quantity}</span>
                <button onClick={() => updateQuantity(product._id, cartItem.quantity + 1)}
                  className="px-3 h-full text-primary-600 hover:bg-primary-100 transition font-bold">
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Shop() {
  const { products, fetchProducts } = useProductStore()
  const { addItem, getTotalItems } = useCartStore()
  const { t } = useLanguageStore()

  const [activeCategory, setActiveCategory] = useState('all')
  const [search,         setSearch]         = useState('')
  const [sortBy,         setSortBy]         = useState('default')
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const filtered = products
    .filter(p => activeCategory === 'all' || p.category === activeCategory)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price_low')  return a.price - b.price
      if (sortBy === 'price_high') return b.price - a.price
      if (sortBy === 'rating')     return b.rating - (a.rating || 0)
      return 0
    })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-16 md:top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800">🛒 {t('shopTitle')}</h1>
              <p className="text-xs text-gray-400">{t('deliveryTime')} • {filtered.length} products</p>
            </div>
            <Link to="/cart" className="relative bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium text-sm hover:bg-primary-700 transition">
              <ShoppingCart size={16} /> Cart
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {getTotalItems()}
                </span>
              )}
            </Link>
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchProducts')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 transition"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-primary-400 text-gray-700"
            >
              <option value="default">{t('sortBy')}</option>
              <option value="price_low">{t('cheapFirst')}</option>
              <option value="price_high">{t('expFirst')}</option>
              <option value="rating">{t('bestRating')}</option>
            </select>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition
                  ${activeCategory === cat.id ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat.icon} {t(cat.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 font-medium">{t('noProductsFound')}</p>
            <p className="text-gray-400 text-sm">{t('tryDifferentSearch')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard 
                key={product._id} 
                product={product} 
                onOpenDetail={setSelectedProduct} 
              />
            ))}
          </div>
        )}
      </div>

      <ProductDetailModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onAddToCart={addItem}
      />

      {getTotalItems() > 0 && (
        <div className="fixed bottom-6 left-4 right-4 md:hidden z-50">
          <Link to="/cart"
            className="bg-primary-600 text-white rounded-2xl py-4 px-6 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2">
              <span className="bg-white text-primary-600 font-bold w-7 h-7 rounded-full flex items-center justify-center text-sm">
                {getTotalItems()}
              </span>
              <span className="font-semibold">{t('itemsInCart')}</span>
            </div>
            <span className="font-bold">{t('viewCart')}</span>
          </Link>
        </div>
      )}
    </div>
  )
}