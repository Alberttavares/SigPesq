package com.sigpesq.api.repository;

import com.sigpesq.api.model.Projeto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ProjetoRepository {

    private final JdbcTemplate jdbc;

    public ProjetoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }


    private String limparCpf(String cpf) {
        return cpf == null ? null : cpf.replaceAll("\\D", "");
    }

    private final RowMapper<Projeto> rowMapper = (rs, rowNum) -> {
        Projeto p = new Projeto();
        p.setCodigo(rs.getString("codigo"));
        p.setTitulo(rs.getString("titulo"));
        p.setDescricao(rs.getString("descricao"));
        p.setDataInicio(rs.getDate("data_inicio") != null ? rs.getDate("data_inicio").toLocalDate() : null);
        p.setDataTermino(rs.getDate("data_termino") != null ? rs.getDate("data_termino").toLocalDate() : null);
        p.setSituacao(rs.getString("situacao"));
        p.setCpfCoordenador(rs.getString("cpf_coordenador"));
        p.setNomeCoordenador(rs.getString("nome_coordenador"));
        return p;
    };

    // Valida RN02: O coordenador deve existir e ser obrigatoriamente um Docente
    private void validarCoordenadorDocente(String cpfCoordenador) {
        String sql = "SELECT tipo FROM participante WHERE cpf = ?";
        List<String> resultados = jdbc.query(sql, (rs, rowNum) -> rs.getString("tipo"), cpfCoordenador);

        if (resultados.isEmpty()) {
            throw new IllegalArgumentException("Nenhum participante encontrado com o CPF de coordenador informado.");
        }
        String tipo = resultados.get(0);
        if (!"P".equals(tipo)) {
            throw new IllegalArgumentException("Regra RN02: Apenas participantes do tipo 'Docente' (P) podem coordenar projetos.");
        }
    }

   // CREATE (RF01 / UC01)
    public void salvar(Projeto p) {
        String cpfLimpo = limparCpf(p.getCpfCoordenador());
        validarCoordenadorDocente(cpfLimpo);

        String sql = "INSERT INTO projeto (codigo, titulo, descricao, data_inicio, data_termino, situacao, cpf_coordenador) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?)";
        jdbc.update(sql,
                p.getCodigo(),
                p.getTitulo(),
                p.getDescricao(),
                p.getDataInicio(),
                p.getDataTermino(),
                p.getSituacao(),
                cpfLimpo);
    }

    // READ - Todos (RF01)
    public List<Projeto> listarTodos() {
        String sql = "SELECT pr.*, pa.nome AS nome_coordenador " +
                     "FROM projeto pr " +
                     "INNER JOIN participante pa ON pr.cpf_coordenador = pa.cpf " +
                     "ORDER BY pr.data_inicio DESC";
        return jdbc.query(sql, rowMapper);
    }

    // READ - Por Código (RF01)
    public Projeto buscarPorCodigo(String codigo) {
        String sql = "SELECT pr.*, pa.nome AS nome_coordenador " +
                     "FROM projeto pr " +
                     "INNER JOIN participante pa ON pr.cpf_coordenador = pa.cpf " +
                     "WHERE pr.codigo = ?";
        List<Projeto> lista = jdbc.query(sql, rowMapper, codigo);
        return lista.isEmpty() ? null : lista.get(0);
    }

 // READ - Projetos coordenados por um docente específico (RF09)
    public List<Projeto> buscarPorCoordenador(String cpfCoordenador) {
        String sql = "SELECT pr.*, pa.nome AS nome_coordenador " +
                     "FROM projeto pr " +
                     "INNER JOIN participante pa ON pr.cpf_coordenador = pa.cpf " +
                     "WHERE pr.cpf_coordenador = ? " +
                     "ORDER BY pr.data_inicio DESC";
        return jdbc.query(sql, rowMapper, limparCpf(cpfCoordenador));
    }

    // UPDATE (RF01 / UC01)
    public int atualizar(String codigo, Projeto p) {
        String cpfLimpo = limparCpf(p.getCpfCoordenador());
        validarCoordenadorDocente(cpfLimpo);

        String sql = "UPDATE projeto SET titulo = ?, descricao = ?, data_inicio = ?, data_termino = ?, " +
                     "situacao = ?, cpf_coordenador = ? WHERE codigo = ?";
        return jdbc.update(sql,
                p.getTitulo(),
                p.getDescricao(),
                p.getDataInicio(),
                p.getDataTermino(),
                p.getSituacao(),
                cpfLimpo,
                codigo);
    }

    // DELETE (RF01 / UC01)
    public int deletar(String codigo) {
        String sql = "DELETE FROM projeto WHERE codigo = ?";
        return jdbc.update(sql, codigo);
    }
}