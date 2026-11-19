import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { after, before, beforeEach, test } from 'node:test';
import axios from 'axios';
import { createResearchService, normalizeCpf } from '../src/services/research';
import type { CollectionName, RecordOf } from '../src/services/research';
import type { Database } from '../src/Utils/types';
import { getApiErrorMessage } from '../src/services/http';

// Servidor HTTP isolado: verifica o contrato de rede sem escrever no MySQL.
const fixture = {
  participantes: [
    { cpf: '00123456789', nome: 'Docente Teste', emailInstitucional: 'docente@example.test', tipo: 'Docente' },
    { cpf: '00987654321', nome: 'Tecnico Teste', emailInstitucional: 'tecnico@example.test', tipo: 'Técnico' },
  ],
  projetos: [{ codigo: 'PRJ 2026-01', titulo: 'Projeto Teste', descricao: null, cpfCoordenador: '00123456789', dataInicio: '2026-01-01', dataTermino: null, situacao: 'Em andamento' }],
  financiamentos: [{ idFinanciamento: 41, agenciaFinanciadora: 'Agência Teste', tipoFomento: 'Bolsa', valorTotal: 1234.56, dataInicioVigencia: '2026-01-01', dataFimVigencia: null }],
  producoes: [{ idProducao: 73, codigoProjeto: 'PRJ 2026-01', titulo: 'Produção Teste', tipo: 'Artigo', anoPublicacao: '2026', meioDivulgacao: null }],
  'vinculos-projeto': [{ codigoProjeto: 'PRJ 2026-01', cpfParticipante: '00123456789', funcao: 'Coordenador', dataEntrada: '2026-01-01', dataSaida: null }],
  'vinculos-financiamento': [{ idVinculoFinanciamento: 89, idFinanciamento: 41, codigoProjeto: 'PRJ 2026-01', tipoApoio: 'Parcial', valorApoio: null }],
  'vinculos-producao': [{ idProducao: 73, cpfParticipante: '00123456789', tipoParticipacao: 'Autor Principal', dataInicio: '2026-01-01', dataTermino: null }],
};

let responses: Record<string, unknown>;
let requests: { method: string; path: string; body: unknown }[];
let failure: { path: string; status: number; body: string } | undefined;
let baseURL: string;
const server = createServer(async (request, response) => {
  const buffers: Buffer[] = [];
  for await (const chunk of request) buffers.push(Buffer.from(chunk));
  const text = Buffer.concat(buffers).toString('utf8');
  const path = request.url ?? '';
  requests.push({ method: request.method ?? '', path, body: text ? JSON.parse(text) : undefined });
  if (failure && path === failure.path) {
    response.writeHead(failure.status, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(failure.body);
  } else if (request.method === 'GET') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(responses[path.replace('/api/', '')]));
  } else if (request.method === 'DELETE') {
    response.writeHead(204);
    response.end();
  } else {
    response.writeHead(request.method === 'POST' ? 201 : 200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Operação realizada com sucesso.');
  }
});

before(async () => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  baseURL = `http://127.0.0.1:${address.port}/api`;
});
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
beforeEach(() => {
  responses = structuredClone(fixture);
  requests = [];
  failure = undefined;
});

function service() {
  return createResearchService(axios.create({ baseURL, timeout: 5000, proxy: false }));
}

type Scenario = { collection: CollectionName; data: RecordOf<CollectionName>; route: string; body: unknown };
function scenarios(db: Database): Scenario[] {
  return [
    { collection: 'participantes', data: db.participantes[1], route: '/participantes/00987654321', body: { cpf: '00987654321', nome: 'Tecnico Teste', emailInstitucional: 'tecnico@example.test', tipo: 'Técnico' } },
    { collection: 'projetos', data: db.projetos[0], route: '/projetos/PRJ%202026-01', body: { codigo: 'PRJ 2026-01', titulo: 'Projeto Teste', descricao: null, cpfCoordenador: '00123456789', dataInicio: '2026-01-01', dataTermino: null, situacao: 'Em andamento' } },
    { collection: 'financiamentos', data: db.financiamentos[0], route: '/financiamentos/41', body: { agenciaFinanciadora: 'Agência Teste', tipoFomento: 'Bolsa', valorTotal: 1234.56, dataInicioVigencia: '2026-01-01', dataFimVigencia: null } },
    { collection: 'producoes', data: db.producoes[0], route: '/producoes/73', body: { codigoProjeto: 'PRJ 2026-01', titulo: 'Produção Teste', tipo: 'Artigo', anoPublicacao: '2026', meioDivulgacao: null } },
    { collection: 'vinculosParticipacao', data: db.vinculosParticipacao[0], route: '/vinculos-projeto/PRJ%202026-01/00123456789', body: { codigoProjeto: 'PRJ 2026-01', cpfParticipante: '00123456789', funcao: 'Coordenador', dataEntrada: '2026-01-01', dataSaida: null } },
    { collection: 'financiamentosProjeto', data: db.financiamentosProjeto[0], route: '/vinculos-financiamento/89', body: { idFinanciamento: 41, codigoProjeto: 'PRJ 2026-01', tipoApoio: 'Parcial', valorApoio: null } },
    { collection: 'autoresProducao', data: db.autoresProducao[0], route: '/vinculos-producao/00123456789/73', body: { idProducao: 73, cpfParticipante: '00123456789', tipoParticipacao: 'Autor Principal', dataInicio: '2026-01-01', dataTermino: null } },
  ];
}

test('carrega as sete listas e preserva IDs, relacionamentos, datas e valores nulos', async () => {
  const db = await service().load();
  assert.equal(requests.length, 7);
  assert(requests.every(request => request.method === 'GET'));
  assert.equal(db.participantes[1].tipo, 'Tecnico');
  assert.equal(db.participantes[1].email, 'tecnico@example.test');
  assert.equal(db.projetos[0].coordenadorId, db.participantes[0].id);
  assert.equal(db.producoes[0].projetoId, db.projetos[0].id);
  assert.equal(db.producoes[0].ano, 2026);
  assert.equal(db.financiamentos[0].id, 41);
  assert.equal(db.producoes[0].id, 73);
  assert.equal(db.financiamentosProjeto[0].id, 89);
  assert.equal(db.financiamentosProjeto[0].financiamentoId, 41);
  assert.equal(db.financiamentosProjeto[0].valorApoio, undefined);
  assert.equal(db.vinculosParticipacao[0].dataSaida, '');
  assert.equal(db.autoresProducao[0].dataTermino, '');
  assert.equal(db.financiamentos[0].valorTotal, 1234.56);
});

test('mantém as identidades locais quando a ordem da resposta muda', async () => {
  const api = service();
  const original = await api.load();
  responses.participantes = [...fixture.participantes].reverse();
  const updated = await api.load();
  for (const participant of original.participantes) {
    assert.equal(updated.participantes.find(p => p.cpf === participant.cpf)?.id, participant.id);
  }
  assert.equal(updated.projetos[0].coordenadorId, original.projetos[0].coordenadorId);
});

test('POST das sete coleções envia os campos Java, sem IDs locais ou nomes derivados', async t => {
  const api = service();
  const db = await api.load();
  for (const scenario of scenarios(db)) {
    await t.test(scenario.collection, async () => {
      const input = { ...scenario.data, id: undefined };
      await api.save(scenario.collection, input, db);
      assert.deepEqual(requests.at(-1), {
        method: 'POST', path: '/api' + scenario.route.slice(0, scenario.route.indexOf('/', 1)), body: scenario.body,
      });
    });
  }
});

test('PUT das sete coleções usa a chave real de cada endpoint e aceita respostas textuais', async t => {
  const api = service();
  const db = await api.load();
  for (const scenario of scenarios(db)) {
    await t.test(scenario.collection, async () => {
      await api.save(scenario.collection, scenario.data, db);
      assert.deepEqual(requests.at(-1), { method: 'PUT', path: '/api' + scenario.route, body: scenario.body });
    });
  }
});

test('DELETE das sete coleções usa as chaves corretas e aceita 204 vazio', async t => {
  const api = service();
  const db = await api.load();
  for (const scenario of scenarios(db)) {
    await t.test(scenario.collection, async () => {
      await api.remove(scenario.collection, scenario.data, db);
      assert.deepEqual(requests.at(-1), { method: 'DELETE', path: '/api' + scenario.route, body: undefined });
    });
  }
});

test('normaliza CPF com máscara sem perder zeros à esquerda', async () => {
  assert.equal(normalizeCpf('001.234.567-89'), '00123456789');
  assert.throws(() => normalizeCpf('123'), /11 dígitos/);
  const api = service();
  const db = await api.load();
  await api.save('participantes', { ...db.participantes[0], cpf: '001.234.567-89' }, db);
  const request = requests.at(-1)!;
  assert.equal((request.body as { cpf: string }).cpf, '00123456789');
  assert.equal(request.path, '/api/participantes/00123456789');
});

test('não simula alterações de chaves que o PUT do back-end não suporta', async () => {
  const api = service();
  const db = await api.load();
  const requestCount = requests.length;
  await assert.rejects(api.save('participantes', { ...db.participantes[0], cpf: '00123456780' }, db), /não permite alterar o CPF/);
  await assert.rejects(api.save('projetos', { ...db.projetos[0], codigo: 'OUTRO' }, db), /não permite alterar o código/);
  await assert.rejects(api.save('vinculosParticipacao', { ...db.vinculosParticipacao[0], participanteId: db.participantes[1].id }, db), /não permite alterar/);
  await assert.rejects(api.save('autoresProducao', { ...db.autoresProducao[0], participanteId: db.participantes[1].id }, db), /não permite alterar/);
  await assert.rejects(api.save('financiamentosProjeto', { ...db.financiamentosProjeto[0], financiamentoId: 999 }, db), /não permite alterar/);
  assert.equal(requests.length, requestCount);
});

test('propaga conflitos da API sem modificar o estado local', async () => {
  const api = service();
  const db = await api.load();
  const before = structuredClone(db);
  failure = { path: '/api/participantes', status: 409, body: 'Erro: CPF ou E-mail institucional já cadastrado no sistema.' };
  await assert.rejects(api.save('participantes', { ...db.participantes[0], id: undefined }, db), error => {
    assert.equal(getApiErrorMessage(error), failure!.body);
    return true;
  });
  assert.deepEqual(db, before);
});

test('rejeita resposta de listagem fora do contrato e cancela leituras obsoletas', async () => {
  responses.participantes = { content: [] };
  await assert.rejects(service().load(), /lista inválida/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(service().load(controller.signal), axios.isCancel);
});

test('preserva ano nulo e informa falhas de conexão sem expor configuração', async () => {
  responses.producoes = [{ ...fixture.producoes[0], anoPublicacao: null }];
  assert.equal((await service().load()).producoes[0].ano, undefined);
  const error = new axios.AxiosError('internal connection details', 'ERR_NETWORK');
  assert.equal(getApiErrorMessage(error), 'Não foi possível conectar à API. Verifique se o back-end está ativo e acessível.');
});
