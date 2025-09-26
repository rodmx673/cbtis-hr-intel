
import { useAppStore } from '@/store/useDistribucionStore';
import { nanoid } from 'nanoid';

function limpiarNombreAsignatura(nombre: string): string {
    if (!nombre) return '';
    const regex = /^(.*?)\1$/;
    const match = nombre.trim().match(regex);
    if (match) {
        return match[1].trim();
    }
    return nombre.trim();
}

export function generarHorarioDesdeDistribucion(nivelId: string, grupo: string) {
    const { distribuciones, datos, restricciones, horarios, reglas, bloquesFijos } = useAppStore.getState();

    try {
        const distribucionesNivel = distribuciones[nivelId] || [];
        const reglaNoRepetirAsignatura = reglas.find((r: any) => r.id === "R3" && r.activa);
        
        let bloquesHorario: any[] = [];
        const HORAS_SIN_RECESO = [
            '07:00-07:50', '07:50-08:40', '08:40-09:30',
            '10:00-10:50', '10:50-11:40', '11:40-12:30', '12:30-13:20'
        ];
        const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

        const grupoKeyActual = `${nivelId}_${grupo}`;

        // 1. Añadir bloques fijos para este grupo. Estos son inamovibles.
        const bloquesFijosGrupo = bloquesFijos.filter((b:any) => b.nivelId === nivelId && b.grupo === grupo && b.bloqueado);
        bloquesFijosGrupo.forEach((fijo:any) => {
            bloquesHorario.push({
                id: nanoid(),
                dia: fijo.dia,
                hora: fijo.hora,
                asignatura: limpiarNombreAsignatura(fijo.asignatura),
                docenteId: fijo.docenteId,
                fijo: true
            });
        });

        // 2. Crear una lista de todos los bloques que se necesitan generar (excluyendo los ya fijados)
        const bloquesNecesarios: any[] = [];
        const asignaturasDelGrupo = distribucionesNivel.filter((dist: any) => 
            dist.grupos[['A', 'B', 'C', 'D', 'E', 'F'].indexOf(grupo)]
        );

        asignaturasDelGrupo.forEach((dist: any) => {
            const asignaturaInfo = (datos[nivelId] || []).find((d: any) => d.asignatura === dist.asignatura);
            const horasSemanales = asignaturaInfo ? parseInt(asignaturaInfo.horas, 10) : 0;
            const grupoIndex = ['A', 'B', 'C', 'D', 'E', 'F'].indexOf(grupo);
            const docenteId = dist.grupos[grupoIndex];
            const nombreAsignaturaLimpio = limpiarNombreAsignatura(dist.asignatura);

            if (horasSemanales > 0 && docenteId) {
                const horasYaFijadas = bloquesHorario.filter(b => b.asignatura === nombreAsignaturaLimpio && b.docenteId === docenteId).length;
                const horasRestantes = horasSemanales - horasYaFijadas;
                for (let i = 0; i < horasRestantes; i++) {
                    bloquesNecesarios.push({
                        id: nanoid(),
                        asignatura: nombreAsignaturaLimpio,
                        docenteId,
                    });
                }
            }
        });
        
        // 3. Crear matriz de disponibilidad de docentes (considerando todos los otros grupos)
        const disponibilidadDocentes: Record<string, Record<string, boolean>> = {};
        Object.entries(horarios).forEach(([grupoKey, bloques]) => {
            if(Array.isArray(bloques) && grupoKey !== grupoKeyActual){
                bloques.forEach((bloque:any) => {
                    if (bloque.docenteId) {
                        if (!disponibilidadDocentes[bloque.docenteId]) disponibilidadDocentes[bloque.docenteId] = {};
                        disponibilidadDocentes[bloque.docenteId][`${bloque.dia}_${bloque.hora}`] = true;
                    }
                })
            }
        });
        
        // 4. Algoritmo de asignación con puntuación
        let bloquesNoAsignados: any[] = [];
        let celdasDisponibles = DIAS.flatMap(dia => HORAS_SIN_RECESO.map(hora => ({dia, hora})))
            .filter(({dia, hora}) => !bloquesHorario.some(b => b.dia === dia && b.hora === hora));

        for (const bloque of bloquesNecesarios) {
            let mejorCelda = null;
            let maxPuntuacion = -Infinity;

            for (const celda of celdasDisponibles) {
                const { dia, hora } = celda;
                const docenteId = bloque.docenteId;
                
                // --- Comprobación de restricciones (reglas duras) ---
                const restriccionesDocente = restricciones[docenteId] || { noDisponibles: [] };
                const noDisponible = restriccionesDocente.noDisponibles.includes(`${dia}_${hora}`);
                const docenteOcupado = disponibilidadDocentes[docenteId]?.[`${dia}_${hora}`];
                const asignaturaRepetidaHoy = reglaNoRepetirAsignatura && bloquesHorario.some(b => b.dia === dia && b.asignatura === bloque.asignatura);
                
                if (noDisponible || docenteOcupado || asignaturaRepetidaHoy) {
                    continue; // Celda no válida para este bloque
                }

                // --- Cálculo de puntuación (heurísticas) ---
                let puntuacion = 0;
                const clasesDelDocenteEnDia = bloquesHorario.filter(b => b.docenteId === docenteId && b.dia === dia).length;
                puntuacion -= clasesDelDocenteEnDia; // Penaliza por más clases en el mismo día para balancear

                if (puntuacion > maxPuntuacion) {
                    maxPuntuacion = puntuacion;
                    mejorCelda = celda;
                }
            }

            if (mejorCelda) {
                bloquesHorario.push({ ...bloque, ...mejorCelda });
                // Actualizar disponibilidad para el siguiente bloque
                disponibilidadDocentes[bloque.docenteId] = disponibilidadDocentes[bloque.docenteId] || {};
                disponibilidadDocentes[bloque.docenteId][`${mejorCelda.dia}_${mejorCelda.hora}`] = true;
                // Remover celda de la lista de disponibles
                celdasDisponibles = celdasDisponibles.filter(c => c.dia !== mejorCelda.dia || c.hora !== mejorCelda.hora);
            } else {
                bloquesNoAsignados.push(bloque);
            }
        }
        
        const horarioGenerado = { ...horarios, [grupoKeyActual]: bloquesHorario };
        return { horarioGenerado, bloquesNoAsignados };

    } catch (error) {
        console.error("Error generando el horario:", error);
        return { horarioGenerado: horarios, bloquesNoAsignados: [] };
    }
}
