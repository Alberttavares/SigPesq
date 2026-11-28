package com.sigpesq.api.dto;

import java.time.LocalDate;

import com.sigpesq.api.model.Projeto;
import com.sigpesq.api.validation.CpfValido;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProjetoRequest(
        @NotBlank(message = "O código do projeto é obrigatório.")
        @Size(max = 30, message = "O código deve ter no máximo 30 caracteres.")
        String codigo,

        @NotBlank(message = "O título do projeto é obrigatório.")
        @Size(max = 200, message = "O título deve ter no máximo 200 caracteres.")
        String titulo,

        String descricao,

        @NotNull(message = "A data de início é obrigatória.")
        LocalDate dataInicio,

        LocalDate dataTermino,

        @NotBlank(message = "A situação é obrigatória.")
        @Pattern(regexp = "^[ECK]$", message = "A situação deve ser 'E' (Em andamento), 'C' (Concluído) ou 'K' (Cancelado).")
        String situacao,

        @NotBlank(message = "O CPF do coordenador é obrigatório.")
        @CpfValido(message = "Informe um CPF válido para o coordenador.")
        String cpfCoordenador
) {
    public ProjetoRequest {
        codigo = codigo != null ? codigo.trim().toUpperCase() : null;
        titulo = titulo != null ? titulo.trim() : null;
        descricao = descricao != null ? descricao.trim() : null;
        situacao = situacao != null ? situacao.trim() : null;
        cpfCoordenador = cpfCoordenador != null ? cpfCoordenador.replaceAll("\\D", "") : null;
    }

    @AssertTrue(message = "A data de término não pode ser anterior à data de início.")
    public boolean isPeriodoValido() {
        if (dataInicio == null || dataTermino == null) return true;
        return !dataTermino.isBefore(dataInicio);
    }

    public Projeto toModel() {
        Projeto p = new Projeto();
        p.setCodigo(codigo);
        p.setTitulo(titulo);
        p.setDescricao(descricao);
        p.setDataInicio(dataInicio);
        p.setDataTermino(dataTermino);
        p.setSituacao(situacao);
        p.setCpfCoordenador(cpfCoordenador);
        return p;
    }
}