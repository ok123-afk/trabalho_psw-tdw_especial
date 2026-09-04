// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['cliente', 'mecanico', 'admin'], 
    default: 'cliente' 
  },
  
oficina: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'Oficina',
  default: null 
} 
});

module.exports = mongoose.model('User', UserSchema);