const mongoose = require('mongoose');

const VeiculoSchema = new mongoose.Schema({
  marca: { type: String, required: true },
  modelo: { type: String, required: true },
  matricula: { type: String, required: true, unique: true },
  ano: { type: Number, required: true },
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Veiculo', VeiculoSchema);