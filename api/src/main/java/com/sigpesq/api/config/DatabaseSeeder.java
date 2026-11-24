package com.sigpesq.api.config;

import com.sigpesq.api.model.*;
import com.sigpesq.api.repository.*;
import net.datafaker.Faker;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.dao.DuplicateKeyException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final ParticipanteRepository participanteRepo;
    private final ProjetoRepository projetoRepo;
    private final FinanciamentoRepository financiamentoRepo;
    private final ProducaoCientificaRepository producaoRepo;
    private final VinculoParticipacaoProjetoRepository vinculoProjetoRepo;
    private final VinculoFinanciamentoProjetoRepository vinculoFinanciamentoRepo;
    private final VinculoParticipanteProducaoRepository vinculoProducaoRepo;

    public DatabaseSeeder(
            ParticipanteRepository participanteRepo,
            ProjetoRepository projetoRepo,
            FinanciamentoRepository financiamentoRepo,
            ProducaoCientificaRepository producaoRepo,
            VinculoParticipacaoProjetoRepository vinculoProjetoRepo,
            VinculoFinanciamentoProjetoRepository vinculoFinanciamentoRepo,
            VinculoParticipanteProducaoRepository vinculoProducaoRepo) {
        this.participanteRepo = participanteRepo;
        this.projetoRepo = projetoRepo;
        this.financiamentoRepo = financiamentoRepo;
        this.producaoRepo = producaoRepo;
        this.vinculoProjetoRepo = vinculoProjetoRepo;
        this.vinculoFinanciamentoRepo = vinculoFinanciamentoRepo;
        this.vinculoProducaoRepo = vinculoProducaoRepo;
    }

    @Override
    public void run(String... args) {


        Boolean bancoVazio = participanteRepo.listarTodos().isEmpty();

            AdministradorSeeder();

        // 1. Trava de idempotência: evita duplicar registros ao reiniciar o servidor
        if (!bancoVazio) {
            System.out.println("[Seeder] Banco já possui dados. Seeding ignorado.");
            return;
        }

        Faker faker = new Faker(Locale.of("pt", "BR"));
        Random random = new Random();

        List<Participante> docentes = new ArrayList<>();
        List<Participante> todosParticipantes = new ArrayList<>();
        Set<String> cpfsGerados = new HashSet<>();

        // 2. PARTICIPANTES (6 Docentes, 10 Discentes, 4 Técnicos)
        String[] tipos = {
                "Docente", "Docente", "Docente", "Docente", "Docente", "Docente",
                "Discente", "Discente", "Discente", "Discente", "Discente",
                "Discente", "Discente", "Discente", "Discente", "Discente",
                "Tecnico", "Tecnico", "Tecnico", "Tecnico"
        };

        for (int i = 0; i < tipos.length; i++) {
            String cpf;
            do {
                cpf = faker.cpf().valid(false); // 11 dígitos sem pontuação (char(11))
            } while (!cpfsGerados.add(cpf));

            String nome = faker.name().fullName();
            String email = "pesquisador" + (i + 1) + "." + faker.internet().domainWord() + "@ufes.br";

            Participante p = new Participante();
            p.setCpf(cpf);
            p.setNome(nome);
            p.setEmailInstitucional(email.toLowerCase());
            p.setTipo(tipos[i]);
            p.setSenha("senha123"); 

            participanteRepo.salvar(p);
            todosParticipantes.add(p);
            if ("Docente".equals(tipos[i])) {
                docentes.add(p);
            }
        }

        // 3. PROJETOS (8 projetos coordenados exclusivamente por Docentes - RN02)
        String[] situacoes = {"Em andamento", "Concluido", "Cancelado"};
        List<Projeto> projetosSalvos = new ArrayList<>();

        for (int i = 1; i <= 8; i++) {
            Participante coordenador = docentes.get(i % docentes.size());
            String situacao = situacoes[i % situacoes.length];
            LocalDate inicio = LocalDate.now().minusMonths(faker.number().numberBetween(3, 24));
            LocalDate termino = "Em andamento".equals(situacao)
                    ? LocalDate.now().plusMonths(faker.number().numberBetween(6, 18))
                    : inicio.plusMonths(faker.number().numberBetween(6, 14));

            Projeto prj = new Projeto();
            prj.setCodigo(String.format("PRJ-2026-%03d", i));
            prj.setTitulo("Pesquisa em " + faker.educator().course() + " Aplicada");
            prj.setDescricao(faker.lorem().paragraph(2));
            prj.setDataInicio(inicio);
            prj.setDataTermino(termino);
            prj.setSituacao(situacao);
            prj.setCpfCoordenador(coordenador.getCpf());

            projetoRepo.salvar(prj);
            projetosSalvos.add(prj);
        }

        // 4. FINANCIAMENTOS (6 editais/fomentos)
        String[] agencias = {"CNPq", "CAPES", "FAPES", "FINEP"};
        String[] modalidades = {"Auxílio Pesquisa", "Bolsa de Produtividade", "Edital Universal", "Inovação Tecnológica"};

        for (int i = 0; i < 6; i++) {
            LocalDate inicioVigencia = LocalDate.now().minusMonths(faker.number().numberBetween(4, 18));

            Financiamento fin = new Financiamento();
            fin.setAgenciaFinanciadora(agencias[i % agencias.length]);
            fin.setTipoFomento(modalidades[i % modalidades.length]);
            fin.setValorTotal(BigDecimal.valueOf(faker.number().randomDouble(2, 25000, 150000)));
            fin.setDataInicioVigencia(inicioVigencia);
            fin.setDataFimVigencia(inicioVigencia.plusYears(2));

            financiamentoRepo.salvar(fin);
        }
        // Recupera do banco para obter os IDs auto_increment gerados
        List<Financiamento> financiamentosSalvos = financiamentoRepo.listarTodos();

        // 5. PRODUÇÕES CIENTÍFICAS (12 publicações vinculadas aos projetos)
        String[] tiposProducao = {"Artigo", "Capítulo de livro", "Software", "Relatório técnico", "Resumo expandido"};
        String[] eventos = {
                "Simpósio Brasileiro de Redes de Computadores (SBRC)",
                "Congresso da Sociedade Brasileira de Computação (CSBC)",
                "IEEE Latin America Transactions",
                "Revista Brasileira de Computação Aplicada"
        };

        for (int i = 0; i < 12; i++) {
            Projeto prj = projetosSalvos.get(i % projetosSalvos.size());

            ProducaoCientifica pc = new ProducaoCientifica();
            pc.setCodigoProjeto(prj.getCodigo());
            pc.setTitulo(faker.book().title() + ": Uma Abordagem Experimental");
            pc.setTipo(tiposProducao[i % tiposProducao.length]);
            pc.setAnoPublicacao(String.valueOf(faker.number().numberBetween(2023, 2026)));
            pc.setMeioDivulgacao(eventos[i % eventos.length]);

            producaoRepo.salvar(pc);
        }
        // Recupera do banco para obter os IDs auto_increment gerados
        List<ProducaoCientifica> producoesSalvas = producaoRepo.listarTodas();

        // 6. VÍNCULOS DE PARTICIPAÇÃO EM PROJETO
        String[] funcoesEquipe = {"Bolsista IC", "Pesquisador Colaborador", "Mestrando", "Técnico de Apoio"};

        for (Projeto prj : projetosSalvos) {
            Set<String> cpfsNoProjeto = new HashSet<>();

            // 6.1 Vincula obrigatoriamente o Docente coordenador (RN02)
            VinculoParticipacaoProjeto coordVinculo = new VinculoParticipacaoProjeto();
            coordVinculo.setCodigoProjeto(prj.getCodigo());
            coordVinculo.setCpfParticipante(prj.getCpfCoordenador());
            coordVinculo.setFuncao("Coordenador");
            coordVinculo.setDataEntrada(prj.getDataInicio());
            coordVinculo.setDataSaida(null);
            vinculoProjetoRepo.salvar(coordVinculo);
            cpfsNoProjeto.add(prj.getCpfCoordenador());

            // 6.2 Adiciona de 2 a 4 membros extras na equipe
            int qtdMembros = faker.number().numberBetween(2, 5);
            for (int m = 0; m < qtdMembros; m++) {
                Participante membro = todosParticipantes.get(random.nextInt(todosParticipantes.size()));
                if (cpfsNoProjeto.add(membro.getCpf())) {
                    VinculoParticipacaoProjeto v = new VinculoParticipacaoProjeto();
                    v.setCodigoProjeto(prj.getCodigo());
                    v.setCpfParticipante(membro.getCpf());
                    v.setFuncao(funcoesEquipe[random.nextInt(funcoesEquipe.length)]);
                    v.setDataEntrada(prj.getDataInicio().plusDays(faker.number().numberBetween(5, 45)));
                    v.setDataSaida(null);
                    vinculoProjetoRepo.salvar(v);
                }
            }
        }

        // 7. VÍNCULOS DE FINANCIAMENTO POR PROJETO (respeitando saldo disponível)
        for (int i = 0; i < financiamentosSalvos.size(); i++) {
            Financiamento fin = financiamentosSalvos.get(i);
            Projeto prj = projetosSalvos.get(i % projetosSalvos.size());

            boolean apoioTotal = (i % 2 == 0);
            BigDecimal valorApoio = apoioTotal
                    ? fin.getValorTotal()
                    : fin.getValorTotal().multiply(BigDecimal.valueOf(0.5)).setScale(2, RoundingMode.HALF_UP);

            VinculoFinanciamentoProjeto vf = new VinculoFinanciamentoProjeto();
            vf.setIdFinanciamento(fin.getIdFinanciamento());
            vf.setCodigoProjeto(prj.getCodigo());
            vf.setTipoApoio(apoioTotal ? "Total" : "Parcial");
            vf.setValorApoio(valorApoio);

            vinculoFinanciamentoRepo.salvar(vf);
        }

        // 8. VÍNCULOS DE AUTORIA DAS PRODUÇÕES CIENTÍFICAS
        String[] papeisAutoria = {"Autor Principal", "Coautor", "Orientador"};

        for (ProducaoCientifica pc : producoesSalvas) {
            Set<String> autoresDaProducao = new HashSet<>();
            int qtdAutores = faker.number().numberBetween(2, 4);

            for (int a = 0; a < qtdAutores; a++) {
                Participante autor = todosParticipantes.get(random.nextInt(todosParticipantes.size()));
                if (autoresDaProducao.add(autor.getCpf())) {
                    VinculoParticipanteProducao vp = new VinculoParticipanteProducao();
                    vp.setIdProducao(pc.getIdProducao());
                    vp.setCpfParticipante(autor.getCpf());
                    vp.setTipoParticipacao(a == 0 ? "Autor Principal" : papeisAutoria[1 + random.nextInt(2)]);
                    vp.setDataInicio(LocalDate.now().minusMonths(6));
                    vp.setDataTermino(null);
                    vinculoProducaoRepo.salvar(vp);
                }
            }
        }
        System.out.println("[Seeder] Base populada com sucesso!");
     
        
    }
    
    private void AdministradorSeeder() {
        Participante existente = participanteRepo.buscarPorCpf("00000000000");

        Participante admin = new Participante();
        admin.setCpf("00000000000");
        admin.setNome("Administrador SIGPESQ");
        admin.setEmailInstitucional("admin@ufes.br");
        admin.setTipo("Administrador");
        admin.setSenha("adminadmin");

        try {
            if (existente == null) {
                participanteRepo.salvar(admin);
                System.out.println("[Seeder] Administrador padrão criado: admin@ufes.br");
            } else if (!"Administrador".equals(existente.getTipo())) {
                participanteRepo.atualizar("00000000000", admin);
                System.out.println("[Seeder] Participante 00000000000 promovido a Administrador.");
            }
        } catch (DuplicateKeyException e) {
            System.out.println("[Seeder] Não foi possível criar o admin padrão: e-mail admin@ufes.br já está em uso por outro CPF.");
        }
    }
}