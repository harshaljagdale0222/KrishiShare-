/**
 * Sends OTP via WhatsApp Redirection (Free Method)
 */
export const sendWhatsAppOTP = (phone, otp) => {
  const message = `🌾 *KrishiShare Platform* \n\nतुमचा लॉगिन ओटीपी आहे: *${otp}* \n\nहा ओटीपी ५ मिनिटांसाठी वैध आहे. कोणाशीही शेअर करू नका.`;
  const encodedMessage = encodeURIComponent(message);
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

/**
 * General Purpose WhatsApp Message Utility
 */
export const sendWhatsAppMessage = (phone, message) => {
  const encodedMessage = encodeURIComponent(message);
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

/**
 * Message Templates
 */
export const WA_TEMPLATES = {
  ORDER_CONFIRMED: (orderId) => `नमस्ते! तुमची ऑर्डर #${orderId} यशस्वीरित्या नोंदवली गेली आहे. 🚜`,
  EQUIPMENT_BOOKED: (name) => `नमस्ते! तुमचं ${name} बुकिंग कन्फर्म झालं आहे. 🌾`,
  ADMIN_NOTICE: (msg) => `⚠️ *KrishiShare महत्त्वाची सूचना:* \n${msg}`
};
