// Corre uma única vez com: node src/seed.js
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const EMAIL_DEMO = 'admin.demo@oficina.pt';
const PASSWORD_DEMO = 'Demo2026!';

async function seed() {
  await connectDB();

  const existente = await User.findOne({ email: EMAIL_DEMO });
  if (existente) {
    console.log('Conta de demonstração já existe:', EMAIL_DEMO);
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(PASSWORD_DEMO, salt);

  await User.create({
    nome: 'Admin Demo',
    email: EMAIL_DEMO,
    password,
    role: 'admin'
  });

  console.log('Conta de demonstração criada:');
  console.log('  email:', EMAIL_DEMO);
  console.log('  password:', PASSWORD_DEMO);
  process.exit(0);
}

seed();
