package com.sigpesq.api.dto;

import com.sigpesq.api.model.ProducaoCientifica;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProducaoCientificaRequest(
        @NotBlank(message = "O código do projeto vinculado é obrigatório.")
        @Size(max = 30, message = "O código do projeto deve ter no máximo 30 caracteres.")
        String codigoProjeto,

        @NotBlank(message = "O título da produção é obrigatório.")
        @Size(max = 250, message = "O título deve ter no máximo 250 caracteres.")
        String titulo,

        @NotBlank(message = "O tipo da produção é obrigatório.")
        @Size(max = 100, message = "O tipo deve ter no máximo 100 caracteres.")
        String tipo,

        @NotBlank(message = "O ano de publicação é obrigatório.")
        @Pattern(regexp = "\\d{4}", message = "O ano de publicação deve conter 4 dígitos (ex: 2026).")
        String anoPublicacao,

        @NotBlank(message = "O meio de divulgação é obrigatório.")
        @Size(max = 200, message = "O meio de divulgação deve ter no máximo 200 caracteres.")
        String meioDivulgacao
) {
    public ProducaoCientificaRequest {
        codigoProjeto = codigoProjeto != null ? codigoProjeto.trim().toUpperCase() : null;
        titulo = titulo != null ? titulo.trim() : null;
        tipo = tipo != null ? tipo.trim() : null;
        anoPublicacao = anoPublicacao != null ? anoPublicacao.trim() : null;
        meioDivulgacao = meioDivulgacao != null ? meioDivulgacao.trim() : null;
    }

    public ProducaoCientifica toModel() {
        ProducaoCientifica pc = new ProducaoCientifica();
        pc.setCodigoProjeto(codigoProjeto);
        pc.setTitulo(titulo);
        pc.setTipo(tipo);
        pc.setAnoPublicacao(anoPublicacao);
        pc.setMeioDivulgacao(meioDivulgacao);
        return pc;
    }
}