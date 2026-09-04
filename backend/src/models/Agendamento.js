const mongoose = require('mongoose');

const AgendamentoSchema = new mongoose.Schema({
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  veiculoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Veiculo', required: true },
  oficinaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Oficina', required: true },
  mecanicoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  servico: { type: String, required: true },
  data: { type: Date, required: true },
  turno: { type: String, enum: ['manha', 'tarde'], required: true },
  estado: { type: String, default: 'Pendente' },
  dataCriacao: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Agendamento || mongoose.model('Agendamento', AgendamentoSchema);