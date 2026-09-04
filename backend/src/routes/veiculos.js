const express = require('express');
const router = express.Router();
const Veiculo = require('../models/Veiculo');
const Agendamento = require('../models/Agendamento');
const { verifyToken } = require('../middleware/auth');

router.get('/cliente/:id', verifyToken, async (req, res) => {
  try {
    const veiculos = await Veiculo.find({ clienteId: req.params.id });
    res.json(veiculos);
  } catch (err) {
    res.status(500).json({ msg: 'Erro ao procurar veículos' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const novoVeiculo = new Veiculo({ ...req.body, clienteId: req.user.id });
    await novoVeiculo.save();
    res.status(201).json(novoVeiculo);
  } catch (err) {
    res.status(400).json({ msg: 'Erro ao guardar veículo ou matrícula duplicada' });
  }
});

// Só o próprio dono do veículo pode editar os seus dados
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const veiculo = await Veiculo.findById(req.params.id);
    if (!veiculo) return res.status(404).json({ msg: 'Veículo não encontrado' });
    if (String(veiculo.clienteId) !== String(req.user.id)) {
      return res.status(403).json({ msg: 'Sem permissão sobre este veículo' });
    }
    const { marca, modelo, matricula, ano } = req.body;
    veiculo.marca = marca;
    veiculo.modelo = modelo;
    veiculo.matricula = matricula;
    veiculo.ano = ano;
    await veiculo.save();
    res.json(veiculo);
  } catch (err) {
    res.status(400).json({ msg: 'Erro ao editar veículo' });
  }
});

// Um veículo com marcações "Em curso" não pode ser removido. Ao remover,as marcações Pendentes/Canceladas desse veículo são limpas com ele; as Concluídas ficam guardadas como histórico.
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const veiculo = await Veiculo.findById(req.params.id);
    if (!veiculo) return res.status(404).json({ msg: 'Veículo não encontrado' });
    if (String(veiculo.clienteId) !== String(req.user.id)) {
      return res.status(403).json({ msg: 'Sem permissão sobre este veículo' });
    }

    const emCurso = await Agendamento.countDocuments({ veiculoId: veiculo._id, estado: 'Em curso' });
    if (emCurso > 0) {
      return res.status(409).json({ msg: 'Não é possível remover: este veículo tem marcações em curso' });
    }

    await Agendamento.deleteMany({ veiculoId: veiculo._id, estado: { $in: ['Pendente', 'Cancelado'] } });
    await veiculo.deleteOne();
    res.json({ msg: 'Veículo removido' });
  } catch (err) {
    res.status(400).json({ msg: 'Erro ao remover veículo' });
  }
});

module.exports = router;
