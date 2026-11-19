import type { FinanciamentoProjeto } from './types';

// financiamentoId e projetoId apontam para registros existentes.
// Apoio "Total" usa o valor integral do financiamento; apoios "Parcial" somam no máximo o valor total.
export const mockVinculosFinanciamentoProjeto: FinanciamentoProjeto[] = [
  { id: 1, financiamentoId: 2, projetoId: 1, tipoApoio: 'Total', valorApoio: 150000 },
  { id: 2, financiamentoId: 1, projetoId: 1, tipoApoio: 'Parcial', valorApoio: 18000 },
  { id: 3, financiamentoId: 1, projetoId: 5, tipoApoio: 'Parcial', valorApoio: 18000 },
  { id: 4, financiamentoId: 4, projetoId: 2, tipoApoio: 'Parcial', valorApoio: 250000 },
  { id: 5, financiamentoId: 4, projetoId: 6, tipoApoio: 'Parcial', valorApoio: 170000 },
  { id: 6, financiamentoId: 3, projetoId: 3, tipoApoio: 'Total', valorApoio: 50400 },
  { id: 7, financiamentoId: 5, projetoId: 5, tipoApoio: 'Total', valorApoio: 90000 },
];
