const mongoose = require('mongoose');
const Scheme = require('./models/Scheme');
require('dotenv').config();

const realSchemes = [
  {
    title: { en: "PM-Kisan Samman Nidhi", mr: "प्रधानमंत्री किसान सन्मान निधी" },
    description: { en: "Annual financial benefit of Rs.6000 for farmers.", mr: "शेतकऱ्यांसाठी वर्षाला ६००० रुपयांचा आर्थिक लाभ." },
    category: { en: "Direct Benefit", mr: "थेट लाभ" },
    benefit: { en: "Rs. 6000 per year in 3 installments", mr: "वर्षीला ६००० रुपये (३ हप्त्यांमध्ये)" },
    applyUrl: "https://pmkisan.gov.in/",
    image: "https://img.etimg.com/thumb/msid-100234567,width-640,resizemode-4/pm-kisan.jpg"
  },
  {
    title: { en: "Pradhan Mantri Fasal Bima Yojana (PMFBY)", mr: "प्रधानमंत्री पीक विमा योजना" },
    description: { en: "Insurance coverage for crop failure.", mr: "पीक निकामी झाल्यास विमा संरक्षण." },
    category: { en: "Insurance", mr: "विमा" },
    benefit: { en: "Full coverage against crop loss", mr: "पीक नुकसानीसाठी पूर्ण विमा संरक्षण" },
    applyUrl: "https://pmfby.gov.in/",
    image: "https://panchayatgram.in/wp-content/uploads/2023/07/pmfby.jpg"
  },
  {
    title: { en: "Namo Shetkari Mahasanman Nidhi", mr: "नमो शेतकरी महासन्मान निधी" },
    description: { en: "Additional Rs. 6000 from Maharashtra Government.", mr: "महाराष्ट्र सरकारकडून अतिरिक्त ६००० रुपये." },
    category: { en: "State Benefit", mr: "राज्य लाभ" },
    benefit: { en: "Total Rs. 12000 annually (combined with PM-Kisan)", mr: "वर्षीला एकूण १२,००० रुपये (पीएम-किसानसह)" },
    applyUrl: "https://mahabhulekh.maharashtra.gov.in/",
    image: "https://static.abplive.com/wp-content/uploads/sites/4/2023/05/31165225/Namo-Shetkari-Mahasanman-Yojna.jpg"
  }
];

const forceSeed = async () => {
  try {
    console.log("Connecting to: " + process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    await Scheme.deleteMany({});
    await Scheme.insertMany(realSchemes);
    console.log("✅ DONE: Real Schemes added to Atlas!");
    process.exit();
  } catch (err) {
    console.error("❌ FAILED: " + err.message);
    process.exit(1);
  }
};

forceSeed();
