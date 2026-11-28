package com.sigpesq.api.config;

import com.sigpesq.api.model.*;
import com.sigpesq.api.repository.*;
import net.datafaker.Faker;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

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
    private final VinculoParticipacaoProjetoRepository vinculoParticipacaoRepo;
    private final VinculoFinanciamentoProjetoRepository vinculoFinanciamentoRepo;
    private final VinculoParticipanteProducaoRepository vinculoProducaoRepo;

    public DatabaseSeeder(
            ParticipanteRepository participanteRepo,
            ProjetoRepository projetoRepo,
            FinanciamentoRepository financiamentoRepo,
            ProducaoCientificaRepository producaoRepo,
            VinculoParticipacaoProjetoRepository vinculoParticipacaoRepo,
            VinculoFinanciamentoProjetoRepository vinculoFinanciamentoRepo,
            VinculoParticipanteProducaoRepository vinculoProducaoRepo
    ) {
        this.participanteRepo = participanteRepo;
        this.projetoRepo = projetoRepo;
        this.financiamentoRepo = financiamentoRepo;
        this.producaoRepo = producaoRepo;
        this.vinculoParticipacaoRepo = vinculoParticipacaoRepo;
        this.vinculoFinanciamentoRepo = vinculoFinanciamentoRepo;
        this.vinculoProducaoRepo = vinculoProducaoRepo;
    }

    @Override
    public void run(String... args) {
        seedAdministrador();

        // Evita duplicar massa de teste ao reiniciar a aplicação
        if (participanteRepo.listarTodos().size() > 1) {
            return;
        }

        Faker faker = new Faker(Locale.of("pt", "BR"));
        Random random = new Random();

        List<Participante> participantes = seedParticipantes(faker, random);
        List<Projeto> projetos = seedProjetos(faker, random, participantes);
        List<Financiamento> financiamentos = seedFinanciamentos(faker, random);
        List<ProducaoCientifica> producoes = seedProducoes(faker, random, projetos);

        seedVinculosParticipacao(faker, random, participantes, projetos);
        seedVinculosFinanciamento(random, financiamentos, projetos);
        seedVinculosProducao(faker, random, participantes, producoes);

        System.out.println("[Seeder] Carga inicial concluída com sucesso.");
    }

    private void seedAdministrador() {
        String cpfAdmin = "11144477735"; // CPF válido pelo Módulo 11 (11 dígitos)
        Participante existente = participanteRepo.buscarPorCpf(cpfAdmin);

        Participante admin = new Participante();
        admin.setCpf(cpfAdmin);
        admin.setNome("Administrador SIGPESQ");
        admin.setEmailInstitucional("admin@ufes.br");
        admin.setTipo("D"); // D = Administrador
        admin.setSenha("adminadmin");

        if (existente == null) {
            participanteRepo.salvar(admin);
            System.out.println("[Seeder] Administrador criado: CPF " + cpfAdmin);
        } else if (!"D".equals(existente.getTipo())) {
            participanteRepo.atualizar(cpfAdmin, admin);
        }
    }

    private List<Participante> seedParticipantes(Faker faker, Random random) {
        List<Participante> criados = new ArrayList<>();
        Set<String> cpfsUsados = new HashSet<>();
        cpfsUsados.add("11144477735");

        // P = Docente, A = Discente, T = Técnico
        String[] tipos = {"P", "A", "T"};

        for (int i = 1; i <= 20; i++) {
            String cpf;
            do {
                cpf = faker.cpf().valid(false).replaceAll("\\D", "");
            } while (cpf.length() != 11 || !cpfsUsados.add(cpf));

            // Garante pelo menos 6 Docentes ("P") para coordenar os projetos (RN02)
            String tipo = (i <= 6) ? "P" : tipos[random.nextInt(tipos.length)];

            Participante p = new Participante();
            p.setCpf(cpf);
            p.setNome(faker.name().fullName());
            p.setEmailInstitucional("pesquisador" + i + "@ufes.br");
            p.setTipo(tipo);
            p.setSenha("password");

            participanteRepo.salvar(p);
            criados.add(p);
        }

        return criados;
    }

    private List<Projeto> seedProjetos(Faker faker, Random random, List<Participante> participantes) {
        List<Projeto> projetos = new ArrayList<>();
        List<Participante> docentes = participantes.stream()
                .filter(p -> "P".equals(p.getTipo()))
                .toList();

        // E = Em andamento, C = Concluído, K = Cancelado
        String[] situacoes = {"E", "C", "K"};

        for (int i = 1; i <= 8; i++) {
            Participante coordenador = docentes.get(random.nextInt(docentes.size()));
            LocalDate inicio = LocalDate.now().minusMonths(random.nextInt(18) + 1);
            LocalDate termino = inicio.plusMonths(random.nextInt(18) + 6);

            Projeto proj = new Projeto();
            proj.setCodigo(String.format("PRJ-2026-%03d", i));
            proj.setTitulo("Pesquisa em " + faker.educator().course());
            proj.setDescricao(faker.lorem().paragraph(2));
            proj.setDataInicio(inicio);
            proj.setDataTermino(termino);
            proj.setSituacao(situacoes[random.nextInt(situacoes.length)]);
            proj.setCpfCoordenador(coordenador.getCpf());

            projetoRepo.salvar(proj);
            projetos.add(proj);
        }

        return projetos;
    }

    private List<Financiamento> seedFinanciamentos(Faker faker, Random random) {
        List<Financiamento> lista = new ArrayList<>();
        String[] agencias = {"FAPES", "CNPq", "CAPES", "FINEP"};
        String[] fomentos = {"Edital Universal", "Bolsa de Iniciação Científica", "Auxílio Pesquisa", "Inovação Tecnológica"};

        for (int i = 1; i <= 5; i++) {
            LocalDate inicio = LocalDate.now().minusMonths(random.nextInt(12) + 2);
            LocalDate fim = inicio.plusYears(2);
            BigDecimal valor = BigDecimal.valueOf(15000 + random.nextInt(85000))
                    .setScale(2, RoundingMode.HALF_UP);

            Financiamento f = new Financiamento();
            f.setAgenciaFinanciadora(agencias[random.nextInt(agencias.length)]);
            f.setTipoFomento(fomentos[random.nextInt(fomentos.length)] + " #" + i);
            f.setValorTotal(valor);
            f.setDataInicioVigencia(inicio);
            f.setDataFimVigencia(fim);

            // O repositório deve preencher f.setIdFinanciamento(proximoId) via COALESCE(MAX(...), 0) + 1
            financiamentoRepo.salvar(f);
            lista.add(f);
        }

        return lista;
    }

    private List<ProducaoCientifica> seedProducoes(Faker faker, Random random, List<Projeto> projetos) {
        List<ProducaoCientifica> producoes = new ArrayList<>();
        // producao_cientifica.tipo permanece VARCHAR(255) no sigpesq.sql
        String[] tiposProducao = {"Artigo em Periódico", "Trabalho em Evento", "Capítulo de Livro", "Software Registrado"};
        String[] meios = {"IEEE Access", "SBC - Simpósio Brasileiro", "Revista Brasileira de Computação", "INPI"};

        for (int i = 1; i <= 12; i++) {
            Projeto projeto = projetos.get(random.nextInt(projetos.size()));

            ProducaoCientifica prod = new ProducaoCientifica();
            prod.setCodigoProjeto(projeto.getCodigo());
            prod.setTitulo(faker.book().title() + " - Estudo Aplicado " + i);
            prod.setTipo(tiposProducao[random.nextInt(tiposProducao.length)]);
            prod.setAnoPublicacao(String.valueOf(2024 + random.nextInt(3)));
            prod.setMeioDivulgacao(meios[random.nextInt(meios.length)]);

            // O repositório deve preencher prod.setIdProducao(proximoId)
            producaoRepo.salvar(prod);
            producoes.add(prod);
        }

        return producoes;
    }

    private void seedVinculosParticipacao(Faker faker, Random random, List<Participante> participantes, List<Projeto> projetos) {
        // vinculo_participacao_projeto.funcao permanece VARCHAR(255) no sigpesq.sql
        String[] funcoes = {"Pesquisador", "Bolsista IC", "Voluntário", "Apoio Técnico"};
        Set<String> chavesUsadas = new HashSet<>();

        for (Projeto projeto : projetos) {
            int qtdMembros = 2 + random.nextInt(3);
            for (int m = 0; m < qtdMembros; m++) {
                Participante p = participantes.get(random.nextInt(participantes.size()));
                String chave = p.getCpf() + "|" + projeto.getCodigo();

                if (p.getCpf().equals(projeto.getCpfCoordenador()) || !chavesUsadas.add(chave)) {
                    continue;
                }

                VinculoParticipacaoProjeto v = new VinculoParticipacaoProjeto();
                v.setCpfParticipante(p.getCpf());
                v.setCodigoProjeto(projeto.getCodigo());
                v.setFuncao(funcoes[random.nextInt(funcoes.length)]);
                v.setDataEntrada(projeto.getDataInicio());
                v.setDataSaida(null);

                vinculoParticipacaoRepo.salvar(v);
            }
        }
    }

    private void seedVinculosFinanciamento(Random random, List<Financiamento> financiamentos, List<Projeto> projetos) {
        // T = Total, P = Parcial
        String[] tiposApoio = {"T", "P"};

        for (Projeto projeto : projetos) {
            Financiamento fin = financiamentos.get(random.nextInt(financiamentos.size()));
            BigDecimal valorApoio = BigDecimal.valueOf(5000 + random.nextInt(15000))
                    .setScale(2, RoundingMode.HALF_UP);

            VinculoFinanciamentoProjeto vf = new VinculoFinanciamentoProjeto();
            vf.setIdFinanciamento(fin.getIdFinanciamento());
            vf.setCodigoProjeto(projeto.getCodigo());
            vf.setTipoApoio(tiposApoio[random.nextInt(tiposApoio.length)]);
            vf.setValorApoio(valorApoio);

            vinculoFinanciamentoRepo.salvar(vf);
        }
    }

    private void seedVinculosProducao(Faker faker, Random random, List<Participante> participantes, List<ProducaoCientifica> producoes) {
        // vinculo_participante_producao.tipo_participacao permanece VARCHAR(255) no sigpesq.sql
        String[] papeis = {"Autor Principal", "Coautor", "Orientador"};
        Set<String> chavesUsadas = new HashSet<>();

        for (ProducaoCientifica prod : producoes) {

            int ano = prod.getAnoPublicacao() != null ? Integer.parseInt(prod.getAnoPublicacao()) : 2026;
            int qtdAutores = 1 + random.nextInt(3);
            for (int a = 0; a < qtdAutores; a++) {
                Participante p = participantes.get(random.nextInt(participantes.size()));
                String chave = p.getCpf() + "|" + prod.getIdProducao();

                if (!chavesUsadas.add(chave)) {
                    continue;
                }

                LocalDate inicio = LocalDate.of(ano, 1, 15);
                LocalDate termino = inicio.plusMonths(4);

                VinculoParticipanteProducao vp = new VinculoParticipanteProducao();
                vp.setIdProducao(prod.getIdProducao());
                vp.setCpfParticipante(p.getCpf());
                vp.setTipoParticipacao(papeis[random.nextInt(papeis.length)]);
                vp.setDataInicio(inicio);
                vp.setDataTermino(termino);

                vinculoProducaoRepo.salvar(vp);
            }
        }
    }
}