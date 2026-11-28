package com.sigpesq.api.repository;

import com.sigpesq.api.model.ProducaoCientifica;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public class ProducaoCientificaRepository {

    private final JdbcTemplate jdbc;

    public ProducaoCientificaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<ProducaoCientifica> rowMapper = (rs, rowNum) -> {
        ProducaoCientifica pc = new ProducaoCientifica();
        pc.setIdProducao(rs.getInt("id_producao"));
        pc.setCodigoProjeto(rs.getString("codigo_projeto"));
        pc.setTituloProjeto(rs.getString("titulo_projeto"));
        pc.setTitulo(rs.getString("titulo"));
        pc.setTipo(rs.getString("tipo"));
        pc.setAnoPublicacao(rs.getString("ano_publicacao"));
        pc.setMeioDivulgacao(rs.getString("meio_divulgacao"));
        return pc;
    };

  @Transactional
    public void salvar(ProducaoCientifica p) {
    Integer proximoId = jdbc.queryForObject(
            "SELECT COALESCE(MAX(id_producao), 0) + 1 FROM producao_cientifica",
            Integer.class
    );

    String sql = "INSERT INTO producao_cientifica (id_producao, codigo_projeto, titulo, tipo, ano_publicacao, meio_divulgacao) " +
                 "VALUES (?, ?, ?, ?, ?, ?)";

    jdbc.update(sql,
            proximoId,
            p.getCodigoProjeto(),
            p.getTitulo(),
            p.getTipo(),
            p.getAnoPublicacao(),
            p.getMeioDivulgacao()
    );

    p.setIdProducao(proximoId);
}

    // READ - Todas (RF06)
    public List<ProducaoCientifica> listarTodas() {
        String sql = "SELECT pc.*, pr.titulo AS titulo_projeto " +
                     "FROM producao_cientifica pc " +
                     "INNER JOIN projeto pr ON pc.codigo_projeto = pr.codigo " +
                     "ORDER BY pc.id_producao DESC";
        return jdbc.query(sql, rowMapper);
    }

    // READ - Por ID (RF06)
    public ProducaoCientifica buscarPorId(int id) {
        String sql = "SELECT pc.*, pr.titulo AS titulo_projeto " +
                     "FROM producao_cientifica pc " +
                     "INNER JOIN projeto pr ON pc.codigo_projeto = pr.codigo " +
                     "WHERE pc.id_producao = ?";
        List<ProducaoCientifica> lista = jdbc.query(sql, rowMapper, id);
        return lista.isEmpty() ? null : lista.get(0);
    }

    // READ - Produções vinculadas a um projeto específico (RF07)
    public List<ProducaoCientifica> buscarPorProjeto(String codigoProjeto) {
        String sql = "SELECT pc.*, pr.titulo AS titulo_projeto " +
                     "FROM producao_cientifica pc " +
                     "INNER JOIN projeto pr ON pc.codigo_projeto = pr.codigo " +
                     "WHERE pc.codigo_projeto = ? " +
                     "ORDER BY pc.ano_publicacao DESC";
        return jdbc.query(sql, rowMapper, codigoProjeto);
    }

    // UPDATE (RF06 / UC03)
    public int atualizar(int id, ProducaoCientifica pc) {
        String sql = "UPDATE producao_cientifica SET codigo_projeto = ?, titulo = ?, tipo = ?, " +
                     "ano_publicacao = ?, meio_divulgacao = ? WHERE id_producao = ?";
        return jdbc.update(sql,
                pc.getCodigoProjeto(),
                pc.getTitulo(),
                pc.getTipo(),
                pc.getAnoPublicacao(),
                pc.getMeioDivulgacao(),
                id);
    }

    // DELETE (RF06 / UC03)
    public int deletar(int id) {
        String sql = "DELETE FROM producao_cientifica WHERE id_producao = ?";
        return jdbc.update(sql, id);
    }
}