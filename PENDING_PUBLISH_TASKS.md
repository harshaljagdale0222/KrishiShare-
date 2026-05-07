# Krishi Share - Pending Tasks for Production (Publish)
*ही कामे अ‍ॅप पब्लिश (Live) करण्यापूर्वी पूर्ण करणे आवश्यक आहे.*

### 1. Razorpay API Keys जोडणे
Payment Gateway खऱ्या अर्थाने सुरू करण्यासाठी, Razorpay डॅशबोर्डवरून `Key ID` आणि `Key Secret` घेऊन ते Backend च्या `.env` फाईलमध्ये टाकणे अनिवार्य आहे.
- **फाईल:** `backend/.env`
- **व्हेरिएबल्स:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

### 2. लोकल होस्ट लिंक्स (localhost) रिप्लेस करणे
सध्या फ्रंटएंड आणि बॅकएंड एकाच कॉम्प्युटरवर (localhost:5000) चालत आहेत. जेव्हा आपण हे अ‍ॅप Vercel / Render सारख्या प्लॅटफॉर्मवर होस्ट करू, तेव्हा `localhost` काढून खऱ्या डोमेनची लिंक (उदा. https://api.krishishare.com) टाकावी लागेल.
- **फाईल्स:** `src/api.js`, आणि `StoreOwnerDashboard.jsx` (तसेच इतर डॅशबोर्ड जिथे Socket.io मॅन्युअली कनेक्ट केले आहे).

### 3. SMS Gateway चे क्रेडिट्स / API जोडणे
सध्या `smsHelper.js` मध्ये SMS चे स्ट्रक्चर बनवले आहे. खऱ्या मोबाईल नंबरवर SMS पाठवण्यासाठी Twilio, Fast2SMS किंवा AWS SNS सारख्या SMS Gateway चे API Keys आणि Credits जोडावे लागतील.
- **फाईल:** `backend/utils/smsHelper.js`
