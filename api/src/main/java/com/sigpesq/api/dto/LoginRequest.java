package com.sigpesq.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LoginRequest(
        @NotBlank(message = "O CPF é obrigatório.")
        @Pattern(regexp = "\\d{11}", message = "O CPF deve conter 11 dígitos numéricos.")
        String cpf,

        @NotBlank(message = "A senha é obrigatória.")
        String senha
) {
    public LoginRequest {
        cpf = cpf != null ? cpf.replaceAll("\\D", "") : null;
    }
}