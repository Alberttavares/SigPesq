package com.sigpesq.api.repository;

import com.sigpesq.api.model.VinculoParticipanteProducao;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class VinculoParticipanteProducaoRepository {

    private final JdbcTemplate jdbc;

    public VinculoParticipanteProducaoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<VinculoParticipanteProducao> rowMapper = (rs, rowNum) -> {
        VinculoParticipanteProducao v = new VinculoParticipanteProducao();
        v.setIdProducao(rs.getInt("id_producao"));
        v.setTituloProducao(rs.getString("titulo_producao"));
        v.setCpfParticipante(rs.getString("cpf_participante"));
        v.setNomeParticipante(rs.getString("nome_participante"));
        v.setTipoParticipante(rs.getString("tipo_participante"));
        v.setTipoParticipacao(rs.getString("tipo_participacao"));
        v.setDataInicio(rs.getDate("data_inicio") != null ? rs.getDate("data_inicio").toLocalDate() : null);
        v.setDataTermino(rs.getDate("data_termino") != null ? rs.getDate("data_termino").toLocalDate() : null);
        return v;
    };

    public void salvar(VinculoParticipanteProducao v) {
        String sql = "INSERT INTO vinculo_participante_producao " +
                     "(id_producao, cpf_participante, tipo_participacao, data_inicio, data_termino) " +
                     "VALUES (?, ?, ?, ?, ?)";
        jdbc.update(sql,
                v.getIdProducao(),
                v.getCpfParticipante(),
                v.getTipoParticipacao(),
                v.getDataInicio(),
                v.getDataTermino());
    }

    public List<VinculoParticipanteProducao> listarTodos() {
        String sql = "SELECT v.*, pa.nome AS nome_participante, pa.tipo AS tipo_participante, pc.titulo AS titulo_producao " +
                     "FROM vinculo_participante_producao v " +
                     "INNER JOIN participante pa ON v.cpf_participante = pa.cpf " +
                     "INNER JOIN producao_cientifica pc ON v.id_producao = pc.id_producao " +
                     "ORDER BY v.id_producao DESC";
        return jdbc.query(sql, rowMapper);
    }

    public List<VinculoParticipanteProducao> buscarPorProducao(int idProducao) {
        String sql = "SELECT v.*, pa.nome AS nome_participante, pa.tipo AS tipo_participante, pc.titulo AS titulo_producao " +
                     "FROM vinculo_participante_producao v " +
                     "INNER JOIN participante pa ON v.cpf_participante = pa.cpf " +
                     "INNER JOIN producao_cientifica pc ON v.id_producao = pc.id_producao " +
                     "WHERE v.id_producao = ?";
        return jdbc.query(sql, rowMapper, idProducao);
    }

    public List<VinculoParticipanteProducao> buscarPorParticipante(String cpfParticipante) {
        String sql = "SELECT v.*, pa.nome AS nome_participante, pa.tipo AS tipo_participante, pc.titulo AS titulo_producao " +
                     "FROM vinculo_participante_producao v " +
                     "INNER JOIN participante pa ON v.cpf_participante = pa.cpf " +
                     "INNER JOIN producao_cientifica pc ON v.id_producao = pc.id_producao " +
                     "WHERE v.cpf_participante = ?";
        return jdbc.query(sql, rowMapper, cpfParticipante);
    }

    public int atualizar(String cpfParticipante, int idProducao, VinculoParticipanteProducao v) {
        String sql = "UPDATE vinculo_participante_producao " +
                     "SET tipo_participacao = ?, data_inicio = ?, data_termino = ? " +
                     "WHERE cpf_participante = ? AND id_producao = ?";
        return jdbc.update(sql,
                v.getTipoParticipacao(),
                v.getDataInicio(),
                v.getDataTermino(),
                cpfParticipante,
                idProducao);
    }

    public int deletar(String cpfParticipante, int idProducao) {
        String sql = "DELETE FROM vinculo_participante_producao WHERE cpf_participante = ? AND id_producao = ?";
        return jdbc.update(sql, cpfParticipante, idProducao);
    }
}