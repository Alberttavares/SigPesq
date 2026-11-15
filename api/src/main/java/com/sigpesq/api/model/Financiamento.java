package com.sigpesq.api.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public class Financiamento {
    private Integer idFinanciamento;
    private String agenciaFinanciadora;
    private String tipoFomento;
    private BigDecimal valorTotal;
    private LocalDate dataInicioVigencia;
    private LocalDate dataFimVigencia;

    public Integer getIdFinanciamento() { return idFinanciamento; }
    public void setIdFinanciamento(Integer idFinanciamento) { this.idFinanciamento = idFinanciamento; }

    public String getAgenciaFinanciadora() { return agenciaFinanciadora; }
    public void setAgenciaFinanciadora(String agenciaFinanciadora) { this.agenciaFinanciadora = agenciaFinanciadora; }

    public String getTipoFomento() { return tipoFomento; }
    public void setTipoFomento(String tipoFomento) { this.tipoFomento = tipoFomento; }

    public BigDecimal getValorTotal() { return valorTotal; }
    public void setValorTotal(BigDecimal valorTotal) { this.valorTotal = valorTotal; }

    public LocalDate getDataInicioVigencia() { return dataInicioVigencia; }
    public void setDataInicioVigencia(LocalDate dataInicioVigencia) { this.dataInicioVigencia = dataInicioVigencia; }

    public LocalDate getDataFimVigencia() { return dataFimVigencia; }
    public void setDataFimVigencia(LocalDate dataFimVigencia) { this.dataFimVigencia = dataFimVigencia; }
}