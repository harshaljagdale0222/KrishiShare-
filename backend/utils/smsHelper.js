const axios = require('axios');

/**
 * Send real SMS using Fast2SMS Gateway
 * @param {string} phone - 10 digit phone number
 * @param {string} message - Message content
 */
const sendSMS = async (phone, message) => {
  const FAST2SMS_KEY = process.env.FAST2SMS_KEY;

  if (!FAST2SMS_KEY) {
    console.log(`\n--- 📱 SMS SIMULATION (NO KEY) ---`);
    console.log(`TO: ${phone}`);
    console.log(`MESSAGE: ${message}`);
    console.log(`----------------------------------\n`);
    return { success: true, message: "Simulation Mode" };
  }

  try {
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: FAST2SMS_KEY,
        message: message,
        language: 'english',
        route: 'q',
        numbers: phone,
      },
      headers: {
        "cache-control": "no-cache"
      }
    });

    if (response.data.return) {
      console.log(`✅ SMS Sent Successfully to ${phone}`);
      return { success: true, data: response.data };
    } else {
      console.error(`❌ Fast2SMS Error:`, response.data.message);
      return { success: false, error: response.data.message };
    }
  } catch (err) {
    console.error('❌ SMS Helper Exception:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendSMS };
