const express = require('express');
const router = express.Router();
const Oficina = require('../models/Oficina');
const User = require('../models/User');
const Agendamento = require('../models/Agendamento');
const { verifyToken, requireRole } = require('../middleware/auth');

// --- GET ---
router.get('/', async (req, res) => {
  try {
    const oficinas = await Oficina.find().populate('adminId', 'nome email');
    res.json(oficinas);
  } catch (err) {
    res.status(500).json({ msg: 'Erro ao carregar oficinas' });
  }
});

// --- POST ---
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nome, morada, telefone, adminId, vagasManha, vagasTarde } = req.body;
    const novaOficina = new Oficina({
      nome: nome.trim(),
      morada: morada.trim(),
      telefone: telefone?.trim() || '',
      adminId,
      vagasManha: Number(vagasManha) || 0,
      vagasTarde: Number(vagasTarde) || 0
    });
    await novaOficina.save();
    const resultado = await Oficina.findById(novaOficina._id).populate('adminId', 'nome email');
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ msg: 'Erro ao criar' });
  }
});

// --- 1. ROTA DE ASSOCIAÇÃO (Mover para antes de /:id) ---
router.put('/associar-mecanico', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { mecanicoId, oficinaId } = req.body;

    // Atualiza o Mecânico no modelo User
    await User.findByIdAndUpdate(
      mecanicoId, 
      { oficina: oficinaId || null }, 
      { new: true }
    );

    // Sincroniza o array de mecânicos na Oficina
    if (oficinaId) {
      await Oficina.findByIdAndUpdate(
        oficinaId,
        { $addToSet: { mecanicos: mecanicoId } }
      );
    } else {
      await Oficina.updateMany(
        { mecanicos: mecanicoId },
        { $pull: { mecanicos: mecanicoId } }
      );
    }

    res.json({ msg: "Vínculo guardado com sucesso!" });
  } catch (err) {
    console.error("Erro associação:", err);
    res.status(400).json({ msg: 'Erro na associação. Verifica os IDs.' });
  }
});

// ROTA GENÉRICA 
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const dados = { ...req.body };
    const oficina = await Oficina.findByIdAndUpdate(
      req.params.id, 
      { $set: dados }, 
      { new: true }
    ).populate('adminId', 'nome email');
    
    res.json(oficina);
  } catch (err) {
    res.status(400).json({ msg: 'Erro ao atualizar' });
  }
});

//SERVIÇOS
router.post('/:id/servicos', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nome, preco, duracao, descricaoPublica, descricaoPrivada, antecedenciaMinimaHoras, mecanicosAutorizados } = req.body;
    const oficina = await Oficina.findByIdAndUpdate(
      req.params.id,
      { $push: { servicos: {
        nome,
        preco,
        duracao: Number(duracao) || 60,
        descricaoPublica: descricaoPublica || '',
        descricaoPrivada: descricaoPrivada || '',
        antecedenciaMinimaHoras: Number(antecedenciaMinimaHoras) || 2,
        mecanicosAutorizados: mecanicosAutorizados || []
      } } },
      { new: true }
    );
    res.json(oficina.servicos);
  } catch (err) {
    res.status(400).json({ msg: 'Erro ao adicionar serviço' });
  }
});

router.put('/:oficinaId/servicos/:servicoId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nome, preco, duracao, descricaoPublica, descricaoPrivada, antecedenciaMinimaHoras, mecanicosAutorizados } = req.body;
    const oficina = await Oficina.findOneAndUpdate(
      { _id: req.params.oficinaId, 'servicos._id': req.params.servicoId },
      { $set: {
        'servicos.$.nome': nome,
        'servicos.$.preco': preco,
        'servicos.$.duracao': Number(duracao) || 60,
        'servicos.$.descricaoPublica': descricaoPublica || '',
        'servicos.$.descricaoPrivada': descricaoPrivada || '',
        'servicos.$.antecedenciaMinimaHoras': Number(antecedenciaMinimaHoras) || 2,
        'servicos.$.mecanicosAutorizados': mecanicosAutorizados || []
      } },
      { new: true }
    );
    if (!oficina) return res.status(404).json({ msg: 'Serviço não encontrado' });
    res.json(oficina.servicos);
  } catch (err) {
    res.status(400).json({ msg: 'Erro ao editar serviço' });
  }
});

router.delete('/:oficinaId/servicos/:servicoId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const oficina = await Oficina.findByIdAndUpdate(
      req.params.oficinaId,
      { $pull: { servicos: { _id: req.params.servicoId } } },
      { new: true }
    );
    res.json(oficina.servicos);
  } catch (err) {
    res.status(400).json({ msg: 'Erro ao remover' });
  }
});

// Calcula indicadores agregados da oficina, com suporte a filtros de data, estado e pesquisa livre, para alimentar o dashboard do Admin.
router.get('/:id/indicadores', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const oficina = await Oficina.findById(req.params.id);
    if (!oficina) return res.status(404).json({ msg: 'Oficina não encontrada' });
    if (String(oficina.adminId) !== String(req.user.id)) {
      return res.status(403).json({ msg: 'Sem permissão sobre esta oficina' });
    }

    const { dataInicio, dataFim, estado, pesquisa } = req.query;
    const filtro = { oficinaId: oficina._id };
    if (estado) filtro.estado = estado;
    if (dataInicio || dataFim) {
      filtro.data = {};
      if (dataInicio) filtro.data.$gte = new Date(dataInicio);
      if (dataFim) filtro.data.$lte = new Date(dataFim);
    }

    let agendamentos = await Agendamento.find(filtro)
      .populate('clienteId', 'nome email')
      .populate('veiculoId', 'marca modelo matricula')
      .sort({ data: -1 });

    if (pesquisa) {
      const termo = pesquisa.toLowerCase();
      agendamentos = agendamentos.filter(a =>
        a.clienteId?.nome?.toLowerCase().includes(termo) ||
        a.veiculoId?.matricula?.toLowerCase().includes(termo) ||
        a.servico?.toLowerCase().includes(termo)
      );
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const marcacoesHoje = agendamentos.filter(a => {
      const d = new Date(a.data);
      return d >= hoje && d < amanha;
    }).length;

    const porEstado = {};
    agendamentos.forEach(a => {
      porEstado[a.estado] = (porEstado[a.estado] || 0) + 1;
    });

    const clientesUnicos = new Set(agendamentos.map(a => String(a.clienteId?._id || a.clienteId)));
    const veiculosUnicos = new Set(agendamentos.map(a => String(a.veiculoId?._id || a.veiculoId)));

    const contagemServicos = {};
    agendamentos.forEach(a => {
      contagemServicos[a.servico] = (contagemServicos[a.servico] || 0) + 1;
    });
    const servicosMaisUsados = Object.entries(contagemServicos)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const porDia = {};
    agendamentos.forEach(a => {
      const chave = new Date(a.data).toISOString().split('T')[0];
      porDia[chave] = (porDia[chave] || 0) + 1;
    });
    const evolucaoTemporal = Object.entries(porDia)
      .map(([data, total]) => ({ data, total }))
      .sort((a, b) => a.data.localeCompare(b.data));

    res.json({
      totalMarcacoes: agendamentos.length,
      marcacoesHoje,
      porEstado,
      clientesRegistados: clientesUnicos.size,
      veiculosRegistados: veiculosUnicos.size,
      servicosMaisUsados,
      evolucaoTemporal,
      agendamentos
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao calcular indicadores' });
  }
});

// Devolve as vagas livres da oficina num dia/turno, para o cliente ver antes de tentar marcar (usa a mesma janela de datas da criação do agendamento).
router.get('/:id/vagas', verifyToken, async (req, res) => {
  try {
    const { data, turno } = req.query;
    if (!data || !turno) return res.status(400).json({ msg: 'data e turno são obrigatórios' });

    const oficina = await Oficina.findById(req.params.id);
    if (!oficina) return res.status(404).json({ msg: 'Oficina não encontrada' });

    const inicioDia = new Date(data); inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(inicioDia); fimDia.setDate(fimDia.getDate() + 1);

    const ocupadas = await Agendamento.countDocuments({
      oficinaId: oficina._id, turno, estado: { $ne: 'Cancelado' },
      data: { $gte: inicioDia, $lt: fimDia }
    });

    const total = turno === 'manha' ? oficina.vagasManha : oficina.vagasTarde;
    res.json({ vagasTotal: total, vagasOcupadas: ocupadas, vagasLivres: Math.max(total - ocupadas, 0) });
  } catch (err) {
    res.status(500).json({ msg: 'Erro ao calcular vagas' });
  }
});

module.exports = router;