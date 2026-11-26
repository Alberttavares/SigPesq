import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { TipoParticipante, UsuarioAutenticado } from '../Utils/types';
import { TIPOS_CADASTRO_PUBLICO } from '../Utils/permissions';
import type { ParticipanteDTO } from './contracts';
import { apiClient } from './http';
import { normalizeCpf } from './research';

// Chamado pela mesma origem do front-end; o Next encaminha para /api/auth (ver next.config.mjs).
export const authClient = axios.create({
  baseURL: '/api-auth',
  timeout: 15000,
  headers: { Accept: 'application/json, text/plain' },
});

export const LOGIN_INVALIDO = 'CPF ou senha incorretos. Tente novamente.';

const TIPOS_VALIDOS: TipoParticipante[] = ['Docente', 'Discente', 'Tecnico', 'Administrador'];

function toUsuario(data: ParticipanteDTO): UsuarioAutenticado {
  const tipo = data.tipo === 'Técnico' ? 'Tecnico' : data.tipo;
  if (!data.cpf || !data.nome || !TIPOS_VALIDOS.includes(tipo)) {
    throw new Error('A API retornou dados de usuário inválidos no login.');
  }
  return { cpf: data.cpf, nome: data.nome, email: data.emailInstitucional, tipo };
}

export interface CadastroParticipante {
  nome: string;
  email: string;
  cpf: string;
  tipo: TipoParticipante;
  senha: string;
}

export function createAuthService(auth: AxiosInstance = authClient, api: AxiosInstance = apiClient) {
  // POST /auth/login com { cpf, senha }. 401 = credenciais inválidas.
  async function login(cpf: string, senha: string): Promise<UsuarioAutenticado> {
    const body = { cpf: normalizeCpf(cpf), senha };
    try {
      const { data } = await auth.post<ParticipanteDTO>('/login', body);
      return toUsuario(data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) throw new Error(LOGIN_INVALIDO);
        if (!error.response || error.response.status >= 500) {
          throw new Error('Não foi possível concluir o login. Verifique se o back-end está ativo e tente novamente.');
        }
      }
      throw error;
    }
  }

  // POST /participantes com senha. O tipo Administrador não é aceito no cadastro público.
  async function cadastrar(input: CadastroParticipante): Promise<string> {
    if (!TIPOS_CADASTRO_PUBLICO.includes(input.tipo)) throw new Error('Selecione um tipo de participante válido.');
    const cpf = normalizeCpf(input.cpf);
    await api.post<string>('/participantes', {
      cpf,
      nome: input.nome,
      emailInstitucional: input.email,
      tipo: input.tipo === 'Tecnico' ? 'Técnico' : input.tipo,
      senha: input.senha,
    });
    return cpf;
  }

  return { login, cadastrar };
}

export const authService = createAuthService();
