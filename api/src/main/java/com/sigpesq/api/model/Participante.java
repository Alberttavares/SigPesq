package com.sigpesq.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class Participante {
    private String cpf;
    private String nome;
    private String emailInstitucional;
    private String tipo; // "Docente", "Discente" ou "Técnico"]

    @JsonIgnore
    private String senha;

    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getEmailInstitucional() { return emailInstitucional; }
    public void setEmailInstitucional(String emailInstitucional) { this.emailInstitucional = emailInstitucional; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
}