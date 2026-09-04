// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Garante que a ligação à BD está pronta antes de cada pedido
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Erro de ligação à base de dados' });
  }
});

// Rotas de teste
const router = express.Router();

router.get('/api/test', (req, res) => res.json({ ok: true, message: 'Backend MongoDB OK!' }));

router.use('/api/veiculos', require('./routes/veiculos'));
router.use('/api/agendamentos', require('./routes/agendamentos'));
router.use('/api/auth', require('./routes/auth'));
router.use('/api/oficinas', require('./routes/oficinas'));

app.use('/api/backend', router);

// Só faz listen se corrido diretamente (dev local com "npm run dev")
// No Vercel, este ficheiro é importado pela função serverless em api/index.js
if (require.main === module) {
  connectDB();
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Servidor http://localhost:${PORT}`));
}

module.exports = app;