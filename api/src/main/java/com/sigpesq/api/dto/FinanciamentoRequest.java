package com.sigpesq.api.dto;

import com.sigpesq.api.model.Financiamento;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record FinanciamentoRequest(
        @NotBlank(message = "A agência financiadora é obrigatória.")
        @Size(max = 100, message = "A agência deve ter no máximo 100 caracteres.")
        String agenciaFinanciadora,

        @NotBlank(message = "O tipo de fomento é obrigatório.")
        @Size(max = 100, message = "O tipo de fomento deve ter no máximo 100 caracteres.")
        String tipoFomento,

        @NotNull(message = "O valor total é obrigatório.")
        @Positive(message = "O valor total do financiamento deve ser maior que zero.")
        @Digits(integer = 10, fraction = 2, message = "O valor deve ter no máximo 10 dígitos inteiros e 2 casas decimais.")
        BigDecimal valorTotal,

        @NotNull(message = "A data de início da vigência é obrigatória.")
        LocalDate dataInicioVigencia,

        LocalDate dataFimVigencia
) {
    public FinanciamentoRequest {
        agenciaFinanciadora = agenciaFinanciadora != null ? agenciaFinanciadora.trim() : null;
        tipoFomento = tipoFomento != null ? tipoFomento.trim() : null;
    }

    @AssertTrue(message = "A data final de vigência não pode ser anterior à data inicial.")
    public boolean isVigenciaValida() {
        if (dataInicioVigencia == null || dataFimVigencia == null) return true;
        return !dataFimVigencia.isBefore(dataInicioVigencia);
    }

    public Financiamento toModel() {
        Financiamento f = new Financiamento();
        f.setAgenciaFinanciadora(agenciaFinanciadora);
        f.setTipoFomento(tipoFomento);
        f.setValorTotal(valorTotal);
        f.setDataInicioVigencia(dataInicioVigencia);
        f.setDataFimVigencia(dataFimVigencia);
        return f;
    }
}