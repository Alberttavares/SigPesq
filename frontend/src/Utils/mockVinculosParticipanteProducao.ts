import type { AutorProducao } from './types';

// producaoId e participanteId apontam para registros existentes.
export const mockVinculosParticipanteProducao: AutorProducao[] = [
  { id: 1, producaoId: 1, participanteId: 1, tipoParticipacao: 'Autor Principal', dataInicio: '2023-08-01', dataTermino: '' },
  { id: 2, producaoId: 1, participanteId: 2, tipoParticipacao: 'Coautor', dataInicio: '2023-08-01', dataTermino: '' },
  { id: 3, producaoId: 2, participanteId: 2, tipoParticipacao: 'Autor Principal', dataInicio: '2024-02-01', dataTermino: '2024-09-30' },
  { id: 4, producaoId: 2, participanteId: 1, tipoParticipacao: 'Orientador', dataInicio: '2024-02-01', dataTermino: '2024-09-30' },
  { id: 5, producaoId: 3, participanteId: 4, tipoParticipacao: 'Autor Principal', dataInicio: '2022-10-01', dataTermino: '2023-06-30' },
  { id: 6, producaoId: 3, participanteId: 6, tipoParticipacao: 'Coautor', dataInicio: '2022-10-01', dataTermino: '2023-06-30' },
  { id: 7, producaoId: 4, participanteId: 6, tipoParticipacao: 'Desenvolvedor', dataInicio: '2023-01-15', dataTermino: '2024-01-31' },
  { id: 8, producaoId: 5, participanteId: 5, tipoParticipacao: 'Autor Principal', dataInicio: '2025-01-10', dataTermino: '' },
  { id: 9, producaoId: 5, participanteId: 9, tipoParticipacao: 'Coautor', dataInicio: '2025-01-10', dataTermino: '' },
  { id: 10, producaoId: 6, participanteId: 4, tipoParticipacao: 'Autor Principal', dataInicio: '2022-01-05', dataTermino: '2022-11-20' },
  { id: 11, producaoId: 7, participanteId: 8, tipoParticipacao: 'Autor Principal', dataInicio: '2025-05-01', dataTermino: '' },
  { id: 12, producaoId: 7, participanteId: 1, tipoParticipacao: 'Orientador', dataInicio: '2025-05-01', dataTermino: '' },
];
