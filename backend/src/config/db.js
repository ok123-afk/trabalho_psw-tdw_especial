const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Atlas ligado');
    console.log(`Base de dados: ${conn.connection.name}`);
  } catch (err) {
    console.error('Erro MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
