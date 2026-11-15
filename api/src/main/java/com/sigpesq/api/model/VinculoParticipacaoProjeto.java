package com.sigpesq.api.model;

import java.time.LocalDate;

public class VinculoParticipacaoProjeto {
    private String cpfParticipante;
    private String nomeParticipante; // Preenchido via JOIN
    private String tipoParticipante; // Preenchido via JOIN
    private String codigoProjeto;
    private String tituloProjeto;    // Preenchido via JOIN
    private String funcao;
    private LocalDate dataEntrada;
    private LocalDate dataSaida;

    public String getCpfParticipante() { return cpfParticipante; }
    public void setCpfParticipante(String cpfParticipante) { this.cpfParticipante = cpfParticipante; }

    public String getNomeParticipante() { return nomeParticipante; }
    public void setNomeParticipante(String nomeParticipante) { this.nomeParticipante = nomeParticipante; }

    public String getTipoParticipante() { return tipoParticipante; }
    public void setTipoParticipante(String tipoParticipante) { this.tipoParticipante = tipoParticipante; }

    public String getCodigoProjeto() { return codigoProjeto; }
    public void setCodigoProjeto(String codigoProjeto) { this.codigoProjeto = codigoProjeto; }

    public String getTituloProjeto() { return tituloProjeto; }
    public void setTituloProjeto(String tituloProjeto) { this.tituloProjeto = tituloProjeto; }

    public String getFuncao() { return funcao; }
    public void setFuncao(String funcao) { this.funcao = funcao; }

    public LocalDate getDataEntrada() { return dataEntrada; }
    public void setDataEntrada(LocalDate dataEntrada) { this.dataEntrada = dataEntrada; }

    public LocalDate getDataSaida() { return dataSaida; }
    public void setDataSaida(LocalDate dataSaida) { this.dataSaida = dataSaida; }
}