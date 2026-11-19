// Tipos compartilhados pelos mocks e pela interface do SigPesq.
// Os campos seguem o modelo SQL de referência (comentários indicam a coluna
// correspondente). O `id` numérico é apenas uma chave técnica da interface,
// usada para edição, exclusão e relacionamentos. O serviço traduz as chaves da API.

// Valores dos ENUMs conforme o modelo SQL (sem acentuação).
export type TipoParticipante = 'Docente' | 'Discente' | 'Tecnico';
export type SituacaoProjeto = 'Em andamento' | 'Concluido' | 'Cancelado';
export type TipoApoio = 'Total' | 'Parcial';

// Rótulos exibidos na interface para os valores dos ENUMs.
export const TIPO_PARTICIPANTE_LABEL: Record<TipoParticipante, string> = {
  Docente: 'Docente',
  Discente: 'Discente',
  Tecnico: 'Técnico',
};

export const SITUACAO_PROJETO_LABEL: Record<SituacaoProjeto, string> = {
  'Em andamento': 'Em andamento',
  Concluido: 'Concluído',
  Cancelado: 'Cancelado',
};

/** Tabela Participante */
export interface Participante {
  id: number;
  nome: string;   // nome
  email: string;  // email_institucional
  cpf: string;    // cpf
  tipo: TipoParticipante; // tipo
}

/** Tabela Projeto */
export interface Projeto {
  id: number;
  codigo: string;       // codigo
  titulo: string;       // titulo
  descricao: string;    // descricao
  coordenadorId: number; // cpf_coordenador (referência a Participante)
  dataInicio: string;   // data_inicio (AAAA-MM-DD)
  dataTermino: string;  // data_termino (AAAA-MM-DD)
  situacao: SituacaoProjeto; // situacao
}

/** Tabela Financiamento */
export interface Financiamento {
  id: number;             // id_financiamento
  agencia: string;        // agencia_financiadora
  tipoFomento: string;    // tipo_fomento
  valorTotal: number;     // valor_total
  inicioVigencia: string; // data_inicio_vigencia
  fimVigencia: string;    // data_fim_vigencia
}

/** Tabela Producao_Cientifica */
export interface Producao {
  id: number;             // id_producao
  projetoId: number;      // codigo_projeto (referência a Projeto)
  titulo: string;         // titulo
  tipo: string;           // tipo
  ano: number | undefined; // ano_publicacao (NULL = não informado)
  meioDivulgacao: string; // meio_divulgacao
}

/** Vínculo de participação em projeto */
export interface VinculoParticipacao {
  id: number;
  participanteId: number; // cpf_participante
  projetoId: number;      // codigo_projeto
  funcao: string;         // funcao
  dataEntrada: string;    // data_entrada
  dataSaida: string;      // data_saida (vazio = vínculo ativo)
}

/** Vínculo entre financiamento e projeto */
export interface FinanciamentoProjeto {
  id: number;              // id_vinculo_financiamento
  financiamentoId: number; // id_financiamento
  projetoId: number;       // codigo_projeto
  tipoApoio: TipoApoio;    // tipo_apoio
  valorApoio: number | undefined; // valor_apoio (NULL = não informado)
}

/** Vínculo entre participante e produção científica */
export interface AutorProducao {
  id: number;
  producaoId: number;       // id_producao
  participanteId: number;   // cpf_participante
  tipoParticipacao: string; // tipo_participacao
  dataInicio: string;       // data_inicio
  dataTermino: string;      // data_termino (pode ficar vazio)
}

/**
 * Usuário do sistema — entidade apenas para demonstração da interface.
 * Não faz parte do modelo SQL.
 */
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: 'Administrador' | 'Coordenador' | 'Consulta';
}

/** Dados da API adaptados aos campos já usados pela interface. */
export interface Database {
  participantes: Participante[];
  projetos: Projeto[];
  financiamentos: Financiamento[];
  producoes: Producao[];
  vinculosParticipacao: VinculoParticipacao[];
  financiamentosProjeto: FinanciamentoProjeto[];
  autoresProducao: AutorProducao[];
}
