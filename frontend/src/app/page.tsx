'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [user, setUser] = useState<{ nome: string; role: string } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
      setStatus('ready');
    };

    checkUser();
  }, []);

  if (status === 'loading') {
    return <div className="page-light row" style={{ justifyContent: 'center' }}>A carregar sistema...</div>;
  }

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="page-light stack" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <header className="home-header">
        <h1 className="home-title">Oficina Camões</h1>
        <div className="home-underline"></div>
      </header>

      <div className="grid-2" style={{ width: '100%', maxWidth: '56rem' }}>
        {!user ? (
          <>
            <Link href="/login" className="tile tile-login">
              <h2 className="title-2">Entrar</h2>
              <p className="text-muted" style={{ marginTop: '.5rem' }}>Aceder à minha área</p>
            </Link>
            <Link href="/register" className="tile tile-register">
              <h2 className="title-2">Registar</h2>
              <p style={{ marginTop: '.5rem', color: 'var(--blue-100)' }}>Criar conta nova</p>
            </Link>
          </>
        ) : (
          <>
            <div className="welcome-box">
              <p>Bem-vindo, <span style={{ fontWeight: 700 }}>{user.nome}</span></p>
              <span className="pill-neutral">Sessão como: {user.role}</span>
            </div>

            {user.role === 'cliente' && (
              <>
                <Link href="/veiculos" className="role-tile role-tile-client">
                  <h2 className="title-2">Meus Veículos</h2>
                </Link>
                <Link href="/agendamento" className="role-tile role-tile-purple">
                  <h2 className="title-2">Marcar Serviço</h2>
                </Link>
              </>
            )}

            {user.role === 'mecanico' && (
              <Link href="/staff/agenda" className="role-tile role-tile-green">
                <h2 className="title-2">Ver Trabalhos Pendentes</h2>
              </Link>
            )}

            {user.role === 'admin' && (
              <Link href="/admin/oficina" className="role-tile role-tile-red">
                <h2 className="title-2">Gerir Oficina</h2>
              </Link>
            )}

            <button onClick={handleLogout} className="logout-link">
              Terminar Sessão (Sair)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
