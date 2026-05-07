const express = require('express');
const router = express.Router();
const Scheme = require('../models/Scheme');

// Get all schemes
router.get('/', async (req, res) => {
  try {
    const schemes = await Scheme.find().sort({ createdAt: -1 });
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new scheme (Admin only)
router.post('/', async (req, res) => {
  try {
    const newScheme = new Scheme(req.body);
    const saved = await newScheme.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete scheme (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    await Scheme.findByIdAndDelete(req.params.id);
    res.json({ message: "Scheme deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Temporary Route to seed via Browser/Postman
router.get('/seed-real', async (req, res) => {
  try {
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
        applyUrl: "https://mahadbt.maharashtra.gov.in/",
        image: "https://static.abplive.com/wp-content/uploads/sites/4/2023/05/31165225/Namo-Shetkari-Mahasanman-Yojna.jpg"
      }
    ];
    await Scheme.deleteMany({});
    await Scheme.insertMany(realSchemes);
    res.json({ message: "✅ Success! Real Schemes Seeded with updated links." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new scheme (Protect this with admin auth in production)
router.post('/', async (req, res) => {
  const scheme = new Scheme(req.body);
  try {
    const newScheme = await scheme.save();
    res.status(201).json(newScheme);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
