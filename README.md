# Oficina Camões — Plataforma de Gestão e Marcação de Serviços

## Estrutura

- `backend/` — API em Express + MongoDB (Mongoose)
- `frontend/` — Aplicação em Next.js/React

## Configuração local

### Backend

```
cd backend
npm install
```

Confirmar `backend/.env`:

```
MONGO_URI=<a tua ligação MongoDB Atlas>
PORT=4000
JWT_SECRET=<uma string aleatória longa>
```

Criar a conta de demonstração do Administrador de Oficina (só é preciso correr uma vez):

```
node src/seed.js
```

Isto cria:

- email: `admin.demo@oficina.pt`
- password: `Demo2026!`

Arrancar o servidor:

```
npm run dev
```

API disponível em `http://localhost:4000/api`.

### Frontend

```
cd frontend
npm install
npm run dev
```

Aplicação disponível em `http://localhost:3000`.

## Fluxo de utilização

1. Entrar com a conta de demonstração do Admin (`admin.demo@oficina.pt` / `Demo2026!`)
2. Em "Admin" (`/admin/oficina`), criar uma oficina e adicionar serviços
3. Registar uma conta de Cliente em `/register` (cria sempre role `cliente`)
4. Como Cliente, registar um veículo e marcar um serviço
5. Contas de Mecânico só podem ser criadas por um Admin autenticado
   (rota `POST /api/auth/staff`), não pelo registo público
6. Em "Dashboard" (`/admin/dashboard`), consultar indicadores, gráficos e
   filtros sobre a atividade da oficina
