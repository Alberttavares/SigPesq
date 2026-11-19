import type { Financiamento } from './types';

export const mockFinanciamentos: Financiamento[] = [
  { id: 1, agencia: 'CNPq', tipoFomento: 'Bolsa de Produtividade', valorTotal: 36000, inicioVigencia: '2023-01-01', fimVigencia: '2024-12-31' },
  { id: 2, agencia: 'FAPES', tipoFomento: 'Auxílio Pesquisa', valorTotal: 150000, inicioVigencia: '2023-06-01', fimVigencia: '2025-06-01' },
  { id: 3, agencia: 'CAPES', tipoFomento: 'Bolsa de Mestrado', valorTotal: 50400, inicioVigencia: '2024-03-01', fimVigencia: '2026-02-28' },
  { id: 4, agencia: 'FINEP', tipoFomento: 'Infraestrutura', valorTotal: 420000, inicioVigencia: '2022-01-01', fimVigencia: '2024-12-31' },
  { id: 5, agencia: 'CNPq', tipoFomento: 'Edital Universal', valorTotal: 90000, inicioVigencia: '2025-01-01', fimVigencia: '2027-12-31' },
];
