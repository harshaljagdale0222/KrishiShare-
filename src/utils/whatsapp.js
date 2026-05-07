/**
 * Sends OTP via WhatsApp Redirection (Free Method)
 * @param {string} phone - User's phone number
 * @param {string} otp - The generated OTP
 */
export const sendWhatsAppOTP = (phone, otp) => {
  const message = `🌾 *KrishiShare Platform* \n\nतुमचा लॉगिन ओटीपी आहे: *${otp}* \n\nहा ओटीपी ५ मिनिटांसाठी वैध आहे. कोणाशीही शेअर करू नका.`;
  const encodedMessage = encodeURIComponent(message);
  
  // Format phone number (ensure it starts with 91 for India)
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
  
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};
