'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';

interface Oficina {
  _id: string;
  nome: string;
  adminId: string | { _id: string };
}

interface AgendamentoDetalhe {
  _id: string;
  servico: string;
  data: string;
  turno: string;
  estado: string;
  clienteId?: { nome: string; email: string };
  veiculoId?: { marca: string; modelo: string; matricula: string };
}

interface Indicadores {
  totalMarcacoes: number;
  marcacoesHoje: number;
  porEstado: Record<string, number>;
  clientesRegistados: number;
  veiculosRegistados: number;
  servicosMaisUsados: { nome: string; total: number }[];
  evolucaoTemporal: { data: string; total: number }[];
  agendamentos: AgendamentoDetalhe[];
}

const CORES_ESTADO: Record<string, string> = {
  Pendente: '#eab308',
  'Em curso': '#3b82f6',
  Concluído: '#22c55e',
  Cancelado: '#ef4444',
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [oficinaId, setOficinaId] = useState('');
  const [dados, setDados] = useState<Indicadores | null>(null);

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [estado, setEstado] = useState('');
  const [pesquisa, setPesquisa] = useState('');

  useEffect(() => {
    const init = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) { router.push('/login'); return; }
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') { router.push('/'); return; }

      try {
        const res = await api.get<Oficina[]>('/oficinas');
        const minhas = res.data.filter(o => {
          const dono = typeof o.adminId === 'object' ? o.adminId._id : o.adminId;
          return String(dono) === String(user.id || user._id);
        });
        setOficinas(minhas);
        if (minhas.length > 0) setOficinaId(minhas[0]._id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  // Vai buscar os indicadores da oficina selecionada, respeitando os filtros ativos
  const carregarIndicadores = useCallback(async () => {
    if (!oficinaId) return;
    try {
      const params: Record<string, string> = {};
      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;
      if (estado) params.estado = estado;
      if (pesquisa) params.pesquisa = pesquisa;

      const res = await api.get<Indicadores>(`/oficinas/${oficinaId}/indicadores`, { params });
      setDados(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [oficinaId, dataInicio, dataFim, estado, pesquisa]);

  useEffect(() => { carregarIndicadores(); }, [carregarIndicadores]);

  if (loading) return <div className="page-dark">A carregar dashboard...</div>;

  if (oficinas.length === 0) {
    return <div className="page-dark">Ainda não geres nenhuma oficina.</div>;
  }

  return (
    <main className="page-dark">
      <div className="container-lg stack gap-6">

        <div className="row-wrap row-between" style={{ borderBottom: '1px solid var(--slate-700)', paddingBottom: '1rem' }}>
          <h1 className="title-1 text-accent">Dashboard da Oficina</h1>
          <select
            value={oficinaId}
            onChange={e => setOficinaId(e.target.value)}
            className="select-dark small-pad"
            style={{ width: 'auto' }}
          >
            {oficinas.map(o => (
              <option key={o._id} value={o._id}>{o.nome}</option>
            ))}
          </select>
        </div>

        <div className="grid-4">
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="input-dark small-pad" />
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="input-dark small-pad" />
          <select value={estado} onChange={e => setEstado(e.target.value)} className="select-dark small-pad">
            <option value="">Todos os estados</option>
            <option value="Pendente">Pendente</option>
            <option value="Em curso">Em curso</option>
            <option value="Concluído">Concluído</option>
            <option value="Cancelado">Cancelado</option>
          </select>
          <input type="text" placeholder="Pesquisar cliente, matrícula ou serviço"
            value={pesquisa} onChange={e => setPesquisa(e.target.value)} className="input-dark small-pad" />
        </div>

        {dados && (
          <>
            <div className="grid-4">
              <CartaoIndicador titulo="Total de Marcações" valor={dados.totalMarcacoes} />
              <CartaoIndicador titulo="Marcações Hoje" valor={dados.marcacoesHoje} />
              <CartaoIndicador titulo="Clientes" valor={dados.clientesRegistados} />
              <CartaoIndicador titulo="Veículos" valor={dados.veiculosRegistados} />
            </div>

            <div className="grid-3">
              <div className="chart-card">
                <h3 className="chart-title">Estados das Marcações</h3>
                <GraficoDonut dados={dados.porEstado} />
              </div>

              <div className="chart-card">
                <h3 className="chart-title">Serviços Mais Usados</h3>
                <GraficoBarras dados={dados.servicosMaisUsados} />
              </div>

              <div className="chart-card">
                <h3 className="chart-title">Evolução Temporal</h3>
                <GraficoLinha dados={dados.evolucaoTemporal} />
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Turno</th>
                    <th>Cliente</th>
                    <th>Veículo</th>
                    <th>Serviço</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.agendamentos.map(a => (
                    <tr key={a._id}>
                      <td>{new Date(a.data).toLocaleDateString()}</td>
                      <td>{a.turno}</td>
                      <td>{a.clienteId?.nome}</td>
                      <td>{a.veiculoId?.matricula}</td>
                      <td>{a.servico}</td>
                      <td>{a.estado}</td>
                    </tr>
                  ))}
                  {dados.agendamentos.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-muted">Sem resultados para os filtros aplicados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function CartaoIndicador({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="kpi-card">
      <p className="kpi-label">{titulo}</p>
      <p className="kpi-value">{valor}</p>
    </div>
  );
}

// Gráfico circular (donut) desenhado à mão com um SVG <circle> por estado, usando stroke-dasharray para recortar cada fatia.
function GraficoDonut({ dados }: { dados: Record<string, number> }) {
  const entradas = Object.entries(dados);
  const total = entradas.reduce((soma, [, valor]) => soma + valor, 0);

  if (total === 0) {
    return <p className="text-muted small text-center" style={{ padding: '2rem 0' }}>Sem dados para mostrar.</p>;
  }

  const raio = 60;
  const circunferencia = 2 * Math.PI * raio;
  let acumulado = 0;

  return (
    <div className="row gap-6" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        <g transform="rotate(-90 80 80)">
          <circle cx={80} cy={80} r={raio} fill="none" stroke="var(--slate-700)" strokeWidth={20} />
          {entradas.map(([nomeEstado, valor]) => {
            const comprimento = (valor / total) * circunferencia;
            const offset = -acumulado;
            acumulado += comprimento;
            return (
              <circle
                key={nomeEstado}
                cx={80} cy={80} r={raio}
                fill="none"
                stroke={CORES_ESTADO[nomeEstado] || '#94a3b8'}
                strokeWidth={20}
                strokeDasharray={`${comprimento} ${circunferencia - comprimento}`}
                strokeDashoffset={offset}
              />
            );
          })}
        </g>
        <text x={80} y={80} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={22} fontWeight={900}>
          {total}
        </text>
      </svg>
      <div className="chart-legend" style={{ flexDirection: 'column' }}>
        {entradas.map(([nomeEstado, valor]) => (
          <span key={nomeEstado} className="chart-legend-item">
            <span className="chart-legend-dot" style={{ background: CORES_ESTADO[nomeEstado] || '#94a3b8' }} />
            {nomeEstado} ({valor})
          </span>
        ))}
      </div>
    </div>
  );
}

// Gráfico de barras simples, com a altura de cada barra calculada em CSS a partir do valor máximo do conjunto de dados.
function GraficoBarras({ dados }: { dados: { nome: string; total: number }[] }) {
  if (dados.length === 0) {
    return <p className="text-muted small text-center" style={{ padding: '2rem 0' }}>Sem dados para mostrar.</p>;
  }
  const maximo = Math.max(...dados.map(d => d.total), 1);

  return (
    <div className="row gap-3" style={{ alignItems: 'flex-end', height: 180 }}>
      {dados.map(d => (
        <div key={d.nome} className="stack" style={{ alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
          <span className="xsmall text-accent" style={{ fontWeight: 700, marginBottom: '.25rem' }}>{d.total}</span>
          <div style={{
            width: '100%',
            maxWidth: 36,
            height: `${(d.total / maximo) * 100}%`,
            background: 'var(--blue-500)',
            borderRadius: '6px 6px 0 0',
            minHeight: 4,
          }} />
          <span className="xsmall text-muted" style={{ marginTop: '.4rem', textAlign: 'center' }}>{d.nome}</span>
        </div>
      ))}
    </div>
  );
}

// Gráfico de linha temporal, desenhado com uma polyline SVG cujos pontos são calculados a partir do intervalo de valores dos dados.
function GraficoLinha({ dados }: { dados: { data: string; total: number }[] }) {
  if (dados.length === 0) {
    return <p className="text-muted small text-center" style={{ padding: '2rem 0' }}>Sem dados para mostrar.</p>;
  }

  const largura = 260;
  const altura = 160;
  const margem = 10;
  const maximo = Math.max(...dados.map(d => d.total), 1);

  const pontos = dados.map((d, i) => {
    const x = dados.length === 1 ? largura / 2 : margem + (i / (dados.length - 1)) * (largura - margem * 2);
    const y = altura - margem - (d.total / maximo) * (altura - margem * 2);
    return { x, y, ...d };
  });

  const pathPoints = pontos.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${largura} ${altura}`} style={{ overflow: 'visible' }}>
      <polyline points={pathPoints} fill="none" stroke="var(--green-500)" strokeWidth={2} />
      {pontos.map(p => (
        <circle key={p.data} cx={p.x} cy={p.y} r={3} fill="var(--green-500)" />
      ))}
      {pontos.map((p, i) => (
        i % Math.ceil(pontos.length / 5 || 1) === 0 && (
          <text key={`label-${p.data}`} x={p.x} y={altura} fontSize={8} fill="var(--slate-400)" textAnchor="middle">
            {p.data.slice(5)}
          </text>
        )
      ))}
    </svg>
  );
}
