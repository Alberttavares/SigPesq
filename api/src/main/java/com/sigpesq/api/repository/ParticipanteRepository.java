package com.sigpesq.api.repository;

import com.sigpesq.api.model.Participante;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ParticipanteRepository {

    private final JdbcTemplate jdbc;

    public ParticipanteRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // Mapeia cada linha retornada do MySQL para o objeto Java
    private final RowMapper<Participante> rowMapper = (rs, rowNum) -> {
        Participante p = new Participante();
        p.setCpf(rs.getString("cpf"));
        p.setNome(rs.getString("nome"));
        p.setEmailInstitucional(rs.getString("email_institucional"));
        p.setTipo(rs.getString("tipo"));
        return p;
    };

    // CREATE
    public void salvar(Participante p) {
        String sql = "INSERT INTO participante (cpf, nome, email_institucional, tipo) VALUES (?, ?, ?, ?)";
        jdbc.update(sql, p.getCpf(), p.getNome(), p.getEmailInstitucional(), p.getTipo());
    }

    // READ (Todos)
    public List<Participante> listarTodos() {
        String sql = "SELECT cpf, nome, email_institucional, tipo FROM participante ORDER BY nome";
        return jdbc.query(sql, rowMapper);
    }

    // READ (Por CPF)
    public Participante buscarPorCpf(String cpf) {
        String sql = "SELECT cpf, nome, email_institucional, tipo FROM participante WHERE cpf = ?";
        List<Participante> lista = jdbc.query(sql, rowMapper, cpf);
        return lista.isEmpty() ? null : lista.get(0);
    }

    // UPDATE
    public int atualizar(String cpf, Participante p) {
        String sql = "UPDATE participante SET nome = ?, email_institucional = ?, tipo = ? WHERE cpf = ?";
        return jdbc.update(sql, p.getNome(), p.getEmailInstitucional(), p.getTipo(), cpf);
    }

    // DELETE
    public int deletar(String cpf) {
        String sql = "DELETE FROM participante WHERE cpf = ?";
        return jdbc.update(sql, cpf);
    }
}