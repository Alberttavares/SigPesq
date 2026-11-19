# SIGPesq — Front-end

Aplicação Next.js + React + TypeScript, com Tailwind CSS e Axios.

O passo a passo completo de MySQL/XAMPP, API Java, variáveis de ambiente,
execução, testes e produção está no [README principal](../README.md).

```powershell
npm ci
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Abra `http://localhost:3000` com a API em funcionamento. A variável
`NEXT_PUBLIC_API_BASE_URL` aponta para `http://localhost:8080/api` por padrão.
Não inclua credenciais de banco no front-end.

```powershell
npm run typecheck
npm run lint
npm test
npm run test:api
npm run build
npm start
```

`npm test` usa um servidor HTTP isolado e não altera o banco.
`npm run test:api` faz somente consultas de leitura na API local.
A entrada na aplicação continua demonstrativa, pois a API não possui login.
Os mocks de pesquisa mantidos em `src/Utils/` servem apenas como referência e
não são carregados pelo sistema integrado.
