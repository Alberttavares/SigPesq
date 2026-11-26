package com.sigpesq.api.dto;

import com.sigpesq.api.model.VinculoParticipacaoProjeto;
import com.sigpesq.api.validation.CpfValido;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record VinculoParticipacaoProjetoRequest(
        @NotBlank(message = "O CPF do participante é obrigatório.")
        @CpfValido(message = "Informe um CPF válido para o participante.")
        String cpfParticipante,

        @NotBlank(message = "O código do projeto é obrigatório.")
        @Size(max = 30, message = "O código do projeto deve ter no máximo 30 caracteres.")
        String codigoProjeto,

        @NotBlank(message = "A função no projeto é obrigatória.")
        @Size(max = 100, message = "A função deve ter no máximo 100 caracteres.")
        String funcao,

        @NotNull(message = "A data de entrada é obrigatória.")
        LocalDate dataEntrada,

        LocalDate dataSaida
) {
    public VinculoParticipacaoProjetoRequest {
        cpfParticipante = cpfParticipante != null ? cpfParticipante.replaceAll("\\D", "") : null;
        codigoProjeto = codigoProjeto != null ? codigoProjeto.trim().toUpperCase() : null;
        funcao = funcao != null ? funcao.trim() : null;
    }

    @AssertTrue(message = "A data de saída não pode ser anterior à data de entrada.")
    public boolean isDatasValidas() {
        if (dataEntrada == null || dataSaida == null) return true;
        return !dataSaida.isBefore(dataEntrada);
    }

    public VinculoParticipacaoProjeto toModel() {
        VinculoParticipacaoProjeto v = new VinculoParticipacaoProjeto();
        v.setCpfParticipante(cpfParticipante);
        v.setCodigoProjeto(codigoProjeto);
        v.setFuncao(funcao);
        v.setDataEntrada(dataEntrada);
        v.setDataSaida(dataSaida);
        return v;
    }
}