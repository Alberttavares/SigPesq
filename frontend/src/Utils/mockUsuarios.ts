import type { Usuario } from './types';

// Usuários apenas para demonstração da interface (não fazem parte do modelo SQL).
// Não há autenticação: o botão "Entrar" acessa o sistema com o usuário padrão.
export const mockUsuarios: Usuario[] = [
  { id: 1, nome: 'Administrador', email: 'admin@univ.edu.br', perfil: 'Administrador' },
  { id: 2, nome: 'Coordenação de Pesquisa', email: 'coord.pesquisa@univ.edu.br', perfil: 'Coordenador' },
  { id: 3, nome: 'Usuário de Consulta', email: 'consulta@univ.edu.br', perfil: 'Consulta' },
];

export const usuarioPadrao: Usuario = mockUsuarios[0];
