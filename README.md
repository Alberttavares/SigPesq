# SIGPesq

Sistema de gestão de pesquisa acadêmica, com **Next.js + React + TypeScript** no
front-end, **Axios** para comunicação HTTP e **Java 21 + Spring Boot + JDBC** no
back-end. O banco usa MySQL/MariaDB, incluindo a instalação do XAMPP.

## Estrutura

```text
SigPesq/
├── api/          # API Java e Maven Wrapper
├── frontend/     # Next.js, React, Axios e Tailwind CSS
├── database/     # DDL das sete tabelas e documentação da estrutura
└── README.md
```

O front-end preserva as telas, os estilos e a navegação existentes. As operações
sobre os dados de pesquisa são persistidas pela API; os mocks dessas entidades
não são carregados nem usados como alternativa quando a API falha.

## Pré-requisitos

- JDK 21, com `java` e `javac` disponíveis e `JAVA_HOME` apontando para a raiz do JDK.
- Node.js 20.9 ou superior e npm. O projeto inclui `package-lock.json`.
- MySQL/MariaDB iniciado, com o banco `sigpesq` e suas sete tabelas.
- Acesso à internet na primeira instalação das dependências Java e JavaScript.

Os comandos abaixo usam PowerShell no Windows e partem da raiz deste repositório.

## 1. Iniciar e conferir o banco no XAMPP

1. Abra o XAMPP Control Panel e inicie **MySQL**. O XAMPP pode fornecer MariaDB,
   que é compatível com a estrutura deste projeto.
2. Para usar o phpMyAdmin, inicie também **Apache** e abra
   `http://localhost/phpmyadmin`. Apache não é necessário para a conexão JDBC da API.
3. Confira a existência do banco `sigpesq`. Na instalação local já preparada, as
   sete tabelas estão criadas; não é necessário importar novamente.
4. Em uma instalação nova, crie um banco vazio `sigpesq` com codificação `utf8mb4`,
   selecione-o no phpMyAdmin e importe [database/sigpesq.sql](database/sigpesq.sql)
   com codificação UTF-8. O script cria somente tabelas ausentes, sem recriar ou
   alterar tabelas existentes e sem inserir registros.

Verifique na aba SQL do phpMyAdmin:

```sql
SHOW TABLES FROM sigpesq;
SELECT COUNT(*) AS total_participantes FROM sigpesq.participante;
```

São esperadas `participante`, `projeto`, `financiamento`, `producao_cientifica`,
`vinculo_participacao_projeto`, `vinculo_financiamento_projeto` e
`vinculo_participante_producao`. Uma contagem de zero é válida.

As colunas, chaves e escolhas de tipos estão em
[database/README.md](database/README.md).

## 2. Conferir a conexão da API

A configuração local está em
`api/src/main/resources/application.properties`. Confira, sem publicar as
credenciais:

| Propriedade | Finalidade |
| --- | --- |
| `spring.datasource.url` | Host, porta, banco e parâmetros JDBC. A configuração local aponta para `localhost:3306/sigpesq`. |
| `spring.datasource.username` | Usuário existente no MySQL, com acesso ao banco. |
| `spring.datasource.password` | Senha correspondente ao usuário. |
| `spring.datasource.driver-class-name` | Driver `com.mysql.cj.jdbc.Driver`. |

O parâmetro `yearIsDateType=false` da URL participa do tratamento de
`ano_publicacao`. A API utiliza `JdbcTemplate` e SQL nativo, sem Hibernate/JPA.
Ela não cria as tabelas automaticamente ao iniciar.

Se a IDE ou o terminal definirem `SPRING_DATASOURCE_URL`,
`SPRING_DATASOURCE_USERNAME` ou `SPRING_DATASOURCE_PASSWORD`, esses valores podem
substituir os do arquivo. Configure segredos somente no ambiente local da API.
Não os coloque no front-end ou em variáveis `NEXT_PUBLIC_*`.
O Spring Boot não carrega o arquivo `frontend/.env.local`.

## 3. Iniciar o back-end

Em um primeiro terminal, confira o JDK:

```powershell
java -version
javac -version
Test-Path "$env:JAVA_HOME\bin\java.exe"
Test-Path "$env:JAVA_HOME\bin\javac.exe"
```

Use o JDK 21 declarado no `pom.xml`. `JAVA_HOME` deve apontar para sua pasta raiz,
sem acrescentar `bin`. Se precisar selecionar um JDK já instalado somente para o
terminal atual, substitua o caminho de exemplo pelo caminho real:

```powershell
$env:JAVA_HOME = 'C:\caminho\real\do\jdk-21'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

Depois, a partir da raiz do repositório:

```powershell
cd .\api
.\mvnw.cmd spring-boot:run
```

No Linux/macOS, o equivalente dentro de `api/` é `./mvnw spring-boot:run`.
O Maven Wrapper baixa a distribuição configurada e as dependências na primeira
execução; não é necessário instalar Maven separadamente.

Aguarde a inicialização do Spring Boot. A porta padrão é **8080**; confira o log,
pois `SERVER_PORT` ou argumentos da IDE podem substituí-la. Deixe esse terminal
aberto enquanto usa o sistema. `Ctrl+C` encerra a API.

Em outro terminal, faça uma consulta de leitura:

```powershell
curl.exe -i http://localhost:8080/api/participantes
```

O esperado é HTTP **200** e um array JSON, inclusive `[]` quando não há registros.
Uma mensagem de inicialização não comprova, sozinha, o acesso às tabelas.
A URL `/api` isolada não possui uma rota de consulta e pode retornar 404.

## 4. Configurar e iniciar o front-end

Em um segundo terminal, a partir da raiz do repositório:

```powershell
cd .\frontend
npm ci
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

O arquivo `frontend/.env.local` contém somente a URL pública do back-end:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

O prefixo `/api` faz parte dessa URL. Não inclua nome de usuário, senha do banco
ou tokens nessa variável. O `.env.local` é ignorado pelo Git; o exemplo seguro
está em `.env.example`.

Abra **http://localhost:3000**. A API existente permite a origem
`http://localhost:3000`; use esse endereço, em vez de `127.0.0.1` ou outra porta,
para as chamadas do navegador. O comando fixa a porta 3000. Se estiver ocupada,
encerre a outra aplicação que você iniciou nessa porta antes de tentar novamente.

Depois de alterar a URL da API, reinicie o servidor de desenvolvimento.
Variáveis `NEXT_PUBLIC_*` são incorporadas ao código do navegador; em produção,
refaça o build se mudar esse endereço.

A tela **Entrar** continua demonstrativa, como no front-end original. O botão
libera a navegação sem autenticar e o nome exibido continua demonstrativo, pois a
API atual não fornece endpoints de login, usuários ou sessões. Nenhuma credencial
de banco é usada nessa tela.

Ao entrar, o sistema busca as sete listas da API. Falhas são exibidas no painel de
mensagens já existente. Ao navegar, os dados são consultados novamente. Cadastros,
edições e exclusões aguardam confirmação da API e recarregam os dados, incluindo
os IDs gerados pelo banco; não há gravação apenas no estado local.

## 5. Conferir a integração

Dentro de `frontend/`, execute com a API e o MySQL em funcionamento:

```powershell
npm run test:api
```

Esse comando faz apenas os sete `GET` de listagem e imprime a quantidade de
registros de cada coleção, sem cadastrar, alterar ou apagar dados.
Ele usa `.env.local` quando o arquivo existe e a URL padrão local caso contrário.

Para conferir as operações pela interface, use registros de teste. Este roteiro
manual efetivamente grava no banco:

1. Entre no sistema e cadastre um participante **Docente**. O CPF pode ser
   digitado com máscara; o serviço envia seus 11 dígitos, preservando zeros iniciais.
2. Cadastre um projeto e selecione esse docente como coordenador.
3. Cadastre um financiamento e uma produção científica ligada ao projeto.
4. Crie um vínculo de participação, uma associação de financiamento e uma autoria
   nas telas correspondentes.
5. Edite campos desses registros, salve e confirme a atualização nas listagens.
6. Recarregue a página, entre novamente e confira que os registros persistiram.
7. Para remover seus registros de teste, remova primeiro os vínculos e autorias,
   depois a produção, o projeto e o financiamento, e por último os participantes.
   A API pode recusar exclusões de registros ainda referenciados.

A API não altera CPF, código do projeto ou as identidades de vínculos por `PUT`.
Tentativas de mudar essas chaves recebem uma mensagem na interface, sem simular
uma alteração que o back-end não executa. Os demais campos seguem os contratos
existentes. Não há exclusão e recriação automática de registros para trocar chaves.

O front-end traduz `email` para `emailInstitucional`, `Tecnico` para `Técnico`,
IDs locais de participantes/projetos para CPF/código, datas vazias para `null` e
ano para a string esperada pela API. Os rótulos exibidos nas telas são preservados.

## 6. Compilação e execução de produção

Dentro de `frontend/`, com a URL pública da API já configurada:

```powershell
npm run build
npm start
```

O front-end será servido na porta 3000. A API Java continua sendo executada
separadamente, conectada ao MySQL. O build do Next.js não exige o banco nem a API
ativos, pois os dados são carregados pelo navegador após entrar na aplicação.

## Comandos do front-end

| Comando | Finalidade |
| --- | --- |
| `npm ci` | Instalar exatamente as dependências do lockfile. |
| `npm run dev` | Iniciar Next.js em desenvolvimento na porta 3000. |
| `npm run build` | Compilar para produção e verificar os tipos. |
| `npm start` | Servir o build de produção na porta 3000. |
| `npm run typecheck` | Conferir TypeScript sem emitir JavaScript. |
| `npm run lint` | Executar ESLint com as regras do Next.js. |
| `npm test` | Testar contratos Axios em um servidor HTTP isolado, sem usar o MySQL. |
| `npm run test:api` | Testar apenas leitura nas sete coleções da API real. |

Os testes de contrato cobrem os três métodos de escrita das sete coleções,
conversões de campos, identidades estáveis, chaves compostas, conflitos, respostas
textuais, valores nulos e cancelamento de leituras.

## Endpoints usados pelas telas

As rotas foram conferidas nos controllers e models Java. Cada base abaixo possui
`GET` de listagem e `POST` de cadastro. As rotas de `PUT` e `DELETE` acrescentam
as chaves indicadas:

| Coleção | Base | Chave no PUT/DELETE |
| --- | --- | --- |
| Participantes | `/api/participantes` | `/{cpf}` |
| Projetos | `/api/projetos` | `/{codigo}` |
| Financiamentos | `/api/financiamentos` | `/{id}` |
| Produções científicas | `/api/producoes` | `/{id}` |
| Participação em projetos | `/api/vinculos-projeto` | `/{codigoProjeto}/{cpfParticipante}` |
| Financiamentos por projeto | `/api/vinculos-financiamento` | `/{idVinculo}` |
| Autoria | `/api/vinculos-producao` | `/{cpfParticipante}/{idProducao}` |

Listagens retornam arrays JSON. Cadastros retornam **201** com texto;
atualizações retornam **200** com texto; exclusões retornam **204** sem corpo.
Erros **400**, **404** e **409** são tratados pelo front-end. Como os cadastros
não retornam o objeto criado, as listas são consultadas após cada escrita.

A comunicação fica em `frontend/src/services/`, o carregamento e a sincronização
em `frontend/src/hooks/useResearchData.ts` e as telas em `frontend/src/App.tsx`.
O App Router apenas hospeda a interface existente, sem mudar sua navegação interna.

## Arquivos envolvidos na migração

- Telas e modelos da interface: `frontend/src/App.tsx`,
  `frontend/src/Utils/index.ts` e `frontend/src/Utils/types.ts`.
- Entrada Next.js: `frontend/src/app/layout.tsx`, `frontend/src/app/page.tsx`,
  `frontend/next.config.mjs` e `frontend/next-env.d.ts`.
- Integração: `frontend/src/services/contracts.ts`, `frontend/src/services/http.ts`,
  `frontend/src/services/research.ts` e `frontend/src/hooks/useResearchData.ts`.
- Dependências e configuração: `frontend/package.json`,
  `frontend/package-lock.json`, `frontend/tsconfig.json`,
  `frontend/eslint.config.js`, `frontend/postcss.config.mjs`,
  `frontend/.gitignore` e `frontend/.env.example`.
- Testes e documentação: `frontend/tests/research.test.ts`,
  `frontend/tests/smoke-api.ts`, `frontend/README.md` e este README principal.
- Entradas Vite substituídas pelo Next.js: `frontend/index.html`,
  `frontend/src/main.tsx`, `frontend/vite.config.ts`, `frontend/tsconfig.app.json`
  e `frontend/tsconfig.node.json`.

O JSX de apresentação e os dois arquivos CSS originais foram comparados com a
cópia de origem. O código/configuração da API e os arquivos de `database/` não
foram alterados nesta integração.

## Problemas frequentes

| Sintoma | O que conferir |
| --- | --- |
| `JAVA_HOME` inválido | Pasta real do JDK, contendo `bin/java.exe` e `bin/javac.exe`. |
| `Access denied` no banco | Credenciais e permissões usadas pelo processo Java. |
| `Communications link failure` | MySQL ativo no XAMPP, host e porta da URL JDBC. |
| Banco ou tabela inexistente | Banco `sigpesq` e importação do DDL na instância correta. |
| Erro de CORS no navegador | Origem exata `http://localhost:3000` e API acessível. |
| Front-end não conecta à API | API iniciada, porta correta e `NEXT_PUBLIC_API_BASE_URL` incluindo `/api`. |
| Dependências antigas após migração | Pare o servidor do front-end e execute `npm ci` em `frontend/`. |
| Exclusão recusada | Remova primeiro os vínculos que referenciam o registro, quando essa for a operação desejada. |
| Escrita concluída, mas recarga falhou | Atualize os dados antes de repetir a operação para evitar duplicar um cadastro já confirmado. |

## Referências técnicas

- [Migração de Vite para Next.js](https://nextjs.org/docs/app/guides/migrating/from-vite)
- [Variáveis de ambiente do Next.js](https://nextjs.org/docs/app/guides/environment-variables)
- [Tailwind CSS com Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [Configuração externa do Spring Boot](https://docs.spring.io/spring-boot/reference/features/external-config.html)
