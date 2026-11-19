// Conferido nos models e controllers Java. GET retorna arrays JSON.
// POST/PUT retornam texto. DELETE retorna 204 sem corpo.
import type { SituacaoProjeto, TipoApoio } from '../Utils/types';

export interface ParticipanteDTO {
  cpf: string;
  nome: string;
  emailInstitucional: string;
  tipo: 'Docente' | 'Discente' | 'Técnico';
}
export interface ProjetoDTO {
  codigo: string;
  titulo: string;
  descricao: string | null;
  dataInicio: string | null;
  dataTermino: string | null;
  situacao: SituacaoProjeto;
  cpfCoordenador: string;
  nomeCoordenador?: string;
}
export interface FinanciamentoDTO {
  idFinanciamento: number;
  agenciaFinanciadora: string;
  tipoFomento: string;
  valorTotal: number;
  dataInicioVigencia: string | null;
  dataFimVigencia: string | null;
}
export interface ProducaoDTO {
  idProducao: number;
  codigoProjeto: string;
  tituloProjeto?: string;
  titulo: string;
  tipo: string;
  anoPublicacao: string | null;
  meioDivulgacao: string | null;
}
export interface ParticipacaoDTO {
  cpfParticipante: string;
  codigoProjeto: string;
  funcao: string;
  dataEntrada: string | null;
  dataSaida: string | null;
  nomeParticipante?: string;
  tipoParticipante?: string;
  tituloProjeto?: string;
}
export interface FinanciamentoProjetoDTO {
  idVinculoFinanciamento: number;
  idFinanciamento: number;
  codigoProjeto: string;
  tipoApoio: TipoApoio;
  valorApoio: number | null;
  agenciaFinanciadora?: string;
  tipoFomento?: string;
  tituloProjeto?: string;
}
export interface AutoriaDTO {
  idProducao: number;
  cpfParticipante: string;
  tipoParticipacao: string;
  dataInicio: string | null;
  dataTermino: string | null;
  nomeParticipante?: string;
  tipoParticipante?: string;
  tituloProducao?: string;
}
