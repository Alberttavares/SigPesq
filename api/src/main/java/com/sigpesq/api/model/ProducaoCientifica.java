package com.sigpesq.api.model;

public class ProducaoCientifica {
    private Integer idProducao;
    private String codigoProjeto;
    private String tituloProjeto; // Preenchido via JOIN nas consultas
    private String titulo;
    private String tipo; // Ex: Artigo, Capítulo de livro, Software, Relatório técnico
    private String anoPublicacao;
    private String meioDivulgacao;

    public Integer getIdProducao() { return idProducao; }
    public void setIdProducao(Integer idProducao) { this.idProducao = idProducao; }

    public String getCodigoProjeto() { return codigoProjeto; }
    public void setCodigoProjeto(String codigoProjeto) { this.codigoProjeto = codigoProjeto; }

    public String getTituloProjeto() { return tituloProjeto; }
    public void setTituloProjeto(String tituloProjeto) { this.tituloProjeto = tituloProjeto; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getAnoPublicacao() { return anoPublicacao; }
    public void setAnoPublicacao(String anoPublicacao) { this.anoPublicacao = anoPublicacao; }

    public String getMeioDivulgacao() { return meioDivulgacao; }
    public void setMeioDivulgacao(String meioDivulgacao) { this.meioDivulgacao = meioDivulgacao; }
}