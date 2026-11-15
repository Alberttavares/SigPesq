package com.sigpesq.api.model;

import java.math.BigDecimal;

public class VinculoFinanciamentoProjeto {
    private Integer idFinanciamento;
    private String agenciaFinanciadora; // Preenchido via JOIN
    private String tipoFomento;         // Preenchido via JOIN
    private String codigoProjeto;
    private String tituloProjeto;       // Preenchido via JOIN
    private BigDecimal valorAlocado;

    public Integer getIdFinanciamento() { return idFinanciamento; }
    public void setIdFinanciamento(Integer idFinanciamento) { this.idFinanciamento = idFinanciamento; }

    public String getAgenciaFinanciadora() { return agenciaFinanciadora; }
    public void setAgenciaFinanciadora(String agenciaFinanciadora) { this.agenciaFinanciadora = agenciaFinanciadora; }

    public String getTipoFomento() { return tipoFomento; }
    public void setTipoFomento(String tipoFomento) { this.tipoFomento = tipoFomento; }

    public String getCodigoProjeto() { return codigoProjeto; }
    public void setCodigoProjeto(String codigoProjeto) { this.codigoProjeto = codigoProjeto; }

    public String getTituloProjeto() { return tituloProjeto; }
    public void setTituloProjeto(String tituloProjeto) { this.tituloProjeto = tituloProjeto; }

    public BigDecimal getValorAlocado() { return valorAlocado; }
    public void setValorAlocado(BigDecimal valorAlocado) { this.valorAlocado = valorAlocado; }
}