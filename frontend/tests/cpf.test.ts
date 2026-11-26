import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpfDigits, formatCpf, validarLogin } from '../src/Utils/cpf';

test('aplica a máscara progressivamente e ignora letras e símbolos', () => {
  assert.equal(formatCpf('123'), '123');
  assert.equal(formatCpf('1234'), '123.4');
  assert.equal(formatCpf('1234567'), '123.456.7');
  assert.equal(formatCpf('1234567890'), '123.456.789-0');
  assert.equal(formatCpf('12a3.4b5'), '123.45');
});

test('limita a 11 dígitos e aceita CPF colado com máscara', () => {
  assert.equal(formatCpf('123456789012345'), '123.456.789-01');
  assert.equal(formatCpf('123.456.789-01'), '123.456.789-01');
  assert.equal(cpfDigits('123.456.789-01'), '12345678901');
});

test('valida o preenchimento do login', () => {
  assert.equal(validarLogin('', 'x'), 'Informe seu CPF.');
  assert.equal(validarLogin('123.456', 'x'), 'O CPF deve conter 11 números.');
  assert.equal(validarLogin('123.456.789-01', ''), 'Informe sua senha.');
  assert.equal(validarLogin('123.456.789-01', 'x'), null);
});
