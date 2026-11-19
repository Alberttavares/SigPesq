import type { VinculoParticipacao } from './types';

// participanteId e projetoId apontam para registros existentes.
// dataSaida vazia indica vínculo ativo; quando preenchida, nunca é anterior a dataEntrada.
export const mockVinculosParticipacaoProjeto: VinculoParticipacao[] = [
  { id: 1, projetoId: 1, participanteId: 1, funcao: 'Coordenador', dataEntrada: '2023-03-01', dataSaida: '' },
  { id: 2, projetoId: 1, participanteId: 2, funcao: 'Bolsista', dataEntrada: '2023-04-01', dataSaida: '' },
  { id: 3, projetoId: 1, participanteId: 3, funcao: 'Apoio Técnico', dataEntrada: '2023-05-15', dataSaida: '2024-05-14' },
  { id: 4, projetoId: 2, participanteId: 4, funcao: 'Coordenador', dataEntrada: '2022-02-10', dataSaida: '2024-02-09' },
  { id: 5, projetoId: 2, participanteId: 6, funcao: 'Bolsista', dataEntrada: '2022-03-01', dataSaida: '2023-12-31' },
  { id: 6, projetoId: 3, participanteId: 5, funcao: 'Coordenador', dataEntrada: '2024-04-01', dataSaida: '' },
  { id: 7, projetoId: 3, participanteId: 7, funcao: 'Colaborador', dataEntrada: '2024-06-01', dataSaida: '' },
  { id: 8, projetoId: 3, participanteId: 9, funcao: 'Apoio Técnico', dataEntrada: '2024-04-15', dataSaida: '' },
  { id: 9, projetoId: 4, participanteId: 10, funcao: 'Coordenador', dataEntrada: '2023-08-15', dataSaida: '2024-03-01' },
  { id: 10, projetoId: 5, participanteId: 1, funcao: 'Coordenador', dataEntrada: '2025-03-01', dataSaida: '' },
  { id: 11, projetoId: 5, participanteId: 8, funcao: 'Bolsista', dataEntrada: '2025-04-01', dataSaida: '' },
  { id: 12, projetoId: 6, participanteId: 4, funcao: 'Coordenador', dataEntrada: '2021-05-01', dataSaida: '2023-04-30' },
];
