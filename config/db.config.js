// app/config/db.config.js
require('dotenv').config();

module.exports = {
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/defisDB'
};