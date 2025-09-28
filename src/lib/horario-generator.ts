
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
        const reglaNoRepetir = reglas.find((r: any) => r.id === "R3" && r.activa);
        
        let bloquesHorario: any[] = [];
        const HORAS_SIN_RECESO = [
            '07:00-07:50', '07:50-08:40', '08:40-09:30',
            '10:00-10:50', '10:50-11:40', '11:40-12:30', '12:30-13:20'
        ];
        const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

        const grupoKeyActual = `${nivelId}_${grupo}`;

        // 1. Añadir bloques fijos para este grupo
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

        // 2. Crear una lista de todas las horas que se necesitan (excluyendo las ya fijadas)
        const horasTotalesNecesarias: any[] = [];
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
                const horasYaAsignadas = bloquesHorario.filter(b => b.asignatura === nombreAsignaturaLimpio && b.docenteId === docenteId).length;
                const horasRestantes = horasSemanales - horasYaAsignadas;

                for (let i = 0; i < horasRestantes; i++) {
                    horasTotalesNecesarias.push({
                        id: nanoid(),
                        asignatura: nombreAsignaturaLimpio,
                        docenteId,
                    });
                }
            }
        });
        
        // 3. Crear matriz de disponibilidad (considerando todos los grupos y docentes)
        const disponibilidad: Record<string, Record<string, string | null>> = {};
        Object.entries(horarios).forEach(([grupoKey, bloques]) => {
            if(Array.isArray(bloques) && grupoKey !== grupoKeyActual){
                bloques.forEach((bloque:any) => {
                    if (bloque.docenteId) {
                        if (!disponibilidad[bloque.docenteId]) disponibilidad[bloque.docenteId] = {};
                        disponibilidad[bloque.docenteId][`${bloque.dia}_${bloque.hora}`] = grupoKey;
                    }
                })
            }
        });
        
        let shuffledHoras = horasTotalesNecesarias.sort(() => Math.random() - 0.5);
        let bloquesNoAsignados: any[] = [];

        // 4. Intentar asignar los bloques restantes
        const celdasDisponibles = DIAS.flatMap(dia => HORAS_SIN_RECESO.map(hora => ({dia, hora})))
            .filter(({dia, hora}) => !bloquesHorario.some(b => b.dia === dia && b.hora === hora))
            .sort(() => Math.random() - 0.5);

        for (const bloqueNecesario of shuffledHoras) {
            let asignado = false;
            for (const celda of celdasDisponibles) {
                const { dia, hora } = celda;
                const celdaOcupadaLocalmente = bloquesHorario.some(b => b.dia === dia && b.hora === hora);
                if (celdaOcupadaLocalmente) continue;

                const docenteId = bloqueNecesario.docenteId;
                const restriccionesDocente = restricciones[docenteId] || { noDisponibles: [], preferidos: [] };
                const noDisponible = restriccionesDocente.noDisponibles.includes(`${dia}_${hora}`);
                const docenteOcupadoEnOtroLado = disponibilidad[docenteId] && disponibilidad[docenteId][`${dia}_${hora}`];
                const materiaYaAsignadaHoy = reglaNoRepetir && bloquesHorario.some(b => b.dia === dia && b.asignatura === bloqueNecesario.asignatura);

                if (!noDisponible && !docenteOcupadoEnOtroLado && !materiaYaAsignadaHoy) {
                    bloquesHorario.push({ dia, hora, ...bloqueNecesario });
                    
                    // Marcar celda como ocupada para futuras iteraciones en este bucle
                    const celdaIndex = celdasDisponibles.findIndex(c => c.dia === dia && c.hora === hora);
                    if(celdaIndex > -1) celdasDisponibles.splice(celdaIndex, 1);
                    
                    asignado = true;
                    break;
                }
            }
            if (!asignado) {
                bloquesNoAsignados.push(bloqueNecesario);
            }
        }
        
        const horarioGenerado = { ...horarios, [grupoKeyActual]: bloquesHorario };
        return { horarioGenerado, bloquesNoAsignados };

    } catch (error) {
        console.error("Error generando el horario:", error);
        return { horarioGenerado: horarios, bloquesNoAsignados: [] };
    }
}
