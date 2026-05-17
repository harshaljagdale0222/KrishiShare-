import { useState, useEffect } from 'react'
import { Search, ShoppingCart, Star, Plus, Minus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
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
  const { t, language } = useLanguageStore()
  const [qty, setQty] = useState(1)
  
  if (!product) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="relative h-64 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center text-8xl shrink-0">
          {product.icon}
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition">×</button>
        </div>
        
        <div className="p-8 overflow-y-auto space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              {/* 1. Shop Name */}
              <div className="flex items-center gap-2">
                 <span className="w-1 h-3 bg-gray-300 rounded-full" />
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">
                   🏪 {product.ownerId?.businessName || product.ownerId?.name}
                 </p>
              </div>
              
              {/* 2. Company/Brand Name */}
              {product.brand && (
                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em] leading-none ml-3">
                  🏷️ {product.brand}
                </p>
              )}

              {/* 3. Product Name */}
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">{product.name}</h2>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{product.weight > 0 ? `${product.weight} ${product.unit}` : product.unit}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-emerald-600">₹{product.price}</span>
              <p className="text-xs text-gray-400 font-bold line-through tracking-widest">MRP ₹{product.mrp}</p>
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

          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-4">
            <p className="text-sm font-bold text-gray-700">{t('quantity') || 'Quantity'}</p>
            <div className="flex items-center border-2 border-primary-500 rounded-xl overflow-hidden h-10 bg-white">
              <button 
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-4 h-full text-primary-600 hover:bg-primary-50 transition border-r-2 border-primary-500"
              >
                <Minus size={16} />
              </button>
              <input 
                type="number"
                min="1"
                value={qty || ''}
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                  if (val > (product.stock || 999)) {
                    toast.error(`Fakt ${product.stock} stock shillak aahe!`);
                    setQty(product.stock);
                  } else {
                    setQty(Math.max(0, val));
                  }
                }}
                className="w-16 h-full text-center font-black text-primary-700 outline-none bg-gray-50/50 focus:bg-white transition-colors placeholder-gray-300"
              />
              <button 
                onClick={() => {
                  const nextQty = qty + 1;
                  if (nextQty > (product.stock || 999)) {
                    toast.error(language === 'mr' ? `फक्त ${product.stock} स्टॉक शिल्लक आहे!` : `Only ${product.stock} stock available!`);
                    setQty(product.stock);
                  } else {
                    setQty(nextQty);
                  }
                }}
                className="px-4 h-full text-primary-600 hover:bg-primary-50 transition border-l-2 border-primary-500"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={() => { 
              onAddToCart(product, qty); 
              onClose();
              toast.success(`${qty} items added to cart!`);
            }}
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
  const { language } = useLanguageStore()
  const isMR = language === 'mr'
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
          {/* 1. Shop Name */}
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5 opacity-60">
            🏪 {product.ownerId?.businessName || product.ownerId?.name}
          </p>
          
          {/* 2. Brand Name */}
          {product.brand && (
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
              {product.brand}
            </p>
          )}
          
          {/* 3. Product Name */}
          <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{product.name}</p>
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
                  className="px-3 h-full text-primary-600 hover:bg-primary-100 transition font-bold border-r border-primary-200">
                  <Minus size={12} />
                </button>
                <input 
                  type="number"
                  min="0"
                  value={cartItem.quantity || ''}
                  placeholder="0"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                    if (val > (product.stock || 999)) {
                       toast.error(`Fakt ${product.stock} stock shillak aahe!`);
                       updateQuantity(product._id, product.stock);
                    } else if (val >= 0) {
                       updateQuantity(product._id, val);
                    }
                  }}
                  className="w-12 h-full bg-white/50 text-center font-black text-primary-700 text-xs outline-none focus:bg-white transition-colors placeholder-gray-300"
                />
                <button 
                  onClick={() => {
                    const nextQty = cartItem.quantity + 1;
                    if (nextQty > (product.stock || 999)) {
                      toast.error(language === 'mr' ? `फक्त ${product.stock} स्टॉक शिल्लक आहे!` : `Only ${product.stock} stock available!`);
                      updateQuantity(product._id, product.stock);
                    } else {
                      updateQuantity(product._id, nextQty);
                    }
                  }}
                  className="px-3 h-full text-primary-600 hover:bg-primary-100 transition font-bold border-l border-primary-200"
                >
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
  const { t, language } = useLanguageStore()
  const navigate = useNavigate()
  const isMR = language === 'mr'

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
            <button 
              onClick={() => {
                if (getTotalItems() > 0) {
                  navigate('/cart')
                } else {
                  toast.error(isMR ? 'आधी कार्टमध्ये वस्तू भरा!' : 'Add items to cart first!')
                }
              }}
              className={`relative px-4 py-2 rounded-xl flex items-center gap-2 font-medium text-sm transition ${getTotalItems() > 0 ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <ShoppingCart size={16} /> Cart
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {getTotalItems()}
                </span>
              )}
            </button>
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