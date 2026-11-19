'use client';

import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Database } from '../Utils/types';
import { createEmptyDatabase, researchService } from '../services/research';
import type { CollectionName, RecordOf } from '../services/research';
import { getApiErrorMessage } from '../services/http';

export interface ResearchActions {
  save: <K extends CollectionName>(collection: K, data: Partial<RecordOf<K>>) => Promise<boolean>;
  remove: <K extends CollectionName>(collection: K, data: RecordOf<K>) => Promise<boolean>;
}

export function useResearchData(enabled: boolean, route: string, showMessage: (type: 'success' | 'error', text: string) => void) {
  const [db, setDb] = useState<Database>(createEmptyDatabase);
  const snapshot = useRef(db);
  const ready = useRef(false);
  const writing = useRef(false);
  const sequence = useRef(0);
  const reads = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    const version = ++sequence.current;
    reads.current?.abort();
    const controller = new AbortController();
    reads.current = controller;
    const loaded = await researchService.load(controller.signal);
    if (version === sequence.current && !controller.signal.aborted) {
      snapshot.current = loaded;
      ready.current = true;
      setDb(loaded);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void refresh().catch(error => {
        if (!axios.isCancel(error)) showMessage('error', getApiErrorMessage(error));
      });
    } else {
      ready.current = false;
    }
    return () => {
      reads.current?.abort();
    };
  }, [enabled, route, refresh, showMessage]);

  async function mutate(operation: () => Promise<void>): Promise<boolean> {
    if (!ready.current) throw new Error('Aguarde o carregamento dos dados da API ou atualize a página para tentar novamente.');
    if (writing.current) throw new Error('Aguarde a conclusão da operação em andamento.');
    writing.current = true;
    try {
      await operation();
      try {
        await refresh();
        return true;
      } catch (error) {
        // A escrita foi confirmada. Não sugerir repetir um POST já concluído.
        ready.current = false;
        if (!axios.isCancel(error)) showMessage('error', 'A operação foi concluída na API, mas a lista não pôde ser atualizada. Atualize a página antes de continuar.');
        return false;
      }
    } finally {
      writing.current = false;
    }
  }

  const actions: ResearchActions = {
    save: (collection, data) => mutate(() => researchService.save(collection, data, snapshot.current)),
    remove: (collection, data) => mutate(() => researchService.remove(collection, data, snapshot.current)),
  };

  return { db, actions };
}
