# Estrutura do banco sigpesq

O arquivo `sigpesq.sql` cria somente as sete tabelas ausentes no banco existente
`sigpesq`, usando `CREATE TABLE IF NOT EXISTS`. Não contém criação do banco,
remoção ou alteração de tabelas, inserção de dados, cascatas ou triggers.
Pode ser importado no phpMyAdmin, em **sigpesq > Importar**, com codificação UTF-8.
Tabelas já existentes são preservadas, mas não são corrigidas nem validadas pelo
`IF NOT EXISTS`. O `SELECT` final permite conferir a presença das sete tabelas.

## Origem e limites da reconstrução

Não foi encontrado um DDL anterior no projeto. A estrutura foi reconstruída a
partir dos arquivos em `api/src/main/java/com/sigpesq/api/model`, `repository` e
`controller`, além do README da raiz. As colunas persistidas vêm dos `INSERT`,
`UPDATE`, `SELECT` e `RowMapper` dos repositories. Campos como
`nomeCoordenador`, `tituloProjeto`, `nomeParticipante`, `tipoParticipante` e
`tituloProducao` são resultados de `JOIN`, não colunas adicionais nas tabelas
de vínculo.

Os modelos Java não possuem anotações que determinem tamanhos de `VARCHAR`,
precisão/escala de `BigDecimal` ou toda a nulabilidade. Por isso, não é possível
recuperar exatamente esses aspectos do esquema original apenas pelo código.
O script adota explicitamente estas escolhas de implementação:

- CPF: `CHAR(11)`, preservando zeros à esquerda e o formato dos exemplos da API.
- Código do projeto e demais textos curtos: `VARCHAR(255)`.
- Descrição do projeto: `TEXT` opcional.
- Valores monetários: `DECIMAL(15,2)`, com 13 casas inteiras e duas decimais.
- Datas Java `LocalDate`: `DATE`; são opcionais, acompanhando o tratamento de
  valores nulos nos repositories. Não foram presumidas datas padrão.
- Ano da publicação: `YEAR`, conforme o README da API e o parâmetro JDBC
  `yearIsDateType=false`; pode ser nulo. O tipo possui o intervalo do servidor
  MySQL/MariaDB, não o intervalo irrestrito de uma `String` Java.
- Identificadores, referências, nomes/títulos e classificações principais são
  obrigatórios. Essa obrigatoriedade dos textos sem validação explícita no Java
  é uma decisão deste DDL, não uma restrição original recuperada.
- `meio_divulgacao` é opcional. `valor_apoio` aceita `NULL`, como exige o comentário
  e o fluxo de `VinculoFinanciamentoProjetoRepository.validarSaldoDisponivel`.
- InnoDB, `utf8mb4` e `utf8mb4_general_ci`, compatíveis com o banco local consultado.

## Colunas e chaves

`NN` significa `NOT NULL`; as demais colunas aceitam `NULL`.

| Tabela | Colunas persistidas |
| --- | --- |
| `participante` | `cpf CHAR(11) NN`, `nome VARCHAR(255) NN`, `email_institucional VARCHAR(255) NN`, `tipo ENUM('Docente','Discente','Técnico') NN` |
| `projeto` | `codigo VARCHAR(255) NN`, `titulo VARCHAR(255) NN`, `descricao TEXT`, `data_inicio DATE`, `data_termino DATE`, `situacao ENUM('Em andamento','Concluido','Cancelado') NN`, `cpf_coordenador CHAR(11) NN` |
| `financiamento` | `id_financiamento INT NN AUTO_INCREMENT`, `agencia_financiadora VARCHAR(255) NN`, `tipo_fomento VARCHAR(255) NN`, `valor_total DECIMAL(15,2) NN`, `data_inicio_vigencia DATE`, `data_fim_vigencia DATE` |
| `producao_cientifica` | `id_producao INT NN AUTO_INCREMENT`, `codigo_projeto VARCHAR(255) NN`, `titulo VARCHAR(255) NN`, `tipo VARCHAR(255) NN`, `ano_publicacao YEAR`, `meio_divulgacao VARCHAR(255)` |
| `vinculo_participacao_projeto` | `cpf_participante CHAR(11) NN`, `codigo_projeto VARCHAR(255) NN`, `funcao VARCHAR(255) NN`, `data_entrada DATE`, `data_saida DATE` |
| `vinculo_financiamento_projeto` | `id_vinculo_financiamento INT NN AUTO_INCREMENT`, `id_financiamento INT NN`, `codigo_projeto VARCHAR(255) NN`, `tipo_apoio ENUM('Total','Parcial') NN`, `valor_apoio DECIMAL(15,2)` |
| `vinculo_participante_producao` | `id_producao INT NN`, `cpf_participante CHAR(11) NN`, `tipo_participacao VARCHAR(255) NN`, `data_inicio DATE`, `data_termino DATE` |

| Tabela | Chave primária | Chaves estrangeiras |
| --- | --- | --- |
| `participante` | `cpf` | — |
| `projeto` | `codigo` | `cpf_coordenador -> participante.cpf` |
| `financiamento` | `id_financiamento` | — |
| `producao_cientifica` | `id_producao` | `codigo_projeto -> projeto.codigo` |
| `vinculo_participacao_projeto` | `(cpf_participante, codigo_projeto)` | `cpf_participante -> participante.cpf`, `codigo_projeto -> projeto.codigo` |
| `vinculo_financiamento_projeto` | `id_vinculo_financiamento` | `id_financiamento -> financiamento.id_financiamento`, `codigo_projeto -> projeto.codigo` |
| `vinculo_participante_producao` | `(cpf_participante, id_producao)` | `cpf_participante -> participante.cpf`, `id_producao -> producao_cientifica.id_producao` |

Os três identificadores numéricos são `INT` com sinal e `AUTO_INCREMENT`, pois
os repositories não os informam no `INSERT` e os leem com `getInt`.
Não foram adicionados IDs artificiais às tabelas de participação e autoria:
seus `UPDATE` e `DELETE` usam os pares de chaves acima.

## Restrições e regras

- CPF e código do projeto são únicos por suas chaves primárias.
- E-mail institucional possui restrição `UNIQUE`, de acordo com o tratamento
  de duplicidade no controller de participantes.
- Os valores de `tipo`, `situacao` e `tipo_apoio` acompanham os controllers
  atuais. Em particular, o back-end aceita **Técnico**, com acento, embora
  os mocks do front-end e um trecho do README usem `Tecnico`.
- Não foi criado ENUM para tipo de produção, função ou tipo de participação,
  pois o código não define conjuntos fechados para esses campos.
- Cinco `CHECK` acompanham validações presentes na API: valor total positivo,
  valor de apoio positivo quando informado, ordem das datas de vigência,
  tipo de participação não vazio após `TRIM` e ordem das datas de autoria.
  A verificação SQL com `TRIM` não pretende reproduzir integralmente
  `String.isBlank()` para todos os caracteres de espaço Unicode do Java.
- As oito FKs usam `ON DELETE RESTRICT ON UPDATE RESTRICT`, impedindo exclusões
  ou mudanças de chave que deixariam referências órfãs. Não há cascatas.
- Permanecem na lógica existente da API: exigência de coordenador docente,
  no máximo um coordenador principal nos vínculos do projeto e limite da soma
  de apoios por financiamento. São regras entre linhas/tabelas e não foram
  substituídas por triggers neste script.
- Não foi presumida uma restrição `UNIQUE(id_financiamento, codigo_projeto)`,
  pois os repositories não estabelecem essa unicidade.

## Conferência sem alterar dados

```sql
SHOW TABLES FROM sigpesq;

SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE
FROM information_schema.TABLE_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = 'sigpesq'
ORDER BY TABLE_NAME, CONSTRAINT_TYPE, CONSTRAINT_NAME;
```

A estrutura nova contém 38 colunas, sete chaves primárias, oito chaves
estrangeiras, uma restrição de e-mail único e cinco restrições `CHECK`.
Verificar a estrutura não requer cadastrar registros nem chamar endpoints
`POST`, `PUT` ou `DELETE`.
