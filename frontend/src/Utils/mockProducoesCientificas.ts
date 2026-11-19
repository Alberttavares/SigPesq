import type { Producao } from './types';

// Todo projetoId aponta para um projeto existente em mockProjetos.
export const mockProducoesCientificas: Producao[] = [
  { id: 1, titulo: 'Protocolos de Roteamento em IoT', tipo: 'Artigo', ano: 2023, meioDivulgacao: 'Revista Brasileira de Sensores', projetoId: 1 },
  { id: 2, titulo: 'Consumo Energético em Redes de Sensores', tipo: 'Artigo', ano: 2024, meioDivulgacao: 'Simpósio Nacional de Redes', projetoId: 1 },
  { id: 3, titulo: 'Previsão de Safra com Redes Neurais', tipo: 'Capítulo de livro', ano: 2023, meioDivulgacao: 'Coletânea de Computação Aplicada', projetoId: 2 },
  { id: 4, titulo: 'AgroPredict', tipo: 'Software', ano: 2024, meioDivulgacao: 'Repositório institucional', projetoId: 2 },
  { id: 5, titulo: 'Indicadores Educacionais Abertos', tipo: 'Relatório técnico', ano: 2025, meioDivulgacao: 'Relatório interno', projetoId: 3 },
  { id: 6, titulo: 'Sensores de Turbidez de Baixo Custo', tipo: 'Artigo', ano: 2022, meioDivulgacao: 'Revista de Engenharia Ambiental', projetoId: 6 },
  { id: 7, titulo: 'Análise de Firmware em Dispositivos IoT', tipo: 'Artigo', ano: 2025, meioDivulgacao: 'Congresso de Segurança da Informação', projetoId: 5 },
];
