import type { AxiosInstance } from 'axios';
import type {
  AutorProducao, Database, Financiamento, FinanciamentoProjeto, Participante,
  Producao, Projeto, VinculoParticipacao,
} from '../Utils/types';
import type {
  AutoriaDTO, FinanciamentoDTO, FinanciamentoProjetoDTO, ParticipacaoDTO,
  ParticipanteDTO, ProducaoDTO, ProjetoDTO,
} from './contracts';
import { apiClient } from './http';

export type CollectionName = keyof Database;
export type RecordOf<K extends CollectionName> = Database[K][number];

export function createEmptyDatabase(): Database {
  return {
    participantes: [], projetos: [], financiamentos: [], producoes: [],
    vinculosParticipacao: [], financiamentosProjeto: [], autoresProducao: [],
  };
}

const routes: Record<CollectionName, string> = {
  participantes: '/participantes', projetos: '/projetos', financiamentos: '/financiamentos',
  producoes: '/producoes', vinculosParticipacao: '/vinculos-projeto',
  financiamentosProjeto: '/vinculos-financiamento', autoresProducao: '/vinculos-producao',
};

export function normalizeCpf(cpf: string): string {
  const normalized = cpf.replace(/[.\-\s]/g, '');
  if (!/^\d{11}$/.test(normalized)) throw new Error('Informe um CPF com 11 dígitos.');
  return normalized;
}

function requiredText(value: string | undefined, label: string): string {
  if (!value?.trim()) throw new Error(`Informe ${label}.`);
  return value;
}

const dateOrNull = (value: string | undefined) => value || null;
const segment = (value: string | number) => encodeURIComponent(String(value));

function findRecord<T extends { id: number }>(items: T[], id: number | undefined, label: string): T {
  const record = items.find(item => item.id === id);
  if (!record) throw new Error(`${label} não encontrado. Atualize os dados e tente novamente.`);
  return record;
}
function originalRecord<T extends { id: number }>(items: T[], data: Partial<T>): T | undefined {
  return data.id === undefined ? undefined : findRecord(items, data.id, 'Registro');
}
function unchanged(condition: boolean, label: string) {
  if (!condition) throw new Error(`A API não permite alterar ${label} de um registro existente.`);
}

// Mantém os IDs numéricos usados pelos selects e tabelas da interface.
// IDs locais são estáveis na sessão e nunca substituem as chaves reais na API.
export function createResearchService(client: AxiosInstance = apiClient) {
  const identities = new Map<string, number>();
  let nextIdentity = 1;
  function identity(kind: string, ...keys: (string | number)[]): number {
    const key = JSON.stringify([kind, ...keys]);
    let id = identities.get(key);
    if (id === undefined) {
      id = nextIdentity++;
      identities.set(key, id);
    }
    return id;
  }

  async function list<T>(collection: CollectionName, signal?: AbortSignal): Promise<T[]> {
    const { data } = await client.get<T[]>(routes[collection], { signal });
    if (!Array.isArray(data)) throw new Error(`A API retornou uma lista inválida em ${routes[collection]}.`);
    return data;
  }

  async function load(signal?: AbortSignal): Promise<Database> {
    const [participants, projects, funding, productions, participation, projectFunding, authors] = await Promise.all([
      list<ParticipanteDTO>('participantes', signal), list<ProjetoDTO>('projetos', signal),
      list<FinanciamentoDTO>('financiamentos', signal), list<ProducaoDTO>('producoes', signal),
      list<ParticipacaoDTO>('vinculosParticipacao', signal), list<FinanciamentoProjetoDTO>('financiamentosProjeto', signal),
      list<AutoriaDTO>('autoresProducao', signal),
    ]);

    return {
      participantes: participants.map(p => ({
        id: identity('participante', p.cpf), cpf: p.cpf, nome: p.nome,
        email: p.emailInstitucional, tipo: p.tipo === 'Técnico' ? 'Tecnico' : p.tipo,
      })),
      projetos: projects.map(p => ({
        id: identity('projeto', p.codigo), codigo: p.codigo, titulo: p.titulo,
        descricao: p.descricao ?? '', coordenadorId: identity('participante', p.cpfCoordenador),
        dataInicio: p.dataInicio ?? '', dataTermino: p.dataTermino ?? '', situacao: p.situacao,
      })),
      financiamentos: funding.map(f => ({
        id: f.idFinanciamento, agencia: f.agenciaFinanciadora, tipoFomento: f.tipoFomento,
        valorTotal: f.valorTotal, inicioVigencia: f.dataInicioVigencia ?? '', fimVigencia: f.dataFimVigencia ?? '',
      })),
      producoes: productions.map(p => ({
        id: p.idProducao, projetoId: identity('projeto', p.codigoProjeto), titulo: p.titulo,
        tipo: p.tipo, ano: p.anoPublicacao === null ? undefined : Number(p.anoPublicacao),
        meioDivulgacao: p.meioDivulgacao ?? '',
      })),
      vinculosParticipacao: participation.map(v => ({
        id: identity('participacao', v.codigoProjeto, v.cpfParticipante),
        projetoId: identity('projeto', v.codigoProjeto), participanteId: identity('participante', v.cpfParticipante),
        funcao: v.funcao, dataEntrada: v.dataEntrada ?? '', dataSaida: v.dataSaida ?? '',
      })),
      financiamentosProjeto: projectFunding.map(v => ({
        id: v.idVinculoFinanciamento, financiamentoId: v.idFinanciamento,
        projetoId: identity('projeto', v.codigoProjeto), tipoApoio: v.tipoApoio, valorApoio: v.valorApoio ?? undefined,
      })),
      autoresProducao: authors.map(v => ({
        id: identity('autoria', v.cpfParticipante, v.idProducao), producaoId: v.idProducao,
        participanteId: identity('participante', v.cpfParticipante), tipoParticipacao: v.tipoParticipacao,
        dataInicio: v.dataInicio ?? '', dataTermino: v.dataTermino ?? '',
      })),
    };
  }

  function participantCpf(db: Database, id: number | undefined) {
    return findRecord(db.participantes, id, 'Participante').cpf;
  }
  function projectCode(db: Database, id: number | undefined) {
    return findRecord(db.projetos, id, 'Projeto').codigo;
  }

  function payload<K extends CollectionName>(collection: K, input: Partial<RecordOf<K>>, db: Database) {
    switch (collection) {
      case 'participantes': {
        const data = input as Partial<Participante>;
        const original = originalRecord(db.participantes, data);
        const cpf = normalizeCpf(requiredText(data.cpf, 'o CPF'));
        if (original) unchanged(cpf === original.cpf, 'o CPF');
        return { cpf, nome: requiredText(data.nome, 'o nome'), emailInstitucional: requiredText(data.email, 'o e-mail institucional'), tipo: data.tipo === 'Tecnico' ? 'Técnico' : data.tipo };
      }
      case 'projetos': {
        const data = input as Partial<Projeto>;
        const original = originalRecord(db.projetos, data);
        const codigo = requiredText(data.codigo, 'o código do projeto');
        if (original) unchanged(codigo === original.codigo, 'o código do projeto');
        return { codigo, titulo: requiredText(data.titulo, 'o título'), descricao: data.descricao || null, cpfCoordenador: participantCpf(db, data.coordenadorId), dataInicio: dateOrNull(data.dataInicio), dataTermino: dateOrNull(data.dataTermino), situacao: data.situacao };
      }
      case 'financiamentos': {
        const data = input as Partial<Financiamento>;
        return { agenciaFinanciadora: requiredText(data.agencia, 'a agência financiadora'), tipoFomento: requiredText(data.tipoFomento, 'o tipo de fomento'), valorTotal: data.valorTotal, dataInicioVigencia: dateOrNull(data.inicioVigencia), dataFimVigencia: dateOrNull(data.fimVigencia) };
      }
      case 'producoes': {
        const data = input as Partial<Producao>;
        return { codigoProjeto: projectCode(db, data.projetoId), titulo: requiredText(data.titulo, 'o título'), tipo: requiredText(data.tipo, 'o tipo da produção'), anoPublicacao: data.ano === undefined ? null : String(data.ano), meioDivulgacao: data.meioDivulgacao || null };
      }
      case 'vinculosParticipacao': {
        const data = input as Partial<VinculoParticipacao>;
        const original = originalRecord(db.vinculosParticipacao, data);
        if (original) unchanged(data.projetoId === original.projetoId && data.participanteId === original.participanteId, 'o projeto ou o participante do vínculo');
        return { codigoProjeto: projectCode(db, data.projetoId), cpfParticipante: participantCpf(db, data.participanteId), funcao: requiredText(data.funcao, 'a função'), dataEntrada: dateOrNull(data.dataEntrada), dataSaida: dateOrNull(data.dataSaida) };
      }
      case 'financiamentosProjeto': {
        const data = input as Partial<FinanciamentoProjeto>;
        const original = originalRecord(db.financiamentosProjeto, data);
        if (original) unchanged(data.projetoId === original.projetoId && data.financiamentoId === original.financiamentoId, 'o projeto ou o financiamento do vínculo');
        return { codigoProjeto: projectCode(db, data.projetoId), idFinanciamento: findRecord(db.financiamentos, data.financiamentoId, 'Financiamento').id, tipoApoio: data.tipoApoio, valorApoio: data.valorApoio ?? null };
      }
      case 'autoresProducao': {
        const data = input as Partial<AutorProducao>;
        const original = originalRecord(db.autoresProducao, data);
        if (original) unchanged(data.producaoId === original.producaoId && data.participanteId === original.participanteId, 'a produção ou o participante da autoria');
        return { idProducao: findRecord(db.producoes, data.producaoId, 'Produção').id, cpfParticipante: participantCpf(db, data.participanteId), tipoParticipacao: requiredText(data.tipoParticipacao, 'o tipo de participação'), dataInicio: dateOrNull(data.dataInicio), dataTermino: dateOrNull(data.dataTermino) };
      }
    }
  }

  function recordPath<K extends CollectionName>(collection: K, input: RecordOf<K>, db: Database): string {
    const base = routes[collection];
    switch (collection) {
      case 'participantes': return `${base}/${segment((input as Participante).cpf)}`;
      case 'projetos': return `${base}/${segment((input as Projeto).codigo)}`;
      case 'vinculosParticipacao': {
        const data = input as VinculoParticipacao;
        return `${base}/${segment(projectCode(db, data.projetoId))}/${segment(participantCpf(db, data.participanteId))}`;
      }
      case 'autoresProducao': {
        const data = input as AutorProducao;
        return `${base}/${segment(participantCpf(db, data.participanteId))}/${segment(data.producaoId)}`;
      }
      default: return `${base}/${segment(input.id)}`;
    }
  }

  async function save<K extends CollectionName>(collection: K, data: Partial<RecordOf<K>>, db: Database): Promise<void> {
    const body = payload(collection, data, db);
    if (data.id === undefined) {
      await client.post<string>(routes[collection], body);
    } else {
      const original = findRecord(db[collection] as RecordOf<K>[], data.id, 'Registro');
      await client.put<string>(recordPath(collection, original, db), body);
    }
  }
  async function remove<K extends CollectionName>(collection: K, data: RecordOf<K>, db: Database): Promise<void> {
    await client.delete<void>(recordPath(collection, data, db));
  }
  return { load, save, remove };
}

export const researchService = createResearchService();
