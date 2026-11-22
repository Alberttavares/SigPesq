package com.sigpesq.api.dto;

import com.sigpesq.api.model.VinculoParticipanteProducao;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record VinculoParticipanteProducaoRequest(
        @NotNull(message = "O ID da produção científica é obrigatório.")
        @Positive(message = "O ID da produção deve ser um número positivo.")
        Integer idProducao,

        @NotBlank(message = "O CPF do participante é obrigatório.")
        @Pattern(regexp = "\\d{11}", message = "O CPF deve conter 11 dígitos numéricos.")
        String cpfParticipante,

        @NotBlank(message = "O tipo de participação é obrigatório.")
        @Size(max = 100, message = "O tipo de participação deve ter no máximo 100 caracteres.")
        String tipoParticipacao,

        LocalDate dataInicio,

        LocalDate dataTermino
) {
    public VinculoParticipanteProducaoRequest {
        cpfParticipante = cpfParticipante != null ? cpfParticipante.replaceAll("\\D", "") : null;
        tipoParticipacao = tipoParticipacao != null ? tipoParticipacao.trim() : null;
    }

    @AssertTrue(message = "A data de término não pode ser anterior à data de início.")
    public boolean isDatasValidas() {
        if (dataInicio == null || dataTermino == null) return true;
        return !dataTermino.isBefore(dataInicio);
    }

    public VinculoParticipanteProducao toModel() {
        VinculoParticipanteProducao v = new VinculoParticipanteProducao();
        v.setIdProducao(idProducao);
        v.setCpfParticipante(cpfParticipante);
        v.setTipoParticipacao(tipoParticipacao);
        v.setDataInicio(dataInicio);
        v.setDataTermino(dataTermino);
        return v;
    }
}