// services/weight/weight.model.js
const mongoose = require('mongoose');

const WeightSchema = new mongoose.Schema({
  weight: { 
    type: Number, 
    required: true,
    min: 0,
    max: 500 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  note: { 
    type: String,
    maxlength: 200
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes par utilisateur et date
WeightSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Weight', WeightSchema);
