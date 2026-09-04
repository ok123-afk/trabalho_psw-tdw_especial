'use client';
import { useState } from 'react';
import api from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: ''
  });

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      alert('Utilizador registado com sucesso!');
      router.push('/login');
    } catch (err) {
      console.error(err);
      alert('Erro ao registar. Verifica se o servidor está ligado.');
    }
  };

  return (
    <div className="page-light stack" style={{ alignItems: 'center' }}>
      <h1 className="title-2" style={{ marginBottom: '1rem' }}>Criar Nova Conta</h1>
      <form onSubmit={handleSubmit} className="stack gap-4 card-light" style={{ width: '100%', maxWidth: '28rem', padding: '1.5rem' }}>
        <input
          type="text"
          placeholder="Nome completo"
          className="input-light"
          required
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          className="input-light"
          required
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          className="input-light"
          required
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />

        <p className="small text-muted">
          Este registo cria sempre uma conta de Cliente. Contas de Mecânico ou Administrador são criadas pelo Administrador da oficina.
        </p>

        <button type="submit" className="btn btn-primary">
          Registar
        </button>
      </form>
    </div>
  );
}
