const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Oficina = require('../models/Oficina');
const { verifyToken, requireRole } = require('../middleware/auth');

// Registo público: força sempre role 'cliente', independentemente do que for enviado no corpo do pedido, para que ninguém se registe como admin.
router.post('/register', async (req, res) => {
  try {
    const { nome, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'Utilizador já existe' });

    user = new User({ nome, email, password, role: 'cliente' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    res.json({ msg: 'Utilizador registado com sucesso' });
  } catch (err) {
    res.status(500).send('Erro no servidor');
  }
});

// Criação de contas de staff (admin/mecânico), só acessível a um admin
// já autenticado — substitui o registo livre de admins.
router.post('/staff', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nome, email, password, role } = req.body;
    if (!['admin', 'mecanico'].includes(role)) {
      return res.status(400).json({ msg: 'Role inválida' });
    }
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'Utilizador já existe' });

    user = new User({ nome, email, password, role });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.json({ msg: 'Conta de staff criada com sucesso' });
  } catch (err) {
    res.status(500).send('Erro no servidor');
  }
});

// LOGIN - Agora com busca automática de oficina
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Credenciais inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Credenciais inválidas' });

    // --- LÓGICA DE BUSCA: Ir à coleção Oficina procurar o utilizador ---
    let oficinaId = user.oficina; // Tenta o que está no User (geralmente null)

    // Se estiver vazio, vamos procurar na coleção Oficina quem tem este user na lista
    if (!oficinaId && (user.role === 'mecanico' || user.role === 'admin')) {
      const oficinaEncontrada = await Oficina.findOne({ mecanicos: user._id });
      if (oficinaEncontrada) {
        oficinaId = oficinaEncontrada._id;
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Agora o JSON de resposta leva a oficina que encontrámos na outra tabela!
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        nome: user.nome, 
        role: user.role,
        oficina: oficinaId 
      } 
    });
  } catch (err) {
    res.status(500).send('Erro no servidor');
  }
});

router.get('/mecanicos', async (req, res) => {
  try {
    const mecanicos = await User.find({ role: 'mecanico' });
    res.json(mecanicos);
  } catch (err) {
    res.status(500).send('Erro no servidor');
  }
});

module.exports = router;