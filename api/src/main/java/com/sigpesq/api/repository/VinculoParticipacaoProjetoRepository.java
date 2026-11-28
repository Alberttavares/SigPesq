package com.sigpesq.api.repository;

import com.sigpesq.api.model.VinculoParticipacaoProjeto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class VinculoParticipacaoProjetoRepository {

    private final JdbcTemplate jdbc;

    public VinculoParticipacaoProjetoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<VinculoParticipacaoProjeto> rowMapper = (rs, rowNum) -> {
        VinculoParticipacaoProjeto v = new VinculoParticipacaoProjeto();
        v.setCpfParticipante(rs.getString("cpf_participante"));
        v.setNomeParticipante(rs.getString("nome_participante"));
        v.setTipoParticipante(rs.getString("tipo_participante"));
        v.setCodigoProjeto(rs.getString("codigo_projeto"));
        v.setTituloProjeto(rs.getString("titulo_projeto"));
        v.setFuncao(rs.getString("funcao"));
        v.setDataEntrada(rs.getDate("data_entrada") != null ? rs.getDate("data_entrada").toLocalDate() : null);
        v.setDataSaida(rs.getDate("data_saida") != null ? rs.getDate("data_saida").toLocalDate() : null);
        return v;
    };

    // Valida RN02: Se a função for Coordenador, exige que seja Docente e único no projeto
    private void validarRegraCoordenador(String codigoProjeto, String cpfParticipante, String funcao) {
        if (funcao != null && "Coordenador".equalsIgnoreCase(funcao.trim())) {
            String sqlTipo = "SELECT tipo FROM participante WHERE cpf = ?";
            List<String> tipos = jdbc.query(sqlTipo, (rs, rowNum) -> rs.getString("tipo"), cpfParticipante);

            if (tipos.isEmpty()) {
                throw new IllegalArgumentException("Participante não encontrado.");
            }
            if (!"P".equalsIgnoreCase(tipos.get(0))) {
                throw new IllegalArgumentException("Regra RN02: Apenas participantes do tipo 'Docente' (P) podem atuar como coordenadores no projeto.");
            }

            String sqlExisteCoord = "SELECT COUNT(*) FROM vinculo_participacao_projeto " +
                                    "WHERE codigo_projeto = ? AND LOWER(funcao) = 'coordenador' AND cpf_participante <> ?";
            Integer total = jdbc.queryForObject(sqlExisteCoord, Integer.class, codigoProjeto, cpfParticipante);
            if (total != null && total > 0) {
                throw new IllegalArgumentException("Regra RN02: Este projeto já possui um docente como coordenador principal.");
            }
        }
    }

    // CREATE (RF03 / UC05)
    public void salvar(VinculoParticipacaoProjeto v) {
        validarRegraCoordenador(v.getCodigoProjeto(), v.getCpfParticipante(), v.getFuncao());

        String sql = "INSERT INTO vinculo_participacao_projeto (cpf_participante, codigo_projeto, funcao, data_entrada, data_saida) " +
                     "VALUES (?, ?, ?, ?, ?)";
        jdbc.update(sql,
                v.getCpfParticipante(),
                v.getCodigoProjeto(),
                v.getFuncao(),
                v.getDataEntrada(),
                v.getDataSaida());
    }

    // READ - Todos os vínculos (Tela de Vínculos de Participação)
    public List<VinculoParticipacaoProjeto> listarTodos() {
        String sql = "SELECT v.*, pa.nome AS nome_participante, pa.tipo AS tipo_participante, pr.titulo AS titulo_projeto " +
                     "FROM vinculo_participacao_projeto v " +
                     "INNER JOIN participante pa ON v.cpf_participante = pa.cpf " +
                     "INNER JOIN projeto pr ON v.codigo_projeto = pr.codigo " +
                     "ORDER BY v.codigo_projeto, v.data_entrada";
        return jdbc.query(sql, rowMapper);
    }

    // READ - Participantes vinculados a um projeto específico (RF10)
    public List<VinculoParticipacaoProjeto> buscarPorProjeto(String codigoProjeto) {
        String sql = "SELECT v.*, pa.nome AS nome_participante, pa.tipo AS tipo_participante, pr.titulo AS titulo_projeto " +
                     "FROM vinculo_participacao_projeto v " +
                     "INNER JOIN participante pa ON v.cpf_participante = pa.cpf " +
                     "INNER JOIN projeto pr ON v.codigo_projeto = pr.codigo " +
                     "WHERE v.codigo_projeto = ? " +
                     "ORDER BY v.data_entrada";
        return jdbc.query(sql, rowMapper, codigoProjeto);
    }

    // UPDATE (UC05)
    public int atualizar(String codigoProjeto, String cpfParticipante, VinculoParticipacaoProjeto v) {
        validarRegraCoordenador(codigoProjeto, cpfParticipante, v.getFuncao());

        String sql = "UPDATE vinculo_participacao_projeto SET funcao = ?, data_entrada = ?, data_saida = ? " +
                     "WHERE codigo_projeto = ? AND cpf_participante = ?";
        return jdbc.update(sql,
                v.getFuncao(),
                v.getDataEntrada(),
                v.getDataSaida(),
                codigoProjeto,
                cpfParticipante);
    }

    // DELETE (UC05)
    public int deletar(String codigoProjeto, String cpfParticipante) {
        String sql = "DELETE FROM vinculo_participacao_projeto WHERE codigo_projeto = ? AND cpf_participante = ?";
        return jdbc.update(sql, codigoProjeto, cpfParticipante);
    }
}