'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';

interface Servico {
  _id: string;
  nome: string;
  preco: number;
  duracao: number;
  descricaoPublica?: string;
  descricaoPrivada?: string;
  antecedenciaMinimaHoras?: number;
  mecanicosAutorizados?: string[];
}

interface AdminPopulated {
  _id: string;
  nome: string;
  email?: string;
}

interface Oficina {
  _id: string;
  nome: string;
  morada: string;
  telefone: string;
  vagasManha: number;
  vagasTarde: number;
  adminId: string | AdminPopulated;
  servicos: Servico[];
}

interface User {
  _id: string;
  nome: string;
  role: string;
  oficina?: string;
}

export default function AdminOficinaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [oficinaSelecionada, setOficinaSelecionada] = useState<Oficina | null>(null);
  const [mecanicos, setMecanicos] = useState<User[]>([]);

  const [nome, setNome] = useState('');
  const [morada, setMorada] = useState('');
  const [telefone, setTelefone] = useState('');
  const [vagasManha, setVagasManha] = useState(5);
  const [vagasTarde, setVagasTarde] = useState(5);
  const [showForm, setShowForm] = useState(false);

  const [servicoEditandoId, setServicoEditandoId] = useState<string | null>(null);
  const [servicoNome, setServicoNome] = useState('');
  const [servicoPreco, setServicoPreco] = useState(0);
  const [servicoDuracao, setServicoDuracao] = useState(60);
  const [servicoDescPublica, setServicoDescPublica] = useState('');
  const [servicoDescPrivada, setServicoDescPrivada] = useState('');
  const [servicoAntecedencia, setServicoAntecedencia] = useState(2);
  const [servicoMecanicos, setServicoMecanicos] = useState<string[]>([]);

  const carregarDados = async () => {
    try {
      const [resOficinas, resMecanicos] = await Promise.all([
        api.get<Oficina[]>('/oficinas'),
        api.get<User[]>('/auth/mecanicos')
      ]);
      setOficinas(resOficinas.data);
      setMecanicos(resMecanicos.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) { router.push('/login'); return; }
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') { router.push('/veiculos'); return; }

      setCurrentUserId(user.id || user._id || '');
      await carregarDados();
      setLoading(false);
    };
    init();
  }, [router]);

  const limparFormServico = () => {
    setServicoEditandoId(null);
    setServicoNome('');
    setServicoPreco(0);
    setServicoDuracao(60);
    setServicoDescPublica('');
    setServicoDescPrivada('');
    setServicoAntecedencia(2);
    setServicoMecanicos([]);
  };

  const handleEditarServico = (s: Servico) => {
    setServicoEditandoId(s._id);
    setServicoNome(s.nome);
    setServicoPreco(s.preco);
    setServicoDuracao(s.duracao);
    setServicoDescPublica(s.descricaoPublica || '');
    setServicoDescPrivada(s.descricaoPrivada || '');
    setServicoAntecedencia(s.antecedenciaMinimaHoras ?? 2);
    setServicoMecanicos(s.mecanicosAutorizados || []);
  };

  const toggleMecanicoServico = (id: string) => {
    setServicoMecanicos(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  // Cria ou atualiza (conforme servicoEditandoId) o serviço na oficina selecionada
  const handleSalvarServico = async () => {
    if (!oficinaSelecionada) return;
    const payload = {
      nome: servicoNome,
      preco: servicoPreco,
      duracao: Number(servicoDuracao),
      descricaoPublica: servicoDescPublica,
      descricaoPrivada: servicoDescPrivada,
      antecedenciaMinimaHoras: Number(servicoAntecedencia),
      mecanicosAutorizados: servicoMecanicos
    };
    try {
      if (servicoEditandoId) {
        await api.put(`/oficinas/${oficinaSelecionada._id}/servicos/${servicoEditandoId}`, payload);
      } else {
        await api.post(`/oficinas/${oficinaSelecionada._id}/servicos`, payload);
      }
      limparFormServico();
      carregarDados();
    } catch (err) {
      alert("Erro ao guardar serviço");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nome, morada, telefone,
        adminId: currentUserId,
        vagasManha: Number(vagasManha),
        vagasTarde: Number(vagasTarde)
      };

      if (oficinaSelecionada) {
        await api.put(`/oficinas/${oficinaSelecionada._id}`, payload);
      } else {
        await api.post('/oficinas', payload);
      }

      alert("Operação realizada com sucesso!");
      setShowForm(false);
      carregarDados();
    } catch (err) {
      alert("Erro ao gravar dados.");
    }
  };

  if (loading) return <div className="page-dark pulse font-mono text-center uppercase" style={{ letterSpacing: '.1em' }}>Sincronizando Sistema...</div>;

  return (
    <main className="page-dark">
      <div className="container-lg">
        <div className="row-between" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--slate-700)', paddingBottom: '1rem' }}>
          <h1 className="title-1 italic text-accent uppercase font-mono">Gestão de Oficina</h1>
          <button
            onClick={() => { setOficinaSelecionada(null); setShowForm(!showForm); }}
            className="btn btn-primary"
          >
            {showForm ? 'Fechar' : '+ Nova Oficina'}
          </button>
        </div>

        {showForm && (
          <div className="stack gap-6 fade-in">
            <form onSubmit={handleSubmit} className="card card-lg stack gap-4" style={{ borderColor: 'rgba(59,130,246,.2)' }}>
              <h2 className="small uppercase text-accent" style={{ fontWeight: 700, letterSpacing: '.1em', marginBottom: '.5rem' }}>Dados Principais</h2>
              <div className="grid-2">
                <input type="text" placeholder="Nome da Oficina" value={nome} onChange={e => setNome(e.target.value)} className="input-dark" required />
                <input type="text" placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} className="input-dark" />
              </div>
              <input type="text" placeholder="Morada Completa" value={morada} onChange={e => setMorada(e.target.value)} className="input-dark" required />

              <div className="grid-2">
                <div className="card-soft">
                  <label className="field-label" style={{ marginBottom: '.25rem' }}>Vagas Manhã</label>
                  <input type="number" value={vagasManha} onChange={e => setVagasManha(Number(e.target.value))} className="text-accent" style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 700, fontSize: '1.25rem', width: '100%' }} />
                </div>
                <div className="card-soft">
                  <label className="field-label" style={{ marginBottom: '.25rem' }}>Vagas Tarde</label>
                  <input type="number" value={vagasTarde} onChange={e => setVagasTarde(Number(e.target.value))} className="text-accent" style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 700, fontSize: '1.25rem', width: '100%' }} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', letterSpacing: '.1em' }}>
                {oficinaSelecionada ? 'Atualizar Configurações' : 'Criar Oficina'}
              </button>
            </form>

            {oficinaSelecionada && (
              <div className="grid-2" style={{ gap: '2rem' }}>
                <div className="card">
                  <h3 className="small uppercase italic text-accent" style={{ fontWeight: 900, letterSpacing: '.1em', marginBottom: '1rem' }}>Catálogo de Serviços</h3>

                  <div className="stack gap-2" style={{ marginBottom: '1rem' }}>
                    <div className="row-wrap gap-2">
                      <input type="text" placeholder="Serviço" value={servicoNome} onChange={e => setServicoNome(e.target.value)} className="input-dark small-pad" style={{ flex: 1, minWidth: '150px' }} />
                      <input type="number" placeholder="Preço" value={servicoPreco} onChange={e => setServicoPreco(Number(e.target.value))} className="input-dark small-pad text-success" style={{ width: '6rem', fontWeight: 700 }} /><span className="text-muted text-sm font-semibold">€</span>
                      <input type="number" placeholder="Min" value={servicoDuracao} onChange={e => setServicoDuracao(Number(e.target.value))} className="input-dark small-pad text-accent" style={{ width: '6rem' }} /><span className="text-muted text-sm font-semibold">mins</span>
                      <input type="number" placeholder="Antec. (h)" value={servicoAntecedencia} onChange={e => setServicoAntecedencia(Number(e.target.value))} className="input-dark small-pad text-warning" style={{ width: '6rem' }} /><span className="text-muted text-sm font-semibold">horas de antecedência</span>
                    </div>
                    <textarea placeholder="Descrição pública (visível ao cliente)" value={servicoDescPublica} onChange={e => setServicoDescPublica(e.target.value)} className="textarea-dark small-pad" rows={2} />
                    <textarea placeholder="Descrição privada (visível apenas ao staff)" value={servicoDescPrivada} onChange={e => setServicoDescPrivada(e.target.value)} className="textarea-dark small-pad" rows={2} />

                    <div>
                      <p className="xsmall text-muted uppercase" style={{ fontWeight: 900, marginBottom: '.25rem' }}>Mecânicos autorizados</p>
                      <div className="row-wrap gap-2">
                        {mecanicos.filter(m => m.oficina === oficinaSelecionada._id).map(m => (
                          <label key={m._id} className={`mecanico-chip ${servicoMecanicos.includes(m._id) ? 'selected' : ''}`}>
                            <input type="checkbox" checked={servicoMecanicos.includes(m._id)} onChange={() => toggleMecanicoServico(m._id)} />
                            {m.nome}
                          </label>
                        ))}
                        {mecanicos.filter(m => m.oficina === oficinaSelecionada._id).length === 0 && (
                          <span className="xsmall text-muted italic">Sem mecânicos associados a esta oficina.</span>
                        )}
                      </div>
                    </div>

                    <div className="row gap-2">
                      <button onClick={handleSalvarServico} className="btn btn-success" style={{ flex: 1 }}>
                        {servicoEditandoId ? 'Guardar Alterações' : 'Adicionar Serviço'}
                      </button>
                      {servicoEditandoId && (
                        <button onClick={limparFormServico} className="btn btn-ghost">Cancelar</button>
                      )}
                    </div>
                  </div>

                  <div className="stack gap-2" style={{ maxHeight: '15rem', overflowY: 'auto', paddingRight: '.5rem' }}>
                    {oficinas.find(o => o._id === oficinaSelecionada._id)?.servicos?.map((s) => (
                      <div key={s._id} className="card-soft row-between">
                        <div className="stack">
                          <span className="small" style={{ fontWeight: 500 }}>{s.nome}</span>
                          <span className="xsmall text-muted font-mono italic">{s.duracao} min · antec. mín. {s.antecedenciaMinimaHoras ?? 2}h</span>
                        </div>
                        <div className="row gap-4">
                          <span className="small text-success font-mono" style={{ fontWeight: 900 }}>{s.preco}€</span>
                          <button onClick={() => handleEditarServico(s)} className="link-btn link-accent">Editar</button>
                          <button onClick={async () => {
                            await api.delete(`/oficinas/${oficinaSelecionada._id}/servicos/${s._id}`);
                            carregarDados();
                          }} className="link-btn link-danger">Apagar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 className="small uppercase italic text-accent" style={{ fontWeight: 900, letterSpacing: '.1em', marginBottom: '1rem' }}>Equipa de Mecânicos</h3>

                  <select
                    onChange={async (e) => {
                      const selectedId = e.target.value;
                      if (!selectedId || !oficinaSelecionada) return;

                      try {
                        await api.put<{ msg: string }>('/oficinas/associar-mecanico', {
                          mecanicoId: selectedId,
                          oficinaId: oficinaSelecionada._id
                        });
                        await carregarDados();
                      } catch (err) {
                        alert("Erro na associação.");
                      }
                    }}
                    value=""
                    className="select-dark small-pad"
                    style={{ marginBottom: '1.5rem' }}
                  >
                    <option value="">Vincular Novo Mecânico...</option>
                    {mecanicos
                      .filter(m => !m.oficina)
                      .map(m => (
                        <option key={m._id} value={m._id}>{m.nome}</option>
                      ))
                    }
                  </select>

                  <div className="stack gap-2">
                    <p className="xsmall text-muted uppercase" style={{ fontWeight: 900, marginBottom: '.5rem' }}>Staff Atual:</p>
                    {mecanicos
                      .filter(m => m.oficina === oficinaSelecionada._id)
                      .map(m => (
                        <div key={m._id} className="card-soft row-between">
                          <span className="small" style={{ fontWeight: 700 }}>{m.nome}</span>
                          <button
                            onClick={async () => {
                              try {
                                await api.put('/oficinas/associar-mecanico', {
                                  mecanicoId: m._id,
                                  oficinaId: null
                                });
                                await carregarDados();
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="link-btn link-danger"
                          >
                            Desvincular
                          </button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!showForm && (
          <div className="table-wrap" style={{ marginTop: '2rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Oficina</th>
                  <th>Localização</th>
                  <th className="text-center">Vagas (M/T)</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {oficinas.map((oficina) => {
                  const donoId = typeof oficina.adminId === 'object' ? oficina.adminId._id : oficina.adminId;
                  const eDono = String(donoId) === String(currentUserId);
                  return (
                    <tr key={oficina._id}>
                      <td className="text-accent uppercase" style={{ fontWeight: 900 }}>{oficina.nome}</td>
                      <td className="text-muted small italic">{oficina.morada}</td>
                      <td className="text-center">
                        <span className="badge badge-blue">
                          {oficina.vagasManha} / {oficina.vagasTarde}
                        </span>
                      </td>
                      <td className="text-right">
                        {eDono ? (
                          <button
                            onClick={() => {
                              setOficinaSelecionada(oficina);
                              setNome(oficina.nome);
                              setMorada(oficina.morada);
                              setTelefone(oficina.telefone);
                              setVagasManha(oficina.vagasManha);
                              setVagasTarde(oficina.vagasTarde);
                              setShowForm(true);
                            }}
                            className="btn btn-blue-outline btn-sm"
                          >
                            Configurar
                          </button>
                        ) : (
                          <span className="xsmall text-muted uppercase" style={{ fontWeight: 900 }}>Restrito</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
