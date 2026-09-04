'use client';

import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useRouter } from 'next/navigation';

interface Veiculo {
  _id: string;
  marca: string;
  modelo: string;
  matricula: string;
}

interface Oficina {
  _id: string;
  nome: string;
  servicos?: { _id: string; nome: string; preco: number }[];
}

export default function AgendamentoPage() {
  const router = useRouter();

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [loading, setLoading] = useState(true);

  const [veiculoSel, setVeiculoSel] = useState('');
  const [oficinaSel, setOficinaSel] = useState('');
  const [servicoSel, setServicoSel] = useState('');
  const [dataSel, setDataSel] = useState('');
  const [turnoSel, setTurnoSel] = useState('manha');
  const [vagasLivres, setVagasLivres] = useState<number | null>(null);
  const [aVerificarVagas, setAVerificarVagas] = useState(false);

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          router.push('/login');
          return;
        }
        const user = JSON.parse(userStr);
        const userId = user.id || user._id;

        const [resVeiculos, resOficinas] = await Promise.all([
          api.get(`/veiculos/cliente/${userId}`),
          api.get('/oficinas')
        ]);

        setVeiculos(resVeiculos.data);
        setOficinas(resOficinas.data);
      } catch (err) {
        console.error("Erro ao carregar dados", err);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosIniciais();
  }, [router]);

  // Consulta as vagas livres do dia/turno escolhidos, sempre que a oficina, a data ou o turno mudam, para o cliente ver antes de marcar
  useEffect(() => {
    if (!oficinaSel || !dataSel || !turnoSel) { setVagasLivres(null); return; }
    let cancelado = false;
    setAVerificarVagas(true);
    api.get(`/oficinas/${oficinaSel}/vagas`, { params: { data: dataSel, turno: turnoSel } })
      .then(res => { if (!cancelado) setVagasLivres(res.data.vagasLivres); })
      .catch(() => { if (!cancelado) setVagasLivres(null); })
      .finally(() => { if (!cancelado) setAVerificarVagas(false); });
    return () => { cancelado = true; };
  }, [oficinaSel, dataSel, turnoSel]);

  const handleConfirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const payload = {
        clienteId: user.id || user._id,
        veiculoId: veiculoSel,
        oficinaId: oficinaSel,
        servico: servicoSel,
        data: dataSel,
        turno: turnoSel
      };

      await api.post('/agendamentos', payload);
      alert("Marcação realizada com sucesso!");
      router.push('/');
    } catch (err) {
      const erro = err as { response?: { data?: { msg?: string } } };
      alert(erro.response?.data?.msg || "Erro ao confirmar agendamento. Verifique se escolheu todos os campos.");
    }
  };

  if (loading) return <div className="page-dark font-mono">A carregar os seus veículos...</div>;

  return (
    <main className="page-dark">
      <div className="container-md card card-lg">
        <h1 className="title-1 text-accent italic uppercase font-mono" style={{ marginBottom: '1.5rem' }}>
          Novo Agendamento
        </h1>

        <form onSubmit={handleConfirmar} className="stack gap-6">

          <div>
            <label className="field-label">
              Qual é o seu veículo?
            </label>
            <select
              className="select-dark"
              value={veiculoSel}
              onChange={e => setVeiculoSel(e.target.value)}
              required
            >
              <option value="">Escolha um dos seus carros...</option>
              {veiculos.map(v => (
                <option key={v._id} value={v._id}>
                  {v.marca} {v.modelo} — ({v.matricula})
                </option>
              ))}
            </select>
            {veiculos.length === 0 && (
              <p className="xsmall text-warning uppercase" style={{ marginTop: '.5rem', fontWeight: 700 }}>
                Não tem veículos registados. Vá a Meus Veículos primeiro.
              </p>
            )}
          </div>

          <div>
            <label className="field-label">
              Em qual oficina?
            </label>
            <select
              className="select-dark"
              value={oficinaSel}
              onChange={e => {
                setOficinaSel(e.target.value);
                setServicoSel('');
              }}
              required
            >
              <option value="">Selecione uma oficina disponível...</option>
              {oficinas.map(o => (
                <option key={o._id} value={o._id}>{o.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">
              Serviço pretendido
            </label>
            <select
              className="select-dark"
              value={servicoSel}
              onChange={e => setServicoSel(e.target.value)}
              required
              disabled={!oficinaSel}
            >
              <option value="">{oficinaSel ? "Escolha o serviço..." : "Escolha primeiro a oficina"}</option>
              {oficinas.find(o => o._id === oficinaSel)?.servicos?.map(s => (
                <option key={s._id} value={s.nome}>{s.nome} — {s.preco}€</option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div>
              <label className="field-label">Data</label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                className="input-dark"
                value={dataSel}
                onChange={e => setDataSel(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">Turno</label>
              <div className="row gap-2">
                <button
                  type="button"
                  onClick={() => setTurnoSel('manha')}
                  className={`turn-toggle ${turnoSel === 'manha' ? 'active' : ''}`}
                >Manhã</button>
                <button
                  type="button"
                  onClick={() => setTurnoSel('tarde')}
                  className={`turn-toggle ${turnoSel === 'tarde' ? 'active' : ''}`}
                >Tarde</button>
              </div>
              {oficinaSel && dataSel && (
                <p className={`xsmall uppercase ${vagasLivres === 0 ? 'text-danger' : 'text-muted'}`} style={{ marginTop: '.5rem', fontWeight: 700 }}>
                  {aVerificarVagas ? 'A verificar vagas...' : vagasLivres === null ? '' : vagasLivres === 0 ? 'Sem vagas livres neste turno' : `${vagasLivres} vaga(s) livre(s) neste turno`}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={vagasLivres === 0}
            className="btn btn-success btn-block"
            style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', letterSpacing: '.2em' }}
          >
            Confirmar Marcação
          </button>
        </form>
      </div>
    </main>
  );
}
