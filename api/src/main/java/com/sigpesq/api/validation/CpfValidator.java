package com.sigpesq.api.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CpfValidator implements ConstraintValidator<CpfValido, String> {

    @Override
    public boolean isValid(String cpf, ConstraintValidatorContext context) {
        // Deixa o @NotBlank cuidar de campos vazios/nulos
        if (cpf == null || cpf.isBlank()) {
            return true;
        }

        String numeros = cpf.replaceAll("\\D", "");

        // Exige 11 dígitos e bloqueia sequências repetidas (ex: 11111111111)
        if (numeros.length() != 11 || numeros.chars().distinct().count() == 1) {
            return false;
        }

        // Etapa A: Cálculo do 1º dígito verificador (pesos 10 a 2 nos 9 primeiros dígitos)
        int soma = 0;
        for (int i = 0; i < 9; i++) {
            int digito = numeros.charAt(i) - '0';
            soma += digito * (10 - i);
        }
        int resto = soma % 11;
        int digito1 = (resto < 2) ? 0 : (11 - resto);

        if (digito1 != (numeros.charAt(9) - '0')) {
            return false;
        }

        // Etapa B: Cálculo do 2º dígito verificador (pesos 11 a 2 nos 10 primeiros dígitos)
        soma = 0;
        for (int i = 0; i < 10; i++) {
            int digito = numeros.charAt(i) - '0';
            soma += digito * (11 - i);
        }
        resto = soma % 11;
        int digito2 = (resto < 2) ? 0 : (11 - resto);

        return digito2 == (numeros.charAt(10) - '0');
    }
}