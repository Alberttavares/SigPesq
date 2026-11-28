package com.sigpesq.api.dto;

import com.sigpesq.api.model.Participante;
import com.sigpesq.api.validation.CpfValido;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ParticipanteRequest(
       @NotBlank(message = "O CPF é obrigatório.")
        @CpfValido(message = "Informe um CPF válido.")
        String cpf,
        @NotBlank(message = "O nome é obrigatório.")
        @Size(min = 3, max = 150, message = "O nome deve ter entre 3 e 150 caracteres.")
        String nome,

        @NotBlank(message = "O e-mail institucional é obrigatório.")
        @Email(message = "Informe um endereço de e-mail válido.")
        @Size(max = 150, message = "O e-mail deve ter no máximo 150 caracteres.")
        String emailInstitucional,

        @NotBlank(message = "O tipo de participante é obrigatório.")
        @Pattern(regexp = "^[DPAT]$", message = "O tipo deve ser 'D' (Administrador), 'P' (Docente), 'A' (Discente) ou 'T' (Técnico).")
        String tipo,

        @Size(min = 6, max = 100, message = "A senha deve ter entre 6 e 100 caracteres.")
        String senha
) {
    public ParticipanteRequest {
        cpf = cpf != null ? cpf.replaceAll("\\D", "") : null;
        nome = nome != null ? nome.trim() : null;
        emailInstitucional = emailInstitucional != null ? emailInstitucional.trim().toLowerCase() : null;
     if (tipo != null) {
            tipo = switch (tipo.trim().toLowerCase()) {
                case "administrador", "d" -> "D";
                case "docente", "p" -> "P";
                case "discente", "a" -> "A";
                case "técnico", "tecnico", "t" -> "T";
                default -> tipo.trim().toUpperCase();
            };
        }
        senha = (senha != null && senha.isBlank()) ? null : senha;
    }

    public Participante toModel() {
        Participante p = new Participante();
        p.setCpf(cpf);
        p.setNome(nome);
        p.setEmailInstitucional(emailInstitucional);
        p.setTipo(tipo);
        p.setSenha(senha);
        return p;
    }
}