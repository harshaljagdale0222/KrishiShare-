import { Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useLanguageStore from '../store/languageStore'

export default function Home() {
  const { isAuthenticated } = useAuthStore()
  const { t } = useLanguageStore()

  const features = [
    {
      icon: '🚜',
      title: t('feat1Title'),
      desc: t('feat1Desc'),
      link: '/book-equipment',
      color: 'bg-green-50 border-green-200',
      btn: 'bg-primary-600',
    },
    {
      icon: '🛒',
      title: t('feat2Title'),
      desc: t('feat2Desc'),
      link: '/shop',
      color: 'bg-orange-50 border-orange-200',
      btn: 'bg-secondary-500',
    },
    {
      icon: '🌤️',
      title: t('feat3Title'),
      desc: t('feat3Desc'),
      link: '/dashboard',
      color: 'bg-blue-50 border-blue-200',
      btn: 'bg-blue-500',
    },
  ]

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-green-800 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-6xl mb-4">🌾</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{t('heroTitle')}</h1>
          <p className="text-xl text-green-100 mb-2 font-medium">{t('heroSubtitle')}</p>
          <p className="text-green-200 mb-10">{t('heroDesc')}</p>

          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-equipment"
                className="bg-white text-primary-700 px-8 py-3 rounded-full font-bold text-lg hover:bg-green-50 transition shadow-lg">
                🚜 {t('bookEquipment')}
              </Link>
              <Link to="/shop"
                className="bg-secondary-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-secondary-600 transition shadow-lg">
                🛒 {t('krishiMartBtn')}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register"
                className="bg-white text-primary-700 px-8 py-3 rounded-full font-bold text-lg hover:bg-green-50 transition shadow-lg">
                🌱 {t('joinFree')}
              </Link>
              <Link to="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-white hover:text-primary-700 transition">
                {t('login')}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-10 border-b">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-4 text-center">
          {[
            { num: '500+',  label: t('farmers')         },
            { num: '200+',  label: t('equipmentOwners') },
            { num: '1000+', label: t('bookings')        },
            { num: '50+',   label: t('products')        },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-primary-600">{s.num}</div>
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            {t('howTitle')} 💪
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className={`border-2 rounded-2xl p-6 ${f.color} hover:shadow-md transition`}>
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-600 mb-4">{f.desc}</p>
                <Link to={f.link}
                  className={`${f.btn} text-white px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition inline-block`}>
                  {t('startNow')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-12">{t('howTitle')} 🤔</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', emoji: '📝', title: t('step1Title'), desc: t('step1Desc') },
              { step: '2', emoji: '🔍', title: t('step2Title'), desc: t('step2Desc') },
              { step: '3', emoji: '✅', title: t('step3Title'), desc: t('step3Desc') },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 text-center py-8">
        <div className="text-2xl mb-2">🌾</div>
        <p className="font-bold text-white">KrishiShare</p>
        <p className="text-sm mt-1">{t('footerText')} © 2024</p>
      </footer>

    </div>
  )
}
