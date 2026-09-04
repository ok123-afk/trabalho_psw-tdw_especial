'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  nome: string;
  role: 'admin' | 'mecanico' | 'cliente';
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = () => {
      const userStr = localStorage.getItem('user');

      if (userStr) {
        try {
          const parsedUser = JSON.parse(userStr);

          if (pathname === '/login') {
            router.replace('/');
            return;
          }

          if (JSON.stringify(parsedUser) !== JSON.stringify(user)) {
            setUser(parsedUser);
          }
        } catch (e) {
          setUser(null);
        }
      } else {
        if (user !== null) setUser(null);
      }
    };

    checkUser();
  }, [pathname, router, user]);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="navbar">
      <div className="row gap-6">
        <Link href="/" className="navbar-brand">
          Oficina Camões
        </Link>

        {user && (
          <div className="navbar-links fade-in">
            <Link href="/veiculos" className="navbar-link">Veículos</Link>
            <Link href="/agendamento" className="navbar-link">Agendar</Link>

            <Link href="/staff/agenda" className="navbar-link-agenda">
              {user.role === 'cliente' ? 'Minhas Marcações' : 'Staff Agenda'}
            </Link>

            {user.role === 'admin' && (
              <>
                <Link href="/admin/dashboard" className="navbar-pill navbar-pill-purple">
                  Dashboard
                </Link>
                <Link href="/admin/oficina" className="navbar-pill">
                  Admin
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      <div className="row gap-4">
        {user ? (
          <div className="navbar-user">
            <div className="text-right">
              <p className="navbar-user-name">{user.nome}</p>
              <p className="navbar-user-role">{user.role.toUpperCase()}</p>
            </div>
            <button onClick={handleLogout} className="btn btn-danger-outline btn-sm">
              Sair
            </button>
          </div>
        ) : (
          pathname !== '/login' && (
            <Link href="/login" className="navbar-pill">
              Entrar
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
