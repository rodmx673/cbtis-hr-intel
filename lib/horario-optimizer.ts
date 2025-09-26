
'use client';

import { useAppStore } from '@/store/useDistribucionStore';

// Función para limpiar el nombre de la asignatura (si es necesario)
function limpiarNombreAsignatura(nombre: string): string {
    if (!nombre) return '';
    const regex = /^(.*?)\1$/;
    const match = nombre.trim().match(regex);
    if (match) {
        return match[1].trim();
    }
    return nombre.trim();
}


export function optimizarHorario(
  nivelId: string, 
  grupo: string
): { horarioOptimizado: Record<string, any[]>, bloquesNoAsignados: any[] } {

  const { horarios, restricciones, bloquesSinAsignar, reglas } = useAppStore.getState();
  const grupoKey = `${nivelId}_${grupo}`;
  const horarioActual = JSON.parse(JSON.stringify(horarios));
  let bloquesPorAsignar = JSON.parse(JSON.stringify(bloquesSinAsignar[grupoKey] || []));
  let bloquesHorario = horarioActual[grupoKey] || [];

  const reglaNoRepetirAsignatura = reglas.find((r: any) => r.id === "R3" && r.activa);
  
  const HORAS_SIN_RECESO = [
      '07:00-07:50', '07:50-08:40', '08:40-09:30',
      '10:00-10:50', '10:50-11:40', '11:40-12:30', '12:30-13:20'
  ];
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  // 1. Crear matriz de disponibilidad de docentes (considerando todos los grupos)
  const disponibilidadDocentes: Record<string, Record<string, boolean>> = {};
  Object.entries(horarioActual).forEach(([gKey, bloques]) => {
      if(Array.isArray(bloques)){
          bloques.forEach((bloque:any) => {
              if (bloque.docenteId) {
                  if (!disponibilidadDocentes[bloque.docenteId]) disponibilidadDocentes[bloque.docenteId] = {};
                  disponibilidadDocentes[bloque.docenteId][`${bloque.dia}_${bloque.hora}`] = true;
              }
          })
      }
  });

  const esCeldaValida = (bloque: any, dia: string, hora: string, horarioTemporal: any[]) => {
      // Conflicto: Celda ya ocupada en el horario del grupo
      if (horarioTemporal.some((b: any) => b.dia === dia && b.hora === hora)) {
          return false;
      }
      
      // Conflicto: Restricción del docente
      const restriccionesDocente = restricciones[bloque.docenteId] || { noDisponibles: [] };
      if (restriccionesDocente.noDisponibles.includes(`${dia}_${hora}`)) {
          return false;
      }
      
      // Conflicto: Docente ocupado en otro grupo
      if (disponibilidadDocentes[bloque.docenteId]?.[`${dia}_${hora}`]) {
          return false;
      }

      // Conflicto: Asignatura repetida en el mismo día (si la regla está activa)
      if (reglaNoRepetirAsignatura && horarioTemporal.some((b: any) => b.dia === dia && b.asignatura === bloque.asignatura)) {
          return false;
      }
      
      return true;
  }

  // 2. Intento 1: Asignación simple en espacios vacíos
  const bloquesAunSinAsignar: any[] = [];
  bloquesPorAsignar.forEach((bloque: any) => {
      let asignado = false;
      for (const dia of DIAS) {
          for (const hora of HORAS_SIN_RECESO) {
              if (esCeldaValida(bloque, dia, hora, bloquesHorario)) {
                  bloquesHorario.push({ ...bloque, dia, hora });
                  
                  if (!disponibilidadDocentes[bloque.docenteId]) disponibilidadDocentes[bloque.docenteId] = {};
                  disponibilidadDocentes[bloque.docenteId][`${dia}_${hora}`] = true;

                  asignado = true;
                  break;
              }
          }
          if (asignado) break;
      }
      if (!asignado) {
          bloquesAunSinAsignar.push(bloque);
      }
  });
  
  bloquesPorAsignar = bloquesAunSinAsignar;

  // 3. Intento 2: Swapping (intercambio de bloques)
  if (bloquesPorAsignar.length > 0) {
      const bloquesRestantesDespuesDeSwap: any[] = [];
      bloquesPorAsignar.forEach((bloqueAAsignar: any) => {
          let asignadoConSwap = false;
          
          for (const bloqueAMover of bloquesHorario.filter((b: any) => !b.fijo)) {
              const horarioSinBloqueMovido = bloquesHorario.filter((b:any) => b.id !== bloqueAMover.id);

              // Check si la celda original del bloque a mover es un lugar válido para el nuevo bloque
              if (esCeldaValida(bloqueAAsignar, bloqueAMover.dia, bloqueAMover.hora, horarioSinBloqueMovido)) {
                  // Ahora, buscar un nuevo hogar para el bloque que estamos moviendo
                  for (const dia of DIAS) {
                      for (const hora of HORAS_SIN_RECESO) {
                           if (esCeldaValida(bloqueAMover, dia, hora, horarioSinBloqueMovido)) {
                               
                               // ¡Swap exitoso!
                               const celdaOriginal = { dia: bloqueAMover.dia, hora: bloqueAMover.hora };
                               
                               // Mover el bloque existente a la nueva celda
                               bloqueAMover.dia = dia;
                               bloqueAMover.hora = hora;
                               
                               // Insertar el nuevo bloque en la celda original del bloque movido
                               bloquesHorario.push({ ...bloqueAAsignar, ...celdaOriginal });

                               asignadoConSwap = true;
                               break;
                           }
                      }
                      if (asignadoConSwap) break;
                  }
              }
              if (asignadoConSwap) break;
          }

          if (!asignadoConSwap) {
              bloquesRestantesDespuesDeSwap.push(bloqueAAsignar);
          }
      });
      bloquesPorAsignar = bloquesRestantesDespuesDeSwap;
  }

  horarioActual[grupoKey] = bloquesHorario;

  return { horarioOptimizado: horarioActual, bloquesNoAsignados: bloquesPorAsignar };
}
