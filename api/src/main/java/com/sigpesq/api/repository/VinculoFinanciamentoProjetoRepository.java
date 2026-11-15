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
        v.setIdVinculoFinanciamento(rs.getInt("id_vinculo_financiamento"));
        v.setIdFinanciamento(rs.getInt("id_financiamento"));
        v.setAgenciaFinanciadora(rs.getString("agencia_financiadora"));
        v.setTipoFomento(rs.getString("tipo_fomento"));
        v.setCodigoProjeto(rs.getString("codigo_projeto"));
        v.setTituloProjeto(rs.getString("titulo_projeto"));
        v.setTipoApoio(rs.getString("tipo_apoio"));
        v.setValorApoio(rs.getBigDecimal("valor_apoio"));
        return v;
    };

    private void validarSaldoDisponivel(int idFinanciamento, Integer idVinculoIgnorar, BigDecimal novoValor) {
        if (novoValor == null) {
            return; // Coluna valor_apoio aceita NULL no banco
        }
        if (novoValor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O valor de apoio deve ser maior que zero.");
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
                "SELECT COALESCE(SUM(valor_apoio), 0) FROM vinculo_financiamento_projeto " +
                "WHERE id_financiamento = ? AND id_vinculo_financiamento <> ?",
                BigDecimal.class,
                idFinanciamento,
                idVinculoIgnorar != null ? idVinculoIgnorar : -1
        );

        if (jaAlocado.add(novoValor).compareTo(valorTotal) > 0) {
            throw new IllegalArgumentException("O valor de apoio excede o saldo disponível do financiamento (Total: R$ " + valorTotal + ").");
        }
    }

    public void salvar(VinculoFinanciamentoProjeto v) {
        validarSaldoDisponivel(v.getIdFinanciamento(), null, v.getValorApoio());

        String sql = "INSERT INTO vinculo_financiamento_projeto (id_financiamento, codigo_projeto, tipo_apoio, valor_apoio) " +
                     "VALUES (?, ?, ?, ?)";
        jdbc.update(sql, v.getIdFinanciamento(), v.getCodigoProjeto(), v.getTipoApoio(), v.getValorApoio());
    }

    public List<VinculoFinanciamentoProjeto> listarTodos() {
        String sql = "SELECT v.*, f.agencia_financiadora, f.tipo_fomento, p.titulo AS titulo_projeto " +
                     "FROM vinculo_financiamento_projeto v " +
                     "INNER JOIN financiamento f ON v.id_financiamento = f.id_financiamento " +
                     "INNER JOIN projeto p ON v.codigo_projeto = p.codigo " +
                     "ORDER BY v.id_vinculo_financiamento DESC";
        return jdbc.query(sql, rowMapper);
    }

    public List<VinculoFinanciamentoProjeto> buscarPorProjeto(String codigoProjeto) {
        String sql = "SELECT v.*, f.agencia_financiadora, f.tipo_fomento, p.titulo AS titulo_projeto " +
                     "FROM vinculo_financiamento_projeto v " +
                     "INNER JOIN financiamento f ON v.id_financiamento = f.id_financiamento " +
                     "INNER JOIN projeto p ON v.codigo_projeto = p.codigo " +
                     "WHERE v.codigo_projeto = ? " +
                     "ORDER BY v.id_vinculo_financiamento DESC";
        return jdbc.query(sql, rowMapper, codigoProjeto);
    }

    public int atualizar(int idVinculo, VinculoFinanciamentoProjeto v) {
        List<Integer> idsFinanciamento = jdbc.query(
                "SELECT id_financiamento FROM vinculo_financiamento_projeto WHERE id_vinculo_financiamento = ?",
                (rs, rowNum) -> rs.getInt("id_financiamento"),
                idVinculo
        );
        if (idsFinanciamento.isEmpty()) {
            return 0;
        }

        validarSaldoDisponivel(idsFinanciamento.get(0), idVinculo, v.getValorApoio());

        String sql = "UPDATE vinculo_financiamento_projeto SET tipo_apoio = ?, valor_apoio = ? " +
                     "WHERE id_vinculo_financiamento = ?";
        return jdbc.update(sql, v.getTipoApoio(), v.getValorApoio(), idVinculo);
    }

    public int deletar(int idVinculo) {
        String sql = "DELETE FROM vinculo_financiamento_projeto WHERE id_vinculo_financiamento = ?";
        return jdbc.update(sql, idVinculo);
    }
}