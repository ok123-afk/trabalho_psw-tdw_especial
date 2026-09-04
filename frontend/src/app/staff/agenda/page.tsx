'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';

interface AdminPopulated { _id: string; nome: string; }
interface Oficina { _id: string; nome: string; morada: string; adminId: string | AdminPopulated; }
interface Agendamento {
  _id: string;
  veiculoId: { marca: string; modelo: string; matricula: string };
  clienteId: { nome: string };
  mecanicoId?: { _id: string; nome: string } | string | null;
  servico: string;
  data: string;
  turno: string;
  estado: string;
  oficinaId?: { nome: string; morada: string };
}
interface UserStorage { id?: string; _id?: string; role: string; oficina?: string; nome: string; }

const ESTADOS_AGENDA = ['Pendente', 'Em curso', 'Concluído', 'Cancelado'];

export default function StaffAgendaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserStorage | null>(null);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  const [oficinaExpandida, setOficinaExpandida] = useState<string | null>(null);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [itemExpandido, setItemExpandido] = useState<string | null>(null);
  const [mostrarCancelados, setMostrarCancelados] = useState(false);
  const [filtroEstados, setFiltroEstados] = useState<string[]>(['Pendente', 'Em curso']);
  const [soMinhas, setSoMinhas] = useState(false);

  const toggleFiltroEstado = (estado: string) => {
    setFiltroEstados(prev =>
      prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]
    );
  };

  const carregarDadosIniciais = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) { router.push('/login'); return; }
      const userData: UserStorage = JSON.parse(userStr);
      const userId = userData.id || userData._id || '';
      setUser(userData);

      if (userData.role === 'cliente') {
        const res = await api.get<Agendamento[]>(`/agendamentos/cliente/${userId}`);
        setAgendamentos(res.data);
      } else {
        const resOficinas = await api.get<Oficina[]>('/oficinas');
        const filtradas = resOficinas.data.filter((of: Oficina) => {
          const idDono = typeof of.adminId === 'object' ? of.adminId._id : of.adminId;
          return userData.role === 'admin' ? String(idDono) === String(userId) : of._id === userData.oficina;
        });
        setOficinas(filtradas);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { carregarDadosIniciais(); }, []);

  const toggleOficina = async (oficinaId: string) => {
    if (oficinaExpandida === oficinaId) { setOficinaExpandida(null); return; }
    setOficinaExpandida(oficinaId);
    setLoadingAgenda(true);
    setItemExpandido(null);
    try {
      const res = await api.get<Agendamento[]>(`/agendamentos/oficina/${oficinaId}`);
      setAgendamentos(res.data);
    } catch (err) { alert("Erro ao carregar agenda"); } finally { setLoadingAgenda(false); }
  };

  const mudarEstado = async (id: string, novoEstado: string, contextId?: string) => {
    try {
      await api.patch(`/agendamentos/${id}/estado`, { estado: novoEstado });
      if (user?.role === 'cliente') {
        const res = await api.get<Agendamento[]>(`/agendamentos/cliente/${user.id || user._id}`);
        setAgendamentos(res.data);
      } else if (contextId) {
        const res = await api.get<Agendamento[]>(`/agendamentos/oficina/${contextId}`);
        setAgendamentos(res.data);
      }
    } catch (err) { alert("Erro ao atualizar estado"); }
  };

  const renderCard = (item: Agendamento, contextOficinaId?: string) => {
    const isAberto = itemExpandido === item._id;
    const isCancelado = item.estado === 'Cancelado';
    const dotClass = isCancelado ? 'appt-dot-red' : item.estado === 'Pendente' ? 'appt-dot-yellow' : 'appt-dot-blue';

    return (
      <div key={item._id} className={`appt-card ${isAberto ? 'open' : ''} ${isCancelado ? 'cancelled' : ''}`}>

        <div onClick={() => setItemExpandido(isAberto ? null : item._id)} className="appt-head">
          <div className="row gap-4">
            <div className={`appt-dot ${dotClass}`} />
            <div>
              <p className="xsmall text-accent" style={{ fontWeight: 700 }}>{item.turno} — {new Date(item.data).toLocaleDateString()}</p>
              <h4 className="uppercase" style={{ fontSize: '.9rem', fontWeight: 900, lineHeight: 1.2 }}>{item.veiculoId?.marca} {item.veiculoId?.modelo}</h4>
              <p className="xsmall text-muted font-mono">{item.veiculoId?.matricula}</p>
            </div>
          </div>
          <span className={`badge ${isCancelado ? 'badge-danger' : 'badge-success'}`}>
            {item.estado}
          </span>
        </div>

        {isAberto && (
          <div className="appt-body fade-in">
            <div className="grid-2" style={{ marginTop: '.5rem' }}>
              <div>
                <p className="xsmall text-muted uppercase italic" style={{ fontWeight: 900, marginBottom: '.25rem' }}>Trabalho Solicitado:</p>
                <p className="small" style={{ color: '#e2e8f0', background: 'var(--slate-800)', padding: '.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-700)' }}>{item.servico}</p>
                <p className="xsmall text-muted uppercase italic" style={{ marginTop: '.75rem', fontWeight: 900 }}>
                  {user?.role === 'cliente' ? 'Oficina:' : 'Cliente:'}
                  <span className="uppercase" style={{ color: 'var(--slate-300)', fontWeight: 700, marginLeft: '.25rem' }}>
                    {user?.role === 'cliente' ? item.oficinaId?.nome : item.clienteId?.nome}
                  </span>
                </p>
              </div>

              <div className="stack gap-2" style={{ justifyContent: 'flex-end' }}>
                {user?.role === 'cliente' ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); mudarEstado(item._id, isCancelado ? 'Pendente' : 'Cancelado'); }}
                    className={`btn btn-block ${isCancelado ? 'btn-success-outline' : 'btn-danger-outline'}`}
                  >
                    {isCancelado ? 'Reativar' : 'Cancelar'}
                  </button>
                ) : (
                  !isCancelado && user?.role === 'mecanico' && (
                    <div className="row gap-2">
                      <button onClick={(e) => { e.stopPropagation(); mudarEstado(item._id, 'Em curso', contextOficinaId); }} className="btn btn-blue-outline" style={{ flex: 1 }}>Iniciar</button>
                      <button onClick={(e) => { e.stopPropagation(); mudarEstado(item._id, 'Concluído', contextOficinaId); }} className="btn btn-success-outline" style={{ flex: 1 }}>Concluir</button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="page-dark">
      <div className="container-lg">
        <h1 className="title-1 italic text-accent uppercase font-mono" style={{ borderBottom: '1px solid var(--slate-800)', paddingBottom: '1rem', marginBottom: '2.5rem' }}>Agenda</h1>

        <div className="stack gap-6">
          {user?.role === 'cliente' ? (
            <>
              <div className="stack gap-3">
                {agendamentos.filter(a => a.estado !== 'Cancelado').length > 0 ? (
                  agendamentos.filter(a => a.estado !== 'Cancelado').map(item => renderCard(item))
                ) : (
                  <div className="empty-box">Sem marcações ativas.</div>
                )}
              </div>

              {agendamentos.some(a => a.estado === 'Cancelado') && (
                <div style={{ marginTop: '2.5rem' }}>
                  <button onClick={() => setMostrarCancelados(!mostrarCancelados)} className="link-btn text-muted row gap-2">
                    {mostrarCancelados ? 'Ocultar' : 'Ver'} Cancelados ({agendamentos.filter(a => a.estado === 'Cancelado').length})
                  </button>
                  {mostrarCancelados && (
                    <div className="fade-in" style={{ marginTop: '1rem' }}>{agendamentos.filter(a => a.estado === 'Cancelado').map(item => renderCard(item))}</div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="row-wrap gap-2" style={{ marginBottom: '2rem' }}>
                {ESTADOS_AGENDA.map(estado => (
                  <button
                    key={estado}
                    onClick={() => toggleFiltroEstado(estado)}
                    className={`chip ${filtroEstados.includes(estado) ? 'active' : ''}`}
                  >
                    {estado}
                  </button>
                ))}
                {user?.role === 'mecanico' && (
                  <label className="row gap-2 xsmall text-muted uppercase" style={{ fontWeight: 900, marginLeft: '1rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={soMinhas} onChange={e => setSoMinhas(e.target.checked)} />
                    Só as minhas marcações
                  </label>
                )}
              </div>

              {oficinas.map((oficina) => {
                const isAberta = oficinaExpandida === oficina._id;
                const naOficinaFiltrada = agendamentos.filter(a => {
                  if (!filtroEstados.includes(a.estado)) return false;
                  if (soMinhas) {
                    const idMecanico = typeof a.mecanicoId === 'object' ? a.mecanicoId?._id : a.mecanicoId;
                    if (String(idMecanico) !== String(user?.id || user?._id)) return false;
                  }
                  return true;
                });

                return (
                  <div key={oficina._id} className={`workshop-card ${isAberta ? 'open' : ''}`}>
                    <div onClick={() => toggleOficina(oficina._id)} className="workshop-head">
                      <div>
                        <h2 className="title-2 uppercase">{oficina.nome}</h2>
                        <p className="small text-muted italic font-mono">{oficina.morada}</p>
                      </div>
                      <div className={`workshop-plus ${isAberta ? 'open' : ''}`}>
                        <span>+</span>
                      </div>
                    </div>

                    {isAberta && (
                      <div className="workshop-body stack gap-4 fade-in">
                        {loadingAgenda ? (
                          <div className="text-center pulse xsmall uppercase text-muted font-mono" style={{ padding: '2.5rem 0' }}>Acedendo...</div>
                        ) : naOficinaFiltrada.length > 0 ? (
                          naOficinaFiltrada.map((item) => renderCard(item, oficina._id))
                        ) : (
                          <div className="empty-box">Sem agendamentos para este filtro.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
