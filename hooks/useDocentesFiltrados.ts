
import { useMemo } from 'react';
import { useAppStore } from '@/store/useDistribucionStore';
import type { Docente } from '@/app/page';

export function useDocentesFiltrados(asignatura: string): Docente[] {
  const docentes = useAppStore(state => state.docentes);

  return useMemo(() => {
    if (!asignatura) {
      return [];
    }
    return docentes.filter(d => 
        d.id && d.id.trim() !== "" && (d.asignaturas || []).includes(asignatura)
    );
  }, [docentes, asignatura]);
}
