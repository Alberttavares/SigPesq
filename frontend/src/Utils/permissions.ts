import type { TipoParticipante } from './types';

// Docente e Administrador podem cadastrar, editar e excluir.
// Discente e Técnico apenas visualizam os dados.
export function podeGerenciar(tipo: TipoParticipante): boolean {
  return tipo === 'Docente' || tipo === 'Administrador';
}

// Tipos disponíveis no cadastro público (Administrador é criado direto no banco).
export const TIPOS_CADASTRO_PUBLICO: TipoParticipante[] = ['Docente', 'Discente', 'Tecnico'];
