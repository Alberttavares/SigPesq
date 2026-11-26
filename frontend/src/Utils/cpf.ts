// Máscara de CPF (000.000.000-00): mantém só números, limitados a 11 dígitos.
export function cpfDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}

export function formatCpf(value: string): string {
  const d = cpfDigits(value);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// Mensagens de preenchimento do login; null quando os campos estão válidos.
export function validarLogin(cpf: string, senha: string): string | null {
  const digits = cpfDigits(cpf);
  if (!digits) return 'Informe seu CPF.';
  if (digits.length < 11) return 'O CPF deve conter 11 números.';
  if (!senha) return 'Informe sua senha.';
  return null;
}
