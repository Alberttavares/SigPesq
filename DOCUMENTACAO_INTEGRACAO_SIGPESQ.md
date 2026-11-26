# SigPesq — Front-end e integração com o back-end

Guia de estudo de como o front-end está organizado e como ele conversa com a API Java. Tudo aqui corresponde ao código atual; o que depende do back-end está em [Limitações](#11-limitações).

## Sumário

1. [Arquitetura](#1-arquitetura)
2. [Arquivos principais](#2-arquivos-principais)
3. [Contratos da API](#3-contratos-da-api)
4. [Tipos](#4-tipos)
5. [Cliente HTTP, serviços e hook](#5-cliente-http-serviços-e-hook)
6. [Login, CPF e senha](#6-login-cpf-e-senha)
7. [Cadastro público](#7-cadastro-público)
8. [Permissões](#8-permissões)
9. [Visualização e participantes vinculados](#9-visualização-e-participantes-vinculados)
10. [Erros, validações e carregamento](#10-erros-validações-e-carregamento)
11. [Limitações](#11-limitações)
12. [Interface e convenções](#12-interface-e-convenções)
13. [Decisões de Projeto](#13-decisões-de-projeto)
14. [Banco de dados e seeder](#14-banco-de-dados-e-seeder)
15. [Testes](#15-testes)
16. [Resumo rápido](#16-resumo-rápido)

---

## 1. Arquitetura

| Pasta | Conteúdo |
|---|---|
| `api/` | Back-end **Java + Spring Boot**, API REST em `http://localhost:8080/api`, SQL com `JdbcTemplate`. |
| `database/` | Script do banco MySQL/MariaDB (`sigpesq.sql`). |
| `frontend/` | **Next.js + React + TypeScript + Tailwind CSS**, em `http://localhost:3000`. |

O front-end é uma SPA: a página `/` renderiza `App`, e a troca de tela é feita pelo estado `currentRoute`, sem mudar a URL.

```
Telas (App.tsx) → hook useResearchData → serviços (research.ts / auth.ts) → Axios (http.ts) → API Spring
```

Cada camada tem uma responsabilidade: a tela não monta URLs, e o serviço não conhece botões. Isso permite testar os serviços sem navegador.

**Bibliotecas** ([`package.json`](frontend/package.json)): `next`, `react`, **`axios`** (único cliente HTTP da aplicação; não se usa `fetch`), `lucide-react` (ícones), `tailwindcss`, `typescript`, `eslint` e `tsx` (testes com `node:test`). O Axios foi escolhido porque converte JSON, permite instâncias com `baseURL`/`timeout`, lança erro para status ≥ 400 e oferece `isAxiosError`/`isCancel`.

---

## 2. Arquivos principais

| Arquivo | Responsabilidade |
|---|---|
| [`src/app/layout.tsx`](frontend/src/app/layout.tsx), [`page.tsx`](frontend/src/app/page.tsx) | Casca do Next (App Router): `<html lang="pt-BR">`, título, e a página que renderiza `<App />`. |
| [`src/App.tsx`](frontend/src/App.tsx) | Todas as telas e componentes. Tem `'use client'` porque usa estado e eventos. |
| [`src/services/http.ts`](frontend/src/services/http.ts) | `apiClient` (Axios) e `getApiErrorMessage`. |
| [`src/services/contracts.ts`](frontend/src/services/contracts.ts) | DTOs: o formato exato do JSON da API. |
| [`src/services/research.ts`](frontend/src/services/research.ts) | CRUD de todas as entidades e participantes de um projeto. |
| [`src/services/auth.ts`](frontend/src/services/auth.ts) | Login e cadastro público. |
| [`src/hooks/useResearchData.ts`](frontend/src/hooks/useResearchData.ts) | Carrega os dados em estado React e coordena as escritas. |
| [`src/Utils/types.ts`](frontend/src/Utils/types.ts) | Tipos usados pelas telas. |
| [`src/Utils/permissions.ts`](frontend/src/Utils/permissions.ts) | `podeGerenciar` e `TIPOS_CADASTRO_PUBLICO`. |
| [`src/Utils/cpf.ts`](frontend/src/Utils/cpf.ts) | `cpfDigits`, `formatCpf`, `validarLogin`. |
| [`next.config.mjs`](frontend/next.config.mjs) | Proxy `/api-auth` do login (seção 5). |
| [`src/index.css`](frontend/src/index.css) | Tailwind e regra de movimento reduzido. |
| `public/images/newLogo.png` | Logo branca sem fundo: no menu lateral aparece branca; no login e no cadastro, preta (filtro `brightness-0`). |

Os arquivos `Utils/mock*.ts` continuam na pasta, mas não são usados pelo `App`. O usuário fixo de demonstração (`mockUsuarios.ts`) foi removido, porque o usuário agora vem do login.

---

## 3. Contratos da API

O back-end foi lido como referência e **não foi alterado**.

| Rota | Comportamento relevante |
|---|---|
| `POST /api/auth/login` | Corpo `{ cpf: "11 dígitos", senha }`. **200** devolve o participante (`cpf`, `nome`, `emailInstitucional`, `tipo`); **401** devolve `"CPF ou senha inválidos."`; **422** para CPF fora de `\d{11}` ou senha vazia. A senha é comparada com o hash BCrypt e nunca volta na resposta (`@JsonIgnore`). **Não há token.** O `AuthController` **não tem `@CrossOrigin`**. |
| `GET/POST/PUT/DELETE /api/participantes[/{cpf}]` | `POST` exige senha (6–100 caracteres); no `PUT` ela é opcional. O tipo `Administrador` só é aceito com o cabeçalho `X-Solicitante-Cpf` de um administrador. **409** para CPF ou e-mail duplicado. |
| `GET /api/vinculos-projeto` | Todos os vínculos de participação. |
| `GET /api/vinculos-projeto/projeto/{codigo}` | Vínculos de um projeto, com nome e tipo do participante (JOIN). **Sem paginação.** |
| Demais (`/projetos`, `/financiamentos`, `/producoes`, `/vinculos-financiamento`, `/vinculos-producao`) | `GET` devolve um array JSON; `POST`/`PUT` devolvem texto; `DELETE` devolve 204. |

**Erros:** regras de negócio chegam como **texto puro**; validações chegam como `{ "campo": "mensagem" }` com **422** (`GlobalExceptionHandler`).

---

## 4. Tipos

Há dois conjuntos, de propósito: **DTOs** (`contracts.ts`, iguais ao JSON) e **tipos da interface** (`types.ts`). As telas usam um `id` numérico em tudo, enquanto a API usa chaves diferentes (CPF, código do projeto, ids). O `research.ts` faz a tradução; se a API mudar um campo, só o serviço muda.

Criados ou alterados:

- **`TipoParticipante`** = `'Docente' | 'Discente' | 'Tecnico' | 'Administrador'`. Os valores seguem o ENUM do banco (sem acento); `TIPO_PARTICIPANTE_LABEL` mostra "Técnico" e "Administrador".
- **`UsuarioAutenticado`** `{ cpf, nome, email, tipo }`: o usuário do login. Substituiu a antiga interface `Usuario` do mock.
- **`ParticipanteDTO.tipo`** aceita `Tecnico` e `Técnico`, além de `Administrador`.
- **`ParticipacaoDTO`**: `cpfParticipante`, `codigoProjeto`, `funcao`, `dataEntrada`, `dataSaida` (`null` = vínculo ativo) e, vindos do JOIN, `nomeParticipante`, `tipoParticipante` e `tituloProjeto`.
- **`CadastroParticipante`** (`auth.ts`): `nome`, `email`, `cpf`, `tipo`, `senha`.
- Em `App.tsx`:
  - `ViewProps` recebeu `podeGerenciar`.
  - `CrudViewProps` recebeu `podeGerenciar`, `detailColumns` e `renderDetailsExtra`, e o `getInitialForm` passou a ser opcional; sem ele, a tela não tem "Novo Registro".
  - `TableProps` recebeu `onView`.
  - `AuthState` controla login/cadastro.
  - `ParticipantesState` é uma *union* discriminada: `loading`, `error` ou `ok` com `items`.

---

## 5. Cliente HTTP, serviços e hook

**`apiClient`** (`http.ts`): `axios.create` com `baseURL` vinda de `NEXT_PUBLIC_API_BASE_URL` (padrão `http://localhost:8080/api`; a barra final é removida), `timeout` de 15 s e cabeçalho `Accept` JSON/texto.

**`researchService`** (`research.ts`), criado por `createResearchService(client)`. Receber o cliente como parâmetro (injeção de dependência) permite usar um servidor falso nos testes.

| Função | O que faz |
|---|---|
| `load(signal)` | 7 `GET` em paralelo (`Promise.all`); converte os DTOs e gera os `id` locais. |
| `save(collection, data, db, solicitanteCpf?)` | `POST` (sem `id`) ou `PUT`. Em `participantes`, envia o cabeçalho `X-Solicitante-Cpf` com o CPF do usuário logado. |
| `remove(collection, data, db)` | `DELETE` na rota do registro. |
| `listParticipacoesDoProjeto(codigo, signal)` | `GET /vinculos-projeto/projeto/{codigo}`. |

A função `identity()` dá um número estável a cada chave real, e `recordPath()` faz o caminho inverso para montar a URL (`/participantes/12345678901`). As chaves passam por `encodeURIComponent`.

**Proxy do login (CORS).** O navegador só lê respostas de outra origem se o servidor autorizar. Os controllers fazem isso com `@CrossOrigin`, **menos o `AuthController`**, então o login direto (com *preflight* `OPTIONS`) seria bloqueado. Sem alterar o back-end, o `next.config.mjs` define:

```js
{ source: '/api-auth/:path*', destination: `${apiBaseUrl}/auth/:path*` }
```

O navegador chama `localhost:3000/api-auth/login` (mesma origem), e o servidor do Next repassa a chamada para a API; entre servidores não há CORS. Por isso o `authService` usa um `authClient` com `baseURL: '/api-auth'`. Só o login passa pelo proxy.

**Hook `useResearchData(enabled, route, showMessage, solicitanteCpf?)`** devolve `{ db, actions: { save, remove } }`:
- só carrega com usuário logado (`enabled`) e recarrega a cada troca de tela (`route`);
- usa `AbortController` e um contador `sequence` para que só a última resposta atualize o estado;
- `snapshot` (`useRef`) guarda a cópia atual dos dados para os serviços;
- `mutate()` impede escritas simultâneas e recarrega tudo depois de gravar. Se a gravação funcionou mas a recarga falhou, a mensagem avisa para não repetir a operação.

---

## 6. Login, CPF e senha

**Fluxo:**
```
Entrar → validarLogin(cpf, senha) → botão "Entrando..." → authService.login
  → normalizeCpf → POST /api-auth/login → proxy → /api/auth/login
  200: toUsuario(data) → App.setUsuario(usuario) → painel; useResearchData começa a carregar
  401: "CPF ou senha incorretos. Tente novamente."
  5xx/sem resposta: "Não foi possível concluir o login…"
```

**Armazenamento:** `useState<UsuarioAutenticado | null>` no `App`, sem `localStorage`, cookie ou token. Recarregar a página volta ao login. "Sair do sistema" faz `setUsuario(null)`.

**Uso dos dados:**
- `nome`: saudação "Olá, [nome]" e nome no topo;
- `tipo`: exibido abaixo do nome, em cinza mais claro, e usado nas permissões;
- `cpf`: cabeçalho `X-Solicitante-Cpf`.

**CPF** (`cpf.ts`):
- `cpfDigits` remove tudo que não é número (`\D`) e corta em 11.
- `formatCpf` reaplica `000.000.000-00` a cada digitação. O campo é controlado, então letras são descartadas, pontos e hífen não contam como números, o 12º dígito é ignorado (`maxLength={14}` reforça) e um CPF colado com máscara é aceito.
- `inputMode="numeric"` abre o teclado numérico no celular.
- `validarLogin` devolve "Informe seu CPF.", "O CPF deve conter 11 números." ou "Informe sua senha.". O formulário usa `noValidate` para exibir essas mensagens em vez dos balões do navegador.
- **Envio:** o back-end espera somente números, então `normalizeCpf` remove a pontuação e envia `{ "cpf": "12345678901", "senha": "..." }`. A mesma máscara é usada no **cadastro público**, que também recusa CPF incompleto ("O CPF deve conter 11 números.").

**Senha** (`PasswordInput`, no login e no cadastro): o estado `visivel` começa em `false`, e o botão de olho só alterna `type="password"`/`"text"` do mesmo input. Assim o valor, que fica no estado do pai, não muda. O botão é `type="button"` (não envia o formulário) e tem `aria-label`/`aria-pressed`. `autoComplete` é `current-password` no login e `new-password` no cadastro.

---

## 7. Cadastro público

A criação de participantes saiu do painel e foi para o link **"Cadastre-se"** do login. No painel, participantes continuam podendo ser visualizados, editados e excluídos.

```
Cadastre-se → CadastroScreen (Nome, E-mail, CPF com máscara, Tipo, Senha)
  Tipo: só Docente, Discente, Técnico (TIPOS_CADASTRO_PUBLICO)
  valida CPF com 11 números, tipo e senha 6–100 → POST /api/participantes { cpf, nome, emailInstitucional, tipo, senha }
  sucesso: volta ao login com aviso e CPF preenchido | erro (409, 422…): mensagem da API
```

Esconder "Administrador" evita que a pessoa só descubra o 403 do back-end depois de enviar; o serviço também confere o tipo. Na **edição**, "Administrador" só aparece quando o registro já é administrador (`tiposParaEdicao`), para o `<select>` manter o valor atual. Ninguém é promovido pela interface.

---

## 8. Permissões

```ts
podeGerenciar(tipo) = tipo === 'Docente' || tipo === 'Administrador'
```

| Tipo | Visualizar | Cadastrar / Editar / Excluir |
|---|:-:|:-:|
| Discente, Técnico | ✔ | — |
| Docente, Administrador | ✔ | ✔ |

O `App` calcula `podeGerenciar(usuario.tipo)` e repassa o resultado às telas. O `CrudView` só mostra "Novo Registro" se `podeGerenciar && getInitialForm`, e só passa `onEdit`/`onDelete` para a `Table` quando há permissão. `onView` sempre existe, então o olho sempre aparece. A regra fica em um só lugar.

> Isso controla apenas **o que a interface mostra**; a API não verifica o tipo do usuário (seção 11).

---

## 9. Visualização e participantes vinculados

**Olho → modal:** `onView(row)` → `setViewing(row)` → `<Modal>` com `<DetailList>` (`<dl>`, valores vazios aparecem como `-`) e `renderDetailsExtra`. Os campos vêm de `detailColumns` ou das colunas da tabela: Projeto mostra também a Descrição, Produção o Meio de divulgação e Autoria as datas. É **somente leitura**.

O `Modal` tem fundo escurecido com desfoque e fecha pelo X, pelo botão Fechar, clicando fora ou com Esc. Tem `role="dialog"`, `aria-modal` e `aria-labelledby`. Ao abrir, o foco vai para "Fechar"; ao fechar, volta a quem abriu o modal.

**Participantes de um projeto** (`ProjetoParticipantes`, no modal de Projetos):
- A relação está na tabela `vinculo_participacao_projeto`, com chave `(cpf_participante, codigo_projeto)` e os campos `funcao`, `data_entrada` e `data_saida`.
- O endpoint `GET /api/vinculos-projeto/projeto/{codigo}` (`listarPorProjeto` → `buscarPorProjeto` no repository) **filtra no banco** com `WHERE v.codigo_projeto = ?`. Os `INNER JOIN` com `participante` e `projeto` acrescentam nome, tipo e título, e o resultado vem ordenado por `data_entrada`, sem paginação.
- No front, `listParticipacoesDoProjeto` busca a lista quando o modal abre (`useEffect` com `AbortController`; fechar o modal cancela a chamada) e confere se a resposta é um array.
- Estados exibidos: "Carregando participantes...", erro, "Nenhum participante vinculado a este projeto." ou a lista com nome, tipo, função e período ("… a Atual" quando `dataSaida` é nula).
- **Até 4 participantes sem rolagem** (`PARTICIPANTES_VISIVEIS`). Com mais de 4, a lista ganha rolagem vertical própria e o modal mantém o tamanho. Como a altura de cada item varia (nomes longos, layout do celular), um `useLayoutEffect` mede o fim do 4º item e usa esse valor como `max-height`, recalculado por um `ResizeObserver` quando a largura muda. Com rolagem, a lista recebe foco pelo Tab (`tabIndex=0`) para rolar pelo teclado.
- O front **não cruza** listas de projetos e participantes. A lista geral (`GET /vinculos-projeto`, usada na tela de Vínculos) poderia ser filtrada no navegador, mas o endpoint específico mantém o filtro no banco e traz dados atualizados a cada abertura.

---

## 10. Erros, validações e carregamento

**`getApiErrorMessage`** (`http.ts`), em ordem:
1. texto da API (se não for HTML);
2. objeto `{ campo: mensagem }` → junta as mensagens;
3. 404 → "Registro não encontrado…";
4. 409 → "A operação conflita…";
5. timeout → "A API demorou para responder…";
6. sem resposta → "Não foi possível conectar à API…";
7. outros → "(HTTP xxx)";
8. erro que não é do Axios → `error.message`.

No login, o 401 vira a frase de credenciais incorretas antes de chegar à tela.

**Validações em dois níveis:** no front, para feedback imediato (`validarLogin`, senha 6–100, tipo obrigatório, `validate` de cada tela — datas, código e CPF repetidos —, `required`, `normalizeCpf`/`requiredText`); no back, como regra definitiva (anotações dos DTOs, unicidade, regra do coordenador RN02, tipo Administrador).

**Carregamento e feedback:**
- botões mostram "Entrando...", "Cadastrando..." ou "Salvando..." e ficam desabilitados durante o envio (`saving` e `pending` no `CrudView` evitam clique duplo);
- a lista de participantes mostra "Carregando participantes...";
- a exclusão pede `window.confirm`;
- `Message` usa `role="alert"` para erro e `role="status"` para sucesso; no painel, some após 5 s ou ao clicar no X.

---

## 11. Limitações

1. **Sem token/sessão:** o usuário fica só em memória, e recarregar a página desloga.
2. **Permissões só na interface:** os endpoints não verificam quem chama; é possível alterar dados chamando a API diretamente. A proteção real exigiria autenticação no back-end.
3. **`X-Solicitante-Cpf`** é informado pelo próprio cliente, e o back-end confia nele.
4. **CORS do login** resolvido pelo proxy do Next. Sem o servidor do Next (exportação estática), seria preciso `@CrossOrigin` no `AuthController`.
5. **Login por CPF:** o pedido inicial falava em e-mail, mas o endpoint só aceita CPF.
6. **Participantes do projeto** sem paginação: suficiente hoje; com muitos vínculos, o back-end precisaria paginar.
7. **Modal sem *focus trap*:** o Tab pode sair do modal.
8. **Recarga ampla:** a cada troca de tela ou gravação, as 7 listas são recarregadas.

---

## 12. Interface e convenções

**Componentes** (em `App.tsx`):
- **Botões:** `Button` (`primary`/`secondary`/`danger`) e `IconButton` (o `label` vira `title`/`aria-label`; tons `neutral`, `view`, `edit`, `danger`, `ghost`, `ghostDark`).
- **Campos:** `FieldLabel` (ligado ao campo por `htmlFor`/`useId`), `Input`, `Select`, `PasswordInput`. A prop opcional `rounded` deixa o campo com cantos arredondados (usada no login e no cadastro); sem ela, o campo fica reto, como nos formulários do painel.
- **Listas e feedback:** `Table` (tabela no desktop, cartões no mobile), `EmptyState`, `Message`, `Modal`, `DetailList`.
- **Telas:** `AuthCard`, `LoginScreen`, `CadastroScreen`, `Dashboard`/`StatCard`, `CrudView<T>`, `ProjetoParticipantes`, `MenuLink` (com `aria-current`).

**Estilo centralizado** em constantes no topo do `App.tsx`:
- `FOCUS_RING`, `LABEL_CLASS` e `CARD_CLASS` (`rounded-lg` + `shadow-sm`);
- `FIELD_BASE`, sem arredondamento, usado na busca com `rounded-md`;
- `FIELD_CLASS` = `FIELD_BASE` + `rounded-none`, usado nos formulários do painel;
- `fieldClass(rounded)` escolhe entre `FIELD_CLASS` e `FIELD_BASE` + `rounded-md`.

Separar `FIELD_BASE` e `FIELD_CLASS` evita duas classes de arredondamento competindo no mesmo elemento.

**Convenções:**
- TypeScript estrito, sem `any`;
- nomes de domínio em português (`podeGerenciar`, `validarLogin`);
- comentários curtos explicando o porquê;
- reuso dos componentes existentes;
- serviços com injeção de dependência;
- back-end não alterado.

---

## 13. Decisões de Projeto

- **Tipo Administrador.** O ENUM `tipo` da tabela `participante` e a validação do back-end incluem `Administrador`. O front passou a reconhecê-lo (`TipoParticipante`, rótulo e permissões completas), mas ele **não aparece no cadastro público**: administradores são criados direto no banco. O `DatabaseSeeder` garante o administrador padrão (CPF `00000000000`, `admin@ufes.br`) a cada inicialização da API.
- **Senha na tabela de participantes.** A tabela tem `senha VARCHAR(255) NOT NULL`, com hash BCrypt gerado no repository e nunca exposto (`@JsonIgnore`). A senha é obrigatória no `POST` e opcional no `PUT`. No front, ela aparece só no cadastro público, com olho para mostrar/ocultar, e é usada no login.
- **Refinamentos visuais.** As cores e a identidade foram mantidas. Foram acrescentados:
  - cantos arredondados (`rounded-lg` em cartões e tabelas, `rounded-xl` no modal e no cartão de login/cadastro, `rounded-md` em botões, mensagens, busca e campos do login/cadastro; campos dos formulários do painel continuam retos);
  - sombras sutis;
  - estados de hover, clique, foco visível e desabilitado;
  - cores semânticas nas ações (azul visualizar, amarelo editar, vermelho excluir; contraste do ícone entre 5,9:1 e 8,1:1);
  - hierarquia: título do topo com o nome da tela, saudação grande, contadores em grade 2×2 com os ícones do menu, nome do usuário acima do tipo;
  - logo branca sem fundo no lugar do texto "SIGPESQ" do menu, sobre o mesmo fundo escuro de antes e com o subtítulo "Gestão de Projetos" mantido. Ela tem 32 px de altura (96 px de largura, mantendo a proporção 3:1), e o `next/image` serve a imagem já redimensionada;
  - login e cadastro: logo preta no lugar do texto "SIGPESQ" (a mesma `newLogo.png` com `brightness-0`, sem criar outro arquivo), cartão com sombra maior e cadastro mais largo, com CPF e Tipo lado a lado a partir de 640 px;
  - movimento reduzido respeitado.
- **Participantes vinculados a um projeto.** A relação vem da tabela `vinculo_participacao_projeto`. A filtragem por projeto é feita **no banco**, pelo endpoint `GET /api/vinculos-projeto/projeto/{codigo}` (`WHERE` + `JOIN` com participante). O front apenas busca essa lista ao abrir o modal do projeto e a exibe.

---

## 14. Banco de dados e seeder

Comandos usados nesta máquina para recriar o banco e popular os dados. O banco é o **MariaDB 10.4.32 do XAMPP**, instalado em `C:\xampp_2`. O cliente `mysql` não está no PATH, então é chamado pelo caminho completo com `&` (operador de chamada do PowerShell). Em outra máquina, troque o caminho pelo da sua instalação.

**Conexão usada pela API** (`api/src/main/resources/application.properties`): `jdbc:mysql://localhost:3306/sigpesq`, usuário `root`, senha vazia (padrão do XAMPP).

**Como o caminho foi descoberto:** o processo do servidor em execução apontava para `c:\xampp_2\mysql\bin\mysqld.exe`; o cliente fica na mesma pasta.

```powershell
Get-Process mysqld | Select-Object Path
& 'C:\xampp_2\mysql\bin\mysql.exe' --version
```

**1. Recriar o banco vazio.** ⚠️ Apaga todos os dados de `sigpesq`.

```powershell
& 'C:\xampp_2\mysql\bin\mysql.exe' -u root -p -e "DROP DATABASE sigpesq; CREATE DATABASE sigpesq;"
```

O `-p` pede a senha; no XAMPP basta apertar Enter.

**2. Criar as tabelas** com o script do projeto, executado na raiz do repositório. O `sigpesq.sql` só cria tabelas que faltam e não apaga dados, por isso o passo 1 vem antes.

```powershell
Get-Content -Raw "database\sigpesq.sql" | & 'C:\xampp_2\mysql\bin\mysql.exe' -u root sigpesq
& 'C:\xampp_2\mysql\bin\mysql.exe' -u root -e "SHOW TABLES FROM sigpesq;"
```

O PowerShell não aceita o redirecionamento `<`; por isso o arquivo é enviado com `Get-Content -Raw ... |`. O resultado esperado são 7 tabelas.

**3. Rodar o seeder subindo a API.** O `DatabaseSeeder` (`api/.../config/DatabaseSeeder.java`) é um `CommandLineRunner`: o Spring o executa automaticamente a cada inicialização, sem comando próprio.

```powershell
cd api
.\mvnw.cmd spring-boot:run
```

No console devem aparecer `[Seeder] Administrador padrão criado: admin@ufes.br` e `[Seeder] Base populada com sucesso!`.

- O **administrador padrão** (CPF `00000000000`, senha `adminadmin`) é garantido sempre.
- Os **dados de exemplo** (Datafaker) só são gerados se a tabela `participante` estiver vazia: 20 participantes (6 Docentes, 10 Discentes, 4 Técnicos, senha `senha123`), 8 projetos, 6 financiamentos, 12 produções e os vínculos. Caso contrário, o seeder registra `Seeding ignorado`.
- Esvaziar só `participante` não basta: os projetos (`PRJ-2026-001`…) já existiriam e a inserção falharia. Por isso o banco inteiro é recriado.
- Nomes e CPFs são aleatórios e mudam a cada nova carga.

**4. Conferir o resultado.**

```powershell
& 'C:\xampp_2\mysql\bin\mysql.exe' -u root -e "SELECT tipo, COUNT(*) n, MIN(cpf) exemplo_cpf FROM sigpesq.participante GROUP BY tipo;"
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/auth/login -ContentType 'application/json' -Body '{"cpf":"00000000000","senha":"adminadmin"}'
```

Na última carga, o banco ficou com 21 participantes (incluindo o administrador), 8 projetos, 6 financiamentos, 12 produções, 29 vínculos de participação, 6 financiamentos por projeto e 31 autorias. O login do administrador respondeu `Administrador SIGPESQ / Administrador`.

---

## 15. Testes

Na pasta `frontend/`:

| Comando | Verifica |
|---|---|
| `npm run typecheck` / `npm run lint` | Tipos e regras de código. |
| `npm test` | [`research.test.ts`](frontend/tests/research.test.ts) (contrato HTTP contra um servidor falso, sem MySQL) e [`cpf.test.ts`](frontend/tests/cpf.test.ts) (máscara e mensagens). |
| `npm run build` | Build de produção. |
| `npm run test:api` | Leitura da API real (exige back-end rodando). |

O fluxo também foi conferido no navegador com a API ativa: login inválido, cadastro, tela de Discente só com o olho, modal de projeto, máscara do CPF, olho da senha e navegação por teclado.

---

## 16. Resumo rápido

- **Axios:** `apiClient` direto na API; `authClient` via proxy `/api-auth` (CORS do login).
- **Login:** `POST /api/auth/login { cpf, senha }` → `UsuarioAutenticado` no estado do `App`; 401 → "CPF ou senha incorretos. Tente novamente."
- **CPF:** `formatCpf` aplica a máscara, `cpfDigits` limita a 11 números, `normalizeCpf` envia só os números.
- **Senha:** `PasswordInput` alterna o `type` sem mudar o valor.
- **Cadastro:** "Cadastre-se" → `POST /api/participantes` com senha e CPF mascarado, sem Administrador.
- **Banco:** recriar `sigpesq`, rodar `database/sigpesq.sql` e subir a API (`.\mvnw.cmd spring-boot:run`); o seeder popula sozinho se `participante` estiver vazia.
- **Permissões:** Docente/Administrador gerenciam; Discente/Técnico só visualizam.
- **Participantes do projeto:** endpoint específico, com filtro e JOIN no banco.
- **Limitação principal:** não há token, e as permissões valem só na interface.
