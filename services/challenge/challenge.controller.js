// services/challenge/challenge.controller.js
const Challenge = require('./challenge.model'); // <-- Chemin corrigé

exports.createChallenge = async (req, res) => {
  try {
    const challenge = new Challenge({
      ...req.body,
      user: req.user.id,
    });
    await challenge.save();
    res.status(201).json({ message: 'Défi créé avec succès', challenge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find({ user: req.user.id });
    res.status(200).json(challenges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({ _id: req.params.id, user: req.user.id });
    if (!challenge) return res.status(404).json({ message: 'Défi non trouvé' });
    res.status(200).json(challenge);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!challenge) return res.status(404).json({ message: 'Défi non trouvé' });
    res.status(200).json({ message: 'Défi mis à jour', challenge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!challenge) return res.status(404).json({ message: 'Défi non trouvé' });
    res.status(200).json({ message: 'Défi supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};