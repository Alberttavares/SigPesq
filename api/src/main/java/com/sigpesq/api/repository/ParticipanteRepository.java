package com.sigpesq.api.repository;

import com.sigpesq.api.model.Participante;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ParticipanteRepository {

    private final JdbcTemplate jdbc;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public ParticipanteRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // Mapeia cada linha retornada do MySQL para o objeto Java (sem expor a senha)
    private final RowMapper<Participante> rowMapper = (rs, rowNum) -> {
        Participante p = new Participante();
        p.setCpf(rs.getString("cpf"));
        p.setNome(rs.getString("nome"));
        p.setEmailInstitucional(rs.getString("email_institucional"));
        p.setTipo(rs.getString("tipo"));
        return p;
    };

    // Verifica se o participante é administrador
    public boolean isAdministrador(String cpf) {
        if (cpf == null || cpf.isBlank()) {
            return false;
        }
        String sql = "SELECT COUNT(*) FROM participante WHERE cpf = ? AND tipo = 'D'";
        Integer total = jdbc.queryForObject(sql, Integer.class, cpf);
        return total != null && total > 0;
    }

    // AUTH (Valida CPF e compara a senha pura com o hash BCrypt do banco)
    public Participante autenticar(String cpf, String senhaPura) {
        String sql = "SELECT cpf, nome, email_institucional, tipo, senha FROM participante WHERE cpf = ?";

        List<Participante> lista = jdbc.query(sql, (rs, rowNum) -> {
            Participante p = new Participante();
            p.setCpf(rs.getString("cpf"));
            p.setNome(rs.getString("nome"));
            p.setEmailInstitucional(rs.getString("email_institucional"));
            p.setTipo(rs.getString("tipo"));
            p.setSenha(rs.getString("senha"));
            return p;
        }, cpf);

        if (lista.isEmpty()) {
            return null;
        }

        Participante participante = lista.get(0);
        if (!passwordEncoder.matches(senhaPura, participante.getSenha())) {
            return null;
        }

        return participante;
    }

    // CREATE
    public void salvar(Participante p) {
        String sql = "INSERT INTO participante (cpf, nome, email_institucional, tipo, senha) VALUES (?, ?, ?, ?, ?)";
        String senhaHash = passwordEncoder.encode(p.getSenha());
        jdbc.update(sql, p.getCpf(), p.getNome(), p.getEmailInstitucional(), p.getTipo(), senhaHash);
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

    // UPDATE (atualiza a senha apenas se uma nova for enviada)
    public int atualizar(String cpf, Participante p) {
        if (p.getSenha() != null && !p.getSenha().isBlank()) {
            String sql = "UPDATE participante SET nome = ?, email_institucional = ?, tipo = ?, senha = ? WHERE cpf = ?";
            String senhaHash = passwordEncoder.encode(p.getSenha());
            return jdbc.update(sql, p.getNome(), p.getEmailInstitucional(), p.getTipo(), senhaHash, cpf);
        }

        String sql = "UPDATE participante SET nome = ?, email_institucional = ?, tipo = ? WHERE cpf = ?";
        return jdbc.update(sql, p.getNome(), p.getEmailInstitucional(), p.getTipo(), cpf);
    }

    // DELETE
    public int deletar(String cpf) {
        String sql = "DELETE FROM participante WHERE cpf = ?";
        return jdbc.update(sql, cpf);
    }
}
