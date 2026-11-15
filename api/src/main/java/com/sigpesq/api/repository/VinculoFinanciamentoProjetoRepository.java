package com.sigpesq.api.repository;

import com.sigpesq.api.model.VinculoFinanciamentoProjeto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public class VinculoFinanciamentoProjetoRepository {

    private final JdbcTemplate jdbc;

    public VinculoFinanciamentoProjetoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<VinculoFinanciamentoProjeto> rowMapper = (rs, rowNum) -> {
        VinculoFinanciamentoProjeto v = new VinculoFinanciamentoProjeto();
        v.setIdFinanciamento(rs.getInt("id_financiamento"));
        v.setAgenciaFinanciadora(rs.getString("agencia_financiadora"));
        v.setTipoFomento(rs.getString("tipo_fomento"));
        v.setCodigoProjeto(rs.getString("codigo_projeto"));
        v.setTituloProjeto(rs.getString("titulo_projeto"));
        v.setValorAlocado(rs.getBigDecimal("valor_alocado"));
        return v;
    };

    private void validarSaldoDisponivel(int idFinanciamento, String codigoProjetoIgnorar, BigDecimal novoValor) {
        if (novoValor == null || novoValor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O valor alocado deve ser maior que zero.");
        }

        List<BigDecimal> totais = jdbc.query(
                "SELECT valor_total FROM financiamento WHERE id_financiamento = ?",
                (rs, rowNum) -> rs.getBigDecimal("valor_total"),
                idFinanciamento
        );

        if (totais.isEmpty()) {
            throw new IllegalArgumentException("Financiamento não encontrado.");
        }

        BigDecimal valorTotal = totais.get(0);
        BigDecimal jaAlocado = jdbc.queryForObject(
                "SELECT COALESCE(SUM(valor_alocado), 0) FROM vinculo_financiamento_projeto " +
                "WHERE id_financiamento = ? AND codigo_projeto <> ?",
                BigDecimal.class,
                idFinanciamento,
                codigoProjetoIgnorar != null ? codigoProjetoIgnorar : ""
        );

        if (jaAlocado.add(novoValor).compareTo(valorTotal) > 0) {
            throw new IllegalArgumentException("O valor alocado excede o saldo disponível do financiamento (Total: R$ " + valorTotal + ").");
        }
    }

    public void salvar(VinculoFinanciamentoProjeto v) {
        validarSaldoDisponivel(v.getIdFinanciamento(), null, v.getValorAlocado());

        String sql = "INSERT INTO vinculo_financiamento_projeto (id_financiamento, codigo_projeto, valor_alocado) " +
                     "VALUES (?, ?, ?)";
        jdbc.update(sql, v.getIdFinanciamento(), v.getCodigoProjeto(), v.getValorAlocado());
    }

    public List<VinculoFinanciamentoProjeto> listarTodos() {
        String sql = "SELECT v.*, f.agencia_financiadora, f.tipo_fomento, p.titulo AS titulo_projeto " +
                     "FROM vinculo_financiamento_projeto v " +
                     "INNER JOIN financiamento f ON v.id_financiamento = f.id_financiamento " +
                     "INNER JOIN projeto p ON v.codigo_projeto = p.codigo " +
                     "ORDER BY v.id_financiamento DESC";
        return jdbc.query(sql, rowMapper);
    }

    public List<VinculoFinanciamentoProjeto> buscarPorProjeto(String codigoProjeto) {
        String sql = "SELECT v.*, f.agencia_financiadora, f.tipo_fomento, p.titulo AS titulo_projeto " +
                     "FROM vinculo_financiamento_projeto v " +
                     "INNER JOIN financiamento f ON v.id_financiamento = f.id_financiamento " +
                     "INNER JOIN projeto p ON v.codigo_projeto = p.codigo " +
                     "WHERE v.codigo_projeto = ?";
        return jdbc.query(sql, rowMapper, codigoProjeto);
    }

    public int atualizar(int idFinanciamento, String codigoProjeto, VinculoFinanciamentoProjeto v) {
        validarSaldoDisponivel(idFinanciamento, codigoProjeto, v.getValorAlocado());

        String sql = "UPDATE vinculo_financiamento_projeto SET valor_alocado = ? " +
                     "WHERE id_financiamento = ? AND codigo_projeto = ?";
        return jdbc.update(sql, v.getValorAlocado(), idFinanciamento, codigoProjeto);
    }

    public int deletar(int idFinanciamento, String codigoProjeto) {
        String sql = "DELETE FROM vinculo_financiamento_projeto WHERE id_financiamento = ? AND codigo_projeto = ?";
        return jdbc.update(sql, idFinanciamento, codigoProjeto);
    }
}