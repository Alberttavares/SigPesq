import type { Projeto } from './types';

// Todo coordenadorId aponta para um participante do tipo Docente em mockParticipantes.
export const mockProjetos: Projeto[] = [
  {
    id: 1, codigo: 'PRJ-2023-01', titulo: 'Análise de Dados em Redes de Sensores',
    descricao: 'Estudo sobre eficiência energética em redes de sensores sem fio.',
    coordenadorId: 1, dataInicio: '2023-03-01', dataTermino: '2026-12-15', situacao: 'Em andamento',
  },
  {
    id: 2, codigo: 'PRJ-2022-04', titulo: 'Aprendizado de Máquina Aplicado à Agricultura',
    descricao: 'Modelos preditivos para estimativa de produtividade de lavouras.',
    coordenadorId: 4, dataInicio: '2022-02-10', dataTermino: '2024-02-09', situacao: 'Concluido',
  },
  {
    id: 3, codigo: 'PRJ-2024-02', titulo: 'Plataforma Aberta de Dados Educacionais',
    descricao: 'Desenvolvimento de um repositório de indicadores educacionais municipais.',
    coordenadorId: 5, dataInicio: '2024-04-01', dataTermino: '2027-03-31', situacao: 'Em andamento',
  },
  {
    id: 4, codigo: 'PRJ-2023-07', titulo: 'Materiais Compósitos de Baixo Custo',
    descricao: 'Caracterização mecânica de compósitos com fibras naturais.',
    coordenadorId: 10, dataInicio: '2023-08-15', dataTermino: '2025-08-14', situacao: 'Cancelado',
  },
  {
    id: 5, codigo: 'PRJ-2025-01', titulo: 'Segurança em Sistemas Embarcados',
    descricao: 'Avaliação de vulnerabilidades em firmware de dispositivos IoT.',
    coordenadorId: 1, dataInicio: '2025-03-01', dataTermino: '2027-02-28', situacao: 'Em andamento',
  },
  {
    id: 6, codigo: 'PRJ-2021-03', titulo: 'Monitoramento da Qualidade da Água',
    descricao: 'Rede de sensores para monitoramento contínuo de bacias hidrográficas.',
    coordenadorId: 4, dataInicio: '2021-05-01', dataTermino: '2023-04-30', situacao: 'Concluido',
  },
];
