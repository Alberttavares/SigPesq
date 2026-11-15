package com.sigpesq.api.model;

import java.time.LocalDate;

public class Projeto {
    private String codigo;
    private String titulo;
    private String descricao;
    private LocalDate dataInicio;
    private LocalDate dataTermino;
    private String situacao; // "Em andamento", "Concluido" ou "Cancelado"
    private String cpfCoordenador;
    private String nomeCoordenador; // Preenchido via JOIN nas consultas

    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public LocalDate getDataInicio() { return dataInicio; }
    public void setDataInicio(LocalDate dataInicio) { this.dataInicio = dataInicio; }

    public LocalDate getDataTermino() { return dataTermino; }
    public void setDataTermino(LocalDate dataTermino) { this.dataTermino = dataTermino; }

    public String getSituacao() { return situacao; }
    public void setSituacao(String situacao) { this.situacao = situacao; }

    public String getCpfCoordenador() { return cpfCoordenador; }
    public void setCpfCoordenador(String cpfCoordenador) { this.cpfCoordenador = cpfCoordenador; }

    public String getNomeCoordenador() { return nomeCoordenador; }
    public void setNomeCoordenador(String nomeCoordenador) { this.nomeCoordenador = nomeCoordenador; }
}