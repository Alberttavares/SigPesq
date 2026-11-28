package com.sigpesq.api.repository;

import com.sigpesq.api.model.Financiamento;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public class FinanciamentoRepository {

    private final JdbcTemplate jdbc;

    public FinanciamentoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Financiamento> rowMapper = (rs, rowNum) -> {
        Financiamento f = new Financiamento();
        f.setIdFinanciamento(rs.getInt("id_financiamento"));
        f.setAgenciaFinanciadora(rs.getString("agencia_financiadora"));
        f.setTipoFomento(rs.getString("tipo_fomento"));
        f.setValorTotal(rs.getBigDecimal("valor_total"));
        f.setDataInicioVigencia(rs.getDate("data_inicio_vigencia") != null ? rs.getDate("data_inicio_vigencia").toLocalDate() : null);
        f.setDataFimVigencia(rs.getDate("data_fim_vigencia") != null ? rs.getDate("data_fim_vigencia").toLocalDate() : null);
        return f;
    };

     @Transactional
    public Financiamento salvar(Financiamento f) {
        Integer proximoId = jdbc.queryForObject(
                "SELECT COALESCE(MAX(id_financiamento), 0) + 1 FROM financiamento",
                Integer.class
        );

        String sql = "INSERT INTO financiamento (id_financiamento, agencia_financiadora, tipo_fomento, valor_total, data_inicio_vigencia, data_fim_vigencia) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";

        jdbc.update(sql,
                proximoId,
                f.getAgenciaFinanciadora(),
                f.getTipoFomento(),
                f.getValorTotal(),
                f.getDataInicioVigencia(),
                f.getDataFimVigencia()
        );

        f.setIdFinanciamento(proximoId);
        return f;
    }

    // READ - Todos (RF04)
    public List<Financiamento> listarTodos() {
        String sql = "SELECT id_financiamento, agencia_financiadora, tipo_fomento, valor_total, " +
                     "data_inicio_vigencia, data_fim_vigencia FROM financiamento ORDER BY id_financiamento DESC";
        return jdbc.query(sql, rowMapper);
    }

    // READ - Por ID (RF04)
    public Financiamento buscarPorId(int id) {
        String sql = "SELECT id_financiamento, agencia_financiadora, tipo_fomento, valor_total, " +
                     "data_inicio_vigencia, data_fim_vigencia FROM financiamento WHERE id_financiamento = ?";
        List<Financiamento> lista = jdbc.query(sql, rowMapper, id);
        return lista.isEmpty() ? null : lista.get(0);
    }

    // UPDATE (RF04 / UC04)
    public int atualizar(int id, Financiamento f) {
        String sql = "UPDATE financiamento SET agencia_financiadora = ?, tipo_fomento = ?, valor_total = ?, " +
                     "data_inicio_vigencia = ?, data_fim_vigencia = ? WHERE id_financiamento = ?";
        return jdbc.update(sql,
                f.getAgenciaFinanciadora(),
                f.getTipoFomento(),
                f.getValorTotal(),
                f.getDataInicioVigencia(),
                f.getDataFimVigencia(),
                id);
    }

    // DELETE (RF04 / UC04)
    public int deletar(int id) {
        String sql = "DELETE FROM financiamento WHERE id_financiamento = ?";
        return jdbc.update(sql, id);
    }
}