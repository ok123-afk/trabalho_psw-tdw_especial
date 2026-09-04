const mongoose = require('mongoose');

let conectado = false;

const connectDB = async () => {
  if (conectado && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    conectado = true;
    console.log('MongoDB Atlas ligado');
  } catch (err) {
    conectado = false;
    console.error('Erro MongoDB:', err.message);
    throw err;
  }
};

module.exports = connectDB;