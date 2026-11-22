package com.sigpesq.api.dto;

import com.sigpesq.api.model.VinculoFinanciamentoProjeto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record VinculoFinanciamentoProjetoRequest(
        @NotNull(message = "O ID do financiamento é obrigatório.")
        @Positive(message = "O ID do financiamento deve ser um número positivo.")
        Integer idFinanciamento,

        @NotBlank(message = "O código do projeto é obrigatório.")
        @Size(max = 30, message = "O código do projeto deve ter no máximo 30 caracteres.")
        String codigoProjeto,

        @NotBlank(message = "O tipo de apoio é obrigatório.")
        @Pattern(regexp = "Total|Parcial", message = "O tipo de apoio deve ser 'Total' ou 'Parcial'.")
        String tipoApoio,

        @Positive(message = "O valor de apoio deve ser maior que zero.")
        @Digits(integer = 10, fraction = 2, message = "O valor deve ter no máximo 10 dígitos inteiros e 2 casas decimais.")
        BigDecimal valorApoio
) {
    public VinculoFinanciamentoProjetoRequest {
        codigoProjeto = codigoProjeto != null ? codigoProjeto.trim().toUpperCase() : null;
        tipoApoio = tipoApoio != null ? tipoApoio.trim() : null;
    }

    public VinculoFinanciamentoProjeto toModel() {
        VinculoFinanciamentoProjeto v = new VinculoFinanciamentoProjeto();
        v.setIdFinanciamento(idFinanciamento);
        v.setCodigoProjeto(codigoProjeto);
        v.setTipoApoio(tipoApoio);
        v.setValorApoio(valorApoio);
        return v;
    }
}