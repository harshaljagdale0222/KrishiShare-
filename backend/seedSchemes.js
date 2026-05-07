const mongoose = require('mongoose');
const Scheme = require('./models/Scheme');
require('dotenv').config();

const schemes = [
  {
    title: {
      en: "PM-Kisan Samman Nidhi",
      mr: "प्रधानमंत्री किसान सन्मान निधी"
    },
    description: {
      en: "Under this scheme, all landholding farmers' families at the country will be provided a financial benefit of Rs.6000 per year.",
      mr: "या योजनेअंतर्गत देशातील सर्व जमीनधारक शेतकरी कुटुंबांना वर्षाला ६००० रुपयांचा आर्थिक लाभ दिला जातो."
    },
    category: { en: "Direct Benefit", mr: "थेट लाभ" },
    benefit: { en: "Rs. 6000 per year in 3 installments", mr: "वर्षीला ६००० रुपये (३ हप्त्यांमध्ये)" },
    eligibility: { en: "All landholding farmers", mr: "सर्व जमीनधारक शेतकरी" },
    applyUrl: "https://pmkisan.gov.in/",
    image: "https://img.etimg.com/thumb/msid-100234567,width-640,resizemode-4/pm-kisan.jpg"
  },
  {
    title: {
      en: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
      mr: "प्रधानमंत्री पीक विमा योजना"
    },
    description: {
      en: "To provide insurance coverage and financial support to the farmers in the event of failure of any of the notified crops.",
      mr: "अधिसूचित पिके निकामी झाल्यास शेतकऱ्यांना विमा संरक्षण आणि आर्थिक सहाय्य प्रदान करणे."
    },
    category: { en: "Insurance", mr: "विमा" },
    benefit: { en: "Full coverage against crop loss", mr: "पीक नुकसानीसाठी पूर्ण विमा संरक्षण" },
    eligibility: { en: "All farmers including sharecroppers", mr: "सर्व शेतकरी (मिळकतदार शेतकऱ्यांसह)" },
    applyUrl: "https://pmfby.gov.in/",
    image: "https://panchayatgram.in/wp-content/uploads/2023/07/pmfby.jpg"
  },
  {
    title: {
      en: "Namo Shetkari Mahasanman Nidhi",
      mr: "नमो शेतकरी महासन्मान निधी"
    },
    description: {
      en: "Maharashtra government scheme to provide additional Rs. 6000 to farmers annually alongside PM-Kisan.",
      mr: "महाराष्ट्र सरकारची योजना ज्यामध्ये पीएम-किसान सोबतीला शेतकऱ्यांना वर्षाला अतिरिक्त ६००० रुपये दिले जातात."
    },
    category: { en: "State Benefit", mr: "राज्य लाभ" },
    benefit: { en: "Total Rs. 12000 annually (combined with PM-Kisan)", mr: "वर्षीला एकूण १२,००० रुपये (पीएम-किसानसह)" },
    applyUrl: "https://mahabhulekh.maharashtra.gov.in/",
    image: "https://static.abplive.com/wp-content/uploads/sites/4/2023/05/31165225/Namo-Shetkari-Mahasanman-Yojna.jpg"
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/krishi-share');
    await Scheme.deleteMany({});
    await Scheme.insertMany(schemes);
    console.log("Database Seeded with Real Schemes!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
