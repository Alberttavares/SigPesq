import axios from 'axios';

export const apiClient = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api').replace(/\/+$/, ''),
  timeout: 15000,
  headers: { Accept: 'application/json, text/plain' },
});

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body: unknown = error.response?.data;
    if (typeof body === 'string' && body.trim() && !body.trim().startsWith('<')) return body;
    if (error.response?.status === 404) return 'Registro não encontrado. Atualize a página e tente novamente.';
    if (error.response?.status === 409) return 'A operação conflita com um registro ou vínculo existente.';
    if (error.code === 'ECONNABORTED') return 'A API demorou para responder. Confira o resultado antes de repetir a operação.';
    if (!error.response) return 'Não foi possível conectar à API. Verifique se o back-end está ativo e acessível.';
    return `A API não conseguiu concluir a operação (HTTP ${error.response.status}).`;
  }
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}
