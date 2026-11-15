package com.sigpesq.api.model;

import java.time.LocalDate;

public class VinculoParticipanteProducao {
    private Integer idProducao;
    private String tituloProducao;   // Preenchido via JOIN
    private String cpfParticipante;
    private String nomeParticipante; // Preenchido via JOIN
    private String tipoParticipante; // Preenchido via JOIN
    private String tipoParticipacao; // Ex: Autor Principal, Coautor, Orientador
    private LocalDate dataInicio;
    private LocalDate dataTermino;

    public Integer getIdProducao() { return idProducao; }
    public void setIdProducao(Integer idProducao) { this.idProducao = idProducao; }

    public String getTituloProducao() { return tituloProducao; }
    public void setTituloProducao(String tituloProducao) { this.tituloProducao = tituloProducao; }

    public String getCpfParticipante() { return cpfParticipante; }
    public void setCpfParticipante(String cpfParticipante) { this.cpfParticipante = cpfParticipante; }

    public String getNomeParticipante() { return nomeParticipante; }
    public void setNomeParticipante(String nomeParticipante) { this.nomeParticipante = nomeParticipante; }

    public String getTipoParticipante() { return tipoParticipante; }
    public void setTipoParticipante(String tipoParticipante) { this.tipoParticipante = tipoParticipante; }

    public String getTipoParticipacao() { return tipoParticipacao; }
    public void setTipoParticipacao(String tipoParticipacao) { this.tipoParticipacao = tipoParticipacao; }

    public LocalDate getDataInicio() { return dataInicio; }
    public void setDataInicio(LocalDate dataInicio) { this.dataInicio = dataInicio; }

    public LocalDate getDataTermino() { return dataTermino; }
    public void setDataTermino(LocalDate dataTermino) { this.dataTermino = dataTermino; }
}