const jwt = require('jsonwebtoken');

// Valida o JWT enviado no header Authorization e anexa os dados do
// utilizador (id, role) a req.user para as rotas seguintes usarem
function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Token em falta' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token inválido ou expirado' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Sem permissão para esta ação' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
