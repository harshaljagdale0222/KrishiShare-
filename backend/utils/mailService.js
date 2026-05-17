const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'harshaljagdale40@gmail.com',
    pass: process.env.SMTP_PASS || 'ipobukfqeptugwyx'
  }
});

const sendWelcomeEmail = async (userEmail, userName, role) => {
  const roleName = role === 'farmer' ? 'शेतकरी' : (role === 'mart_owner' ? 'मार्ट मालक' : 'कृषी अवजारे मालक');
  
  const mailOptions = {
    from: `"KrishiShare" <${process.env.SMTP_USER || 'harshaljagdale40@gmail.com'}>`,
    to: userEmail,
    subject: "KrishiShare मध्ये तुमचे स्वागत आहे! 🌾",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 32px; overflow: hidden; background-color: #ffffff; box-shadow: 0 20px 50px rgba(0,0,0,0.05);">
        <div style="background-color: #059669; padding: 50px 20px; text-align: center; color: #ffffff;">
          <div style="background-color: rgba(255,255,255,0.2); width: 80px; hieght: 80px; line-height: 80px; border-radius: 24px; display: inline-block; font-size: 40px; margin-bottom: 20px;">🌾</div>
          <h1 style="margin: 0; font-size: 36px; font-weight: 900; letter-spacing: -1px;">KrishiShare</h1>
          <p style="font-size: 16px; opacity: 0.9; font-weight: 600; margin-top: 5px;">समृद्ध शेती, समृद्ध शेतकरी</p>
        </div>
        
        <div style="padding: 50px; text-align: center;">
          <h2 style="color: #1e293b; font-size: 26px; font-weight: 800; margin-bottom: 15px;">नमस्कार ${userName}!</h2>
          <p style="color: #64748b; font-size: 17px; font-weight: 500; line-height: 1.6; margin-bottom: 30px;">
            तुमचे KrishiShare परिवारात मनापासून स्वागत आहे. तुम्ही आमच्यासोबत <b>${roleName}</b> म्हणून यशस्वीपणे नोंदणी केली आहे.
          </p>
          
          <div style="background-color: #f0fdf4; border-radius: 24px; padding: 30px; border: 1px solid #dcfce7; margin-bottom: 30px;">
            <p style="color: #065f46; font-size: 12px; font-weight: 800; text-transform: uppercase; tracking-wider: 0.2em; margin-bottom: 8px;">तुमची भूमिका</p>
            <p style="color: #059669; font-size: 22px; font-weight: 900; margin: 0;">${roleName}</p>
          </div>
          
          <a href="http://localhost:5173" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 20px 45px; border-radius: 20px; text-decoration: none; font-weight: 900; font-size: 15px; box-shadow: 0 15px 30px rgba(5, 150, 105, 0.25);">डॅशबोर्ड सुरू करा →</a>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome Email Sent to:', userEmail);
  } catch (error) {
    console.error('❌ Welcome Email Failed:', error.message);
  }
};

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"KrishiShare" <${process.env.SMTP_USER || 'harshaljagdale40@gmail.com'}>`,
    to: email,
    subject: "KrishiShare लॉगिन ओटीपी 🌾",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; padding: 40px; text-align: center; background-color: #ffffff;">
        <div style="margin-bottom: 20px;">
          <span style="font-size: 50px;">🌾</span>
          <h1 style="color: #059669; margin: 10px 0 5px 0; font-size: 28px; font-weight: 900;">KrishiShare</h1>
          <p style="color: #64748b; font-size: 14px; margin: 0; font-weight: 600;">तुमचा सुरक्षित शेती सोबती</p>
        </div>
        
        <div style="background-color: #f0fdf4; border-radius: 20px; padding: 30px; margin-top: 30px; border: 1px solid #dcfce7;">
          <p style="color: #065f46; font-size: 16px; font-weight: 700; margin-bottom: 20px;">तुमचा लॉगिन ओटीपी:</p>
          <div style="background-color: #ffffff; display: inline-block; padding: 15px 30px; border-radius: 12px; border: 2px solid #059669; margin-bottom: 15px;">
            <span style="font-size: 36px; font-weight: 900; color: #059669; letter-spacing: 10px;">${otp}</span>
          </div>
          <p style="color: #ef4444; font-size: 12px; font-weight: 600; margin-top: 15px;">हा ओटीपी ५ मिनिटांसाठी वैध आहे. कोणाशीही शेअर करू नका.</p>
        </div>
      </div>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP Email Sent:', info.response);
    return info;
  } catch (error) {
    console.error('❌ OTP Email FAILED Error:', error.message);
    throw error;
  }
};

module.exports = { sendWelcomeEmail, sendOTPEmail };
