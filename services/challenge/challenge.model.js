// app/models/challenge.model.js
const Challenge = require('./challenge.model');
const mongoose = require('mongoose');


const ChallengeSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  startDate:   { type: Date, default: Date.now },
  dueDate:     { type: Date },
  status:      { type: String, default: 'pending' },
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Challenge', ChallengeSchema);