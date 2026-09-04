const express = require('express');
const router = express.Router();
const Agendamento = require('../models/Agendamento');
const Oficina = require('../models/Oficina');
const { verifyToken, requireRole } = require('../middleware/auth');

const HORA_INICIO_TURNO = { manha: 9, tarde: 14 };

// Cria um agendamento validando vagas disponíveis no turno, antecedência mínima do serviço e atribuindo um mecânico sem conflito de horário
router.post('/', verifyToken, requireRole('cliente'), async (req, res) => {
  try {
    const { veiculoId, oficinaId, servico, data, turno } = req.body;

    const oficina = await Oficina.findById(oficinaId);
    if (!oficina) return res.status(404).json({ msg: 'Oficina não encontrada' });

    const servicoInfo = oficina.servicos.find(s => s.nome === servico);
    if (!servicoInfo) return res.status(400).json({ msg: 'Serviço inválido para esta oficina' });

    const dataAgendamento = new Date(data);
    dataAgendamento.setHours(HORA_INICIO_TURNO[turno] ?? 9, 0, 0, 0);
    const horasAteMarcacao = (dataAgendamento.getTime() - Date.now()) / 3_600_000;
    if (horasAteMarcacao < servicoInfo.antecedenciaMinimaHoras) {
      return res.status(400).json({
        msg: `É necessário marcar com pelo menos ${servicoInfo.antecedenciaMinimaHoras}h de antecedência`
      });
    }

    const inicioDia = new Date(data); inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(inicioDia); fimDia.setDate(fimDia.getDate() + 1);

    const marcacoesNoTurno = await Agendamento.find({
      oficinaId, turno, estado: { $ne: 'Cancelado' },
      data: { $gte: inicioDia, $lt: fimDia }
    });

    const vagasDisponiveis = turno === 'manha' ? oficina.vagasManha : oficina.vagasTarde;
    if (marcacoesNoTurno.length >= vagasDisponiveis) {
      return res.status(400).json({ msg: 'Não há vagas disponíveis neste turno' });
    }

    const candidatos = servicoInfo.mecanicosAutorizados.length > 0
      ? servicoInfo.mecanicosAutorizados.map(id => String(id))
      : oficina.mecanicos.map(id => String(id));

    // Um turno dura várias horas, por isso um mecânico pode fazer mais do que um serviço nesse turno. Em vez de bloquear a marcação quando um mecânico já tem uma marcação, distribui-se pelo mecânico com menos marcações nesse turno; a vaga da oficina é que é o limite real
    const contagemPorMecanico = {};
    marcacoesNoTurno.forEach(a => {
      const id = String(a.mecanicoId);
      contagemPorMecanico[id] = (contagemPorMecanico[id] || 0) + 1;
    });
    const mecanicoId = candidatos.length > 0
      ? candidatos.reduce((menosOcupado, atual) =>
          (contagemPorMecanico[atual] || 0) < (contagemPorMecanico[menosOcupado] || 0) ? atual : menosOcupado
        )
      : null;

    const novaMarcacao = new Agendamento({
      clienteId: req.user.id,
      veiculoId,
      oficinaId,
      mecanicoId,
      servico,
      data: dataAgendamento,
      turno
    });
    await novaMarcacao.save();
    res.status(201).json(novaMarcacao);
  } catch (err) {
    console.error(err);
    res.status(400).json({ msg: 'Erro ao processar agendamento' });
  }
});

router.get('/oficina/:oficinaId', verifyToken, requireRole('admin', 'mecanico'), async (req, res) => {
  try {
    const { oficinaId } = req.params;
    const lista = await Agendamento.find({ oficinaId })
      .populate('veiculoId')
      .populate('clienteId', 'nome email')
      .populate('mecanicoId', 'nome')
      .sort({ data: 1 });
    res.json(lista);
  } catch (err) {
    res.status(500).json({ msg: 'Erro ao carregar agenda da oficina' });
  }
});

router.get('/cliente/:clienteId', verifyToken, async (req, res) => {
  try {
    const { clienteId } = req.params;
    const lista = await Agendamento.find({ clienteId })
      .populate('oficinaId', 'nome')
      .populate('veiculoId')
      .sort({ data: -1 });
    res.json(lista);
  } catch (err) {
    res.status(500).json({ msg: 'Erro ao carregar histórico' });
  }
});

router.patch('/:id/estado', verifyToken, async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ['Pendente', 'Em curso', 'Concluído', 'Cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ msg: 'Estado inválido' });
    }
    const agendamento = await Agendamento.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );
    res.json(agendamento);
  } catch (err) {
    res.status(400).json({ msg: 'Erro ao atualizar estado' });
  }
});

module.exports = router;
