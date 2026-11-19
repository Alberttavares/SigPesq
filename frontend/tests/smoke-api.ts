import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd(), true);
const { getApiErrorMessage } = await import('../src/services/http');

try {
  const { researchService } = await import('../src/services/research');
  const db = await researchService.load();
  for (const [collection, rows] of Object.entries(db)) {
    console.log(`${collection}: GET OK (${rows.length} registros)`);
  }
} catch (error) {
  console.error(getApiErrorMessage(error));
  process.exitCode = 1;
}
