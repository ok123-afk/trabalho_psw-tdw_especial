'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      alert(`Bem-vindo, ${res.data.user.nome}!`);
      router.push('/');
    } catch (err) {
      alert('Email ou password incorretos. Tenta novamente.');
    }
  };

  return (
    <div className="auth-shell">
      <form onSubmit={handleLogin} className="auth-box">
        <h2 className="auth-title">Login Oficina</h2>

        <input
          type="email"
          placeholder="Email"
          className="input-light"
          style={{ marginBottom: '1rem' }}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="input-light"
          style={{ marginBottom: '1.5rem' }}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="btn btn-primary btn-block">
          Entrar no Sistema
        </button>

        <p className="auth-footer">
          Ainda não tem conta? <a href="/register">Registe-se aqui</a>
        </p>
      </form>
    </div>
  );
}
