// services/weight/weight.controller.js
const Weight = require('./weight.model');

// Ajouter une pesée
exports.createWeight = async (req, res) => {
  try {
    const { weight, date, note } = req.body;
    
    const newWeight = new Weight({
      weight,
      date: date || Date.now(),
      note,
      user: req.user.id
    });
    
    await newWeight.save();
    res.status(201).json({ message: 'Pesée enregistrée avec succès', weight: newWeight });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer toutes les pesées de l'utilisateur
exports.getAllWeights = async (req, res) => {
  try {
    const weights = await Weight.find({ user: req.user.id })
      .sort({ date: -1 }); // Tri par date décroissante
    res.status(200).json(weights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer la dernière pesée
exports.getLatestWeight = async (req, res) => {
  try {
    const weight = await Weight.findOne({ user: req.user.id })
      .sort({ date: -1 })
      .limit(1);
    
    if (!weight) {
      return res.status(404).json({ message: 'Aucune pesée enregistrée' });
    }
    
    res.status(200).json(weight);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer une pesée par ID
exports.getWeightById = async (req, res) => {
  try {
    const weight = await Weight.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!weight) {
      return res.status(404).json({ message: 'Pesée non trouvée' });
    }
    
    res.status(200).json(weight);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mettre à jour une pesée
exports.updateWeight = async (req, res) => {
  try {
    const weight = await Weight.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    
    if (!weight) {
      return res.status(404).json({ message: 'Pesée non trouvée' });
    }
    
    res.status(200).json({ message: 'Pesée mise à jour', weight });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Supprimer une pesée
exports.deleteWeight = async (req, res) => {
  try {
    const weight = await Weight.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    if (!weight) {
      return res.status(404).json({ message: 'Pesée non trouvée' });
    }
    
    res.status(200).json({ message: 'Pesée supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Obtenir les statistiques
exports.getWeightStats = async (req, res) => {
  try {
    const weights = await Weight.find({ user: req.user.id })
      .sort({ date: 1 }); // Tri par date croissante
    
    if (weights.length === 0) {
      return res.status(404).json({ message: 'Aucune pesée enregistrée' });
    }
    
    const latest = weights[weights.length - 1];
    const oldest = weights[0];
    
    // Variation totale
    const totalChange = latest.weight - oldest.weight;
    
    // Variation sur 7 jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weightsLast7Days = weights.filter(w => new Date(w.date) >= sevenDaysAgo);
    const change7Days = weightsLast7Days.length > 0 
      ? latest.weight - weightsLast7Days[0].weight 
      : 0;
    
    // Variation sur 30 jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const weightsLast30Days = weights.filter(w => new Date(w.date) >= thirtyDaysAgo);
    const change30Days = weightsLast30Days.length > 0 
      ? latest.weight - weightsLast30Days[0].weight 
      : 0;
    
    res.status(200).json({
      current: latest.weight,
      totalChange,
      change7Days,
      change30Days,
      totalEntries: weights.length,
      firstEntry: oldest.date,
      latestEntry: latest.date
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
