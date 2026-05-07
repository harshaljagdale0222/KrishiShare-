import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Bike } from 'lucide-react'
import { socket } from '../utils/socket'

// Fix for default marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

const bikeIcon = L.divIcon({
  html: `<div class="bg-primary-600 p-2 rounded-full shadow-lg border-2 border-white animate-bounce-subtle">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg>
         </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
})

const tractorIcon = L.divIcon({
  html: `<div class="bg-emerald-600 p-2 rounded-full shadow-lg border-2 border-white animate-bounce-subtle text-white text-xl flex items-center justify-center">🚜</div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
})

export default function OrderTrackingMap({ status, orderId, orderData, height = 'h-64' }) {
  const shopCoord = orderData?.origin ? [orderData.origin.lat, orderData.origin.lng] : [18.5204, 73.8567]
  const buyerCoord = orderData?.destination ? [orderData.destination.lat, orderData.destination.lng] : [18.5504, 73.8967]
  
  const [currentPos, setCurrentPos] = useState(orderData?.currentLocation ? [orderData.currentLocation.lat, orderData.currentLocation.lng] : shopCoord)

  useEffect(() => {
    if (!orderId) return
    const isMachinery = orderData?.category === 'tractor' || orderData?.equipmentId
    const activeStatus = isMachinery ? (status === 'confirmed' || status === 'accepted') : (status === 'out_for_delivery' || status === 'packing')

    if (!activeStatus) return

    const handleLocationUpdate = (data) => {
      if (data.orderId === orderId || data.bookingId === orderId) {
        setCurrentPos([data.lat, data.lng])
      }
    }

    socket.on('order_location_update', handleLocationUpdate)
    socket.on('booking_location_update', handleLocationUpdate)
    return () => {
      socket.off('order_location_update', handleLocationUpdate)
      socket.off('booking_location_update', handleLocationUpdate)
    }
  }, [orderId, status, orderData])

  if (status === 'pending' || status === 'accepted' || status === 'rejected' || status === 'cancelled') {
    return (
      <div className={`bg-gray-100 rounded-[32px] ${height} flex items-center justify-center text-gray-400 text-[10px] italic p-10 text-center`}>
        <div className="space-y-4">
          <div className="text-4xl animate-bounce">🛵</div>
          <p className="font-bold uppercase tracking-[0.2em] max-w-[200px]">Order "On the Way" jhalya nantar live tracking disel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative rounded-[32px] overflow-hidden shadow-inner border border-gray-100 ${height} w-full`}>
      <MapContainer center={currentPos} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} zoomControl={false}>
        {/* Google Maps Hybrid Layer for Better Accuracy */}
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          attribution='&copy; Google Maps'
        />
        <Marker position={shopCoord}><Popup>{orderData?.equipmentId ? 'मालकाचे ठिकाण' : 'दुकान (KrishiStore)'}</Popup></Marker>
        <Marker position={buyerCoord}><Popup>तुमचं ठिकाण</Popup></Marker>
        <Marker position={currentPos} icon={orderData?.equipmentId ? tractorIcon : bikeIcon} className="smooth-move"><Popup>{orderData?.equipmentId ? 'यंत्र इथे आहे!' : 'डिलिव्हरी इथे आहे!'}</Popup></Marker>
      </MapContainer>

      <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-[28px] border border-white shadow-2xl z-[1000] animate-in slide-in-from-bottom duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600"><Bike size={20} /></div>
            <div>
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none">Live Tracking</p>
              <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-[0.2em] font-black">Agent is moving towards you</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg shadow-emerald-500/20">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .smooth-move { transition: all 1s linear; }
        .animate-bounce-subtle { animation: bounce 2s infinite; }
        @keyframes bounce { 
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}} />
    </div>
  )
}
