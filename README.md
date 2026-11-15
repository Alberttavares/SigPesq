# SigPesq
# SIGPESQ — Backend API

API RESTful do **Sistema de Gestão de Pesquisa Acadêmica (SIGPESQ)**, desenvolvida em **Java 21** e **Spring Boot**, utilizando **Spring JDBC (`JdbcTemplate`)** com consultas SQL nativas (sem camadas ORM) sobre banco de dados relacional **MySQL / MariaDB**.

---

## Tecnologias Utilizadas

* **Linguagem:** Java 21
* **Framework:** Spring Boot (Web + JDBC)
* **Gerenciador de Dependências:** Maven (`./mvnw`)
* **Banco de Dados:** MySQL 8+ / MariaDB
* **Acesso a Dados:** SQL puro via `JdbcTemplate` e `RowMapper`

---

## Pré-requisitos

Antes de iniciar a aplicação, certifique-se de ter instalado no ambiente:

1. **JDK 21** ou superior (`java -version`)
2. **Servidor MySQL ou MariaDB** ativo na porta `3306`
3. **cURL** (opcional, para execução dos testes de API via terminal)

---

## Configuração do Banco de Dados

1. Crie o banco de dados `sigpesq` e execute o script DDL contendo as 7 tabelas do sistema:
   * `participante`
   * `projeto`
   * `producao_cientifica`
   * `financiamento`
   * `vinculo_participacao_projeto`
   * `vinculo_financiamento_projeto`
   * `vinculo_participante_producao`

2. Verifique as credenciais de conexão no arquivo `src/main/resources/application.properties`:

```properties
spring.application.name=sigpesq-api
server.port=8080

spring.datasource.url=jdbc:mysql://localhost:3306/sigpesq?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&yearIsDateType=false
spring.datasource.username=root
spring.datasource.password=SUA_SENHA_AQUI
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

> **Nota:** O parâmetro `yearIsDateType=false` garante que colunas do tipo `YEAR` (como `ano_publicacao`) sejam retornadas como string de 4 dígitos (`"2023"`) em vez de data completa (`"2023-01-01"`).

---

## Como Executar o Backend

Acesse a pasta `backend` pelo terminal e inicie o servidor embutido do Spring Boot utilizando o Maven Wrapper:

```bash
cd backend
./mvnw spring-boot:run
```

*(No Windows, utilize `mvnw.cmd spring-boot:run`.)*

A API estará disponível em: **`http://localhost:8080/api`**

---

## Arquitetura do Projeto

O código-fonte dentro de `src/main/java/com/sigpesq/api/` está organizado em três camadas:

* **`model/`**: Classes Java (POJOs) que representam as entidades e os retornos enriquecidos com `JOIN`.
* **`repository/`**: Classes anotadas com `@Repository` que concentram todo o SQL nativo (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) e validações de integridade de negócio.
* **`controller/`**: Controladores REST (`@RestController`) responsáveis pelo roteamento HTTP, validação de payloads e códigos de status (`200`, `201`, `204`, `400`, `404`, `409`), com CORS liberado para `http://localhost:3000`.

---

## Regras de Negócio Implementadas

* **Participantes (`RN11`):** Unicidade de `cpf` e `email_institucional`, além de validação dos tipos permitidos (`Docente`, `Discente`, `Tecnico`).
* **Projetos (`RN01`, `RN02`, `RN05`):** Código de projeto único; o coordenador informado deve existir e ser obrigatoriamente do tipo `Docente`; situações restritas a `Em andamento`, `Concluido` ou `Cancelado`.
* **Vínculos de Participação (`RN02`):** Apenas participantes do tipo `Docente` podem assumir a função `Coordenador`, sendo permitido no máximo um coordenador principal por projeto.
* **Vínculos de Financiamento:** Validação do tipo de apoio (`Total` ou `Parcial`) e verificação de saldo para impedir que a soma de `valor_apoio` ultrapasse o `valor_total` do financiamento.

---

## Mapa de Endpoints da API

### 1. Participantes (`/api/participantes`)
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/participantes` | Lista todos os participantes |
| `GET` | `/api/participantes/{cpf}` | Busca um participante por CPF |
| `POST` | `/api/participantes` | Cadastra um novo participante |
| `PUT` | `/api/participantes/{cpf}` | Atualiza os dados de um participante |
| `DELETE` | `/api/participantes/{cpf}` | Remove um participante |

### 2. Projetos (`/api/projetos`)
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/projetos` | Lista todos os projetos (com nome do coordenador) |
| `GET` | `/api/projetos/{codigo}` | Busca um projeto por código |
| `GET` | `/api/projetos/coordenador/{cpf}` | Lista projetos coordenados por um docente |
| `POST` | `/api/projetos` | Cadastra um novo projeto |
| `PUT` | `/api/projetos/{codigo}` | Atualiza um projeto |
| `DELETE` | `/api/projetos/{codigo}` | Remove um projeto |

### 3. Produções Científicas (`/api/producoes`)
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/producoes` | Lista todas as produções científicas |
| `GET` | `/api/producoes/{id}` | Busca uma produção por ID |
| `GET` | `/api/producoes/projeto/{codigoProjeto}` | Lista produções vinculadas a um projeto |
| `POST` | `/api/producoes` | Cadastra uma nova produção |
| `PUT` | `/api/producoes/{id}` | Atualiza uma produção |
| `DELETE` | `/api/producoes/{id}` | Remove uma produção |

### 4. Financiamentos (`/api/financiamentos`)
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/financiamentos` | Lista todos os financiamentos |
| `GET` | `/api/financiamentos/{id}` | Busca um financiamento por ID |
| `POST` | `/api/financiamentos` | Cadastra um novo financiamento |
| `PUT` | `/api/financiamentos/{id}` | Atualiza um financiamento |
| `DELETE` | `/api/financiamentos/{id}` | Remove um financiamento |

### 5. Vínculos de Participação (`/api/vinculos-projeto`)
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/vinculos-projeto` | Lista todos os vínculos de equipe |
| `GET` | `/api/vinculos-projeto/projeto/{codigoProjeto}` | Lista os integrantes de um projeto |
| `POST` | `/api/vinculos-projeto` | Vincula um participante a um projeto |
| `PUT` | `/api/vinculos-projeto/{codigoProjeto}/{cpf}` | Atualiza função ou datas do vínculo |
| `DELETE` | `/api/vinculos-projeto/{codigoProjeto}/{cpf}` | Remove o participante do projeto |

### 6. Vínculos de Financiamento (`/api/vinculos-financiamento`)
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/vinculos-financiamento` | Lista todos os aportes vinculados |
| `GET` | `/api/vinculos-financiamento/projeto/{codigoProjeto}` | Lista financiamentos de um projeto |
| `POST` | `/api/vinculos-financiamento` | Vincula um financiamento a um projeto |
| `PUT` | `/api/vinculos-financiamento/{idVinculo}` | Atualiza tipo de apoio ou valor alocado |
| `DELETE` | `/api/vinculos-financiamento/{idVinculo}` | Remove o vínculo de financiamento |

### 7. Vínculos de Autoria (`/api/vinculos-producao`)
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/vinculos-producao` | Lista todos os vínculos de autoria |
| `GET` | `/api/vinculos-producao/producao/{idProducao}` | Lista autores de uma produção |
| `GET` | `/api/vinculos-producao/participante/{cpf}` | Lista produções de um participante |
| `POST` | `/api/vinculos-producao` | Vincula um autor a uma produção |
| `PUT` | `/api/vinculos-producao/{cpf}/{idProducao}` | Atualiza tipo de participação ou datas |
| `DELETE` | `/api/vinculos-producao/{cpf}/{idProducao}` | Remove o autor da produção |

---

## Roteiro de Teste Rápido (`cURL`)

Com o servidor rodando na porta `8080`, execute os comandos abaixo em ordem para popular e validar todas as entidades e relacionamentos:

```bash
# 1. Cadastrar Participante (Docente)
curl -i -X POST http://localhost:8080/api/participantes \
  -H "Content-Type: application/json" \
  -d '{"cpf":"11122233344","nome":"Dr. Carlos Silva","emailInstitucional":"carlos.silva@univ.edu.br","tipo":"Docente"}'

# 2. Cadastrar Projeto
curl -i -X POST http://localhost:8080/api/projetos \
  -H "Content-Type: application/json" \
  -d '{"codigo":"PRJ-2023-01","titulo":"Análise de Dados em Redes de Sensores","descricao":"Estudo de coleta distribuída.","dataInicio":"2023-03-01","dataTermino":"2026-12-15","situacao":"Em andamento","cpfCoordenador":"11122233344"}'

# 3. Cadastrar Produção Científica
curl -i -X POST http://localhost:8080/api/producoes \
  -H "Content-Type: application/json" \
  -d '{"codigoProjeto":"PRJ-2023-01","titulo":"Protocolos de Roteamento em IoT","tipo":"Artigo","anoPublicacao":"2023","meioDivulgacao":"Simpósio Brasileiro de Redes de Computadores"}'

# 4. Cadastrar Financiamento
curl -i -X POST http://localhost:8080/api/financiamentos \
  -H "Content-Type: application/json" \
  -d '{"agenciaFinanciadora":"CNPq","tipoFomento":"Bolsa de Produtividade","valorTotal":36000.00,"dataInicioVigencia":"2023-01-01","dataFimVigencia":"2024-12-31"}'

# 5. Vincular Participante ao Projeto
curl -i -X POST http://localhost:8080/api/vinculos-projeto \
  -H "Content-Type: application/json" \
  -d '{"cpfParticipante":"11122233344","codigoProjeto":"PRJ-2023-01","funcao":"Coordenador","dataEntrada":"2023-03-01","dataSaida":null}'

# 6. Vincular Financiamento ao Projeto
curl -i -X POST http://localhost:8080/api/vinculos-financiamento \
  -H "Content-Type: application/json" \
  -d '{"idFinanciamento":1,"codigoProjeto":"PRJ-2023-01","tipoApoio":"Total","valorApoio":36000.00}'

# 7. Vincular Autor à Produção Científica
curl -i -X POST http://localhost:8080/api/vinculos-producao \
  -H "Content-Type: application/json" \
  -d '{"cpfParticipante":"11122233344","idProducao":1,"tipoParticipacao":"Autor Principal","dataInicio":"2023-04-01","dataTermino":null}'
```