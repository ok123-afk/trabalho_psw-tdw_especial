const mongoose = require('mongoose');

const ServicoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  preco: { type: Number, required: true },
  duracao: { type: Number, default: 10 },
  descricaoPublica: { type: String, default: '' },
  descricaoPrivada: { type: String, default: '' },
  antecedenciaMinimaHoras: { type: Number, default: 2 },
  mecanicosAutorizados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const OficinaSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  morada: { type: String, required: true },
  telefone: { type: String },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vagasManha: { type: Number, default: 5 },
  vagasTarde: { type: Number, default: 5 },
  servicos: [ServicoSchema],
  mecanicos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.models.Oficina || mongoose.model('Oficina', OficinaSchema);