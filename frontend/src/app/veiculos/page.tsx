'use client';

import { useEffect, useState, FormEvent } from 'react';
import api from '../../lib/api';

interface Veiculo {
  _id?: string;
  marca: string;
  modelo: string;
  matricula: string;
  ano: number;
}

interface UserSession {
  id: string;
  _id?: string;
  nome: string;
  role: string;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      msg?: string;
    };
    status?: number;
  };
  message: string;
}

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState<boolean>(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [marca, setMarca] = useState<string>('');
  const [modelo, setModelo] = useState<string>('');
  const [matricula, setMatricula] = useState<string>('');
  const [ano, setAno] = useState<number>(2025);

  useEffect(() => {
    const carregarDados = () => {
      const userString = localStorage.getItem('user');
      if (userString) {
        try {
          const user: UserSession = JSON.parse(userString);
          const id = user.id || user._id || null;
          setUserId(id);
          if (id) fetchVeiculos(id);
        } catch (e) {
          setErro("Erro ao processar sessão.");
        }
      } else {
        setErro("Utilizador não autenticado.");
        setLoading(false);
      }
    };
    carregarDados();
  }, []);

  const fetchVeiculos = async (id: string): Promise<void> => {
    try {
      const res = await api.get<Veiculo[]>(`/veiculos/cliente/${id}`);
      setVeiculos(res.data);
      setErro('');
    } catch (err) {
      const error = err as ApiErrorResponse;
      setErro(error.response?.data?.msg || "Erro ao carregar veículos.");
    } finally {
      setLoading(false);
    }
  };

  const limparForm = () => {
    setMarca(''); setModelo(''); setMatricula(''); setAno(2025);
    setEditandoId(null);
    setMostrarForm(false);
  };

  const handleNovoVeiculo = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!userId) return;

    try {
      const payload = { marca, modelo, matricula, ano: Number(ano), clienteId: userId };
      if (editandoId) {
        await api.put(`/veiculos/${editandoId}`, payload);
      } else {
        await api.post('/veiculos', payload);
      }
      limparForm();
      fetchVeiculos(userId);
    } catch (err) {
      const error = err as ApiErrorResponse;
      setErro(error.response?.data?.msg || "Erro ao guardar veículo.");
    }
  };

  const handleEditar = (v: Veiculo) => {
    setEditandoId(v._id || null);
    setMarca(v.marca);
    setModelo(v.modelo);
    setMatricula(v.matricula);
    setAno(v.ano);
    setMostrarForm(true);
  };

  const handleApagar = async (id: string): Promise<void> => {
    if (!userId) return;
    if (!confirm('Remover este veículo?')) return;
    try {
      await api.delete(`/veiculos/${id}`);
      fetchVeiculos(userId);
    } catch (err) {
      const error = err as ApiErrorResponse;
      setErro(error.response?.data?.msg || "Erro ao remover veículo.");
    }
  };

  if (loading) return <p className="page-dark">A carregar garagem...</p>;

  return (
    <main className="page-dark">
      <div className="row-between" style={{ marginBottom: '1.5rem' }}>
        <h1 className="title-1 italic">Meus Veículos</h1>
        <button
          onClick={() => mostrarForm ? limparForm() : setMostrarForm(true)}
          className="btn btn-primary"
        >
          {mostrarForm ? 'Cancelar' : '+ Registar Carro'}
        </button>
      </div>

      {erro && <div className="alert-error">{erro}</div>}

      {mostrarForm && (
        <form onSubmit={handleNovoVeiculo} className="card stack gap-4" style={{ marginBottom: '1.5rem' }}>
          <div className="grid-2">
            <input type="text" placeholder="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} className="input-dark" required />
            <input type="text" placeholder="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} className="input-dark" required />
            <input type="text" placeholder="Matrícula" value={matricula} onChange={(e) => setMatricula(e.target.value.toUpperCase())} className="input-dark" required />
            <input type="number" placeholder="Ano" value={ano} onChange={(e) => setAno(Number(e.target.value))} className="input-dark" required />
          </div>
          <button type="submit" className="btn btn-success btn-block">
            {editandoId ? 'Guardar Alterações' : 'Guardar na Base de Dados'}
          </button>
        </form>
      )}

      <div className="stack gap-4">
        {veiculos.length === 0 ? (
          <p className="text-muted italic text-center" style={{ padding: '2.5rem 0' }}>Nenhum veículo registado.</p>
        ) : (
          veiculos.map((v) => (
            <div key={v._id || v.matricula} className="vehicle-card">
              <div className="row-between">
                <div>
                  <h2 className="title-2 uppercase">{v.marca} <span className="text-accent" style={{ fontWeight: 400 }}>{v.modelo}</span></h2>
                  <p className="plate-tag">MATRÍCULA: {v.matricula}</p>
                </div>
                <div className="row gap-4">
                  <div className="text-right">
                    <p className="xsmall uppercase text-muted" style={{ fontWeight: 700 }}>Ano de Fabrico</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{v.ano}</p>
                  </div>
                  <div className="stack gap-2">
                    <button onClick={() => handleEditar(v)} className="link-btn link-accent">Editar</button>
                    <button onClick={() => v._id && handleApagar(v._id)} className="link-btn link-danger">Apagar</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-center xsmall text-muted uppercase" style={{ marginTop: '3rem', letterSpacing: '.1em' }}>
        Sessão Ativa: {userId}
      </div>
    </main>
  );
}
