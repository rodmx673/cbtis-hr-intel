

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Nivel, Docente, DistribucionRow, Aula } from '@/lib/types';
import { initialDocentes } from '@/data/docentes';
import { nanoid } from 'nanoid';

export interface InstitucionInfo {
    nombre: string;
    cicloEscolar: string;
    director: string;
    direccion: string;
    email: string;
    telefono: string;
}


// Estructuras de datos iniciales
const initialNiveles: Nivel[] = [
  { id: 'grado-1', tipo: 'Grado', nombre: '1° Grado' },
  { id: 'grado-2', tipo: 'Grado', nombre: '2° Grado' },
  { id: 'grado-3', tipo: 'Grado', nombre: '3° Grado' },
];

const initialDatos: Record<string, any[]> = {
  'grado-1': [
    { id: '1-1', asignatura: 'Español', horas: '5', especialidad: false },
    { id: '1-2', asignatura: 'Matemáticas', horas: '5', especialidad: false },
    { id: '1-3', asignatura: 'Ciencias', horas: '4', especialidad: false },
    { id: '1-4', asignatura: 'Geografía', horas: '4', especialidad: false },
    { id: '1-5', asignatura: 'Historia', horas: '3', especialidad: false },
    { id: '1-6', asignatura: 'Tecnología', horas: '3', especialidad: true },
    { id: '1-7', asignatura: 'Inglés', horas: '3', especialidad: true },
    { id: '1-8', asignatura: 'Artes', horas: '3', especialidad: true },
    { id: '1-9', asignatura: 'Educación Física', horas: '2', especialidad: true },
    { id: '1-10', asignatura: 'Formación', horas: '2', especialidad: false },
    { id: '1-11', asignatura: 'Vida Saludable', horas: '2', especialidad: false },
    { id: '1-12', asignatura: 'Tutoría', horas: '1', especialidad: false },
  ],
  'grado-2': [
    { id: '2-1', asignatura: 'Español', horas: '5', especialidad: false },
    { id: '2-2', asignatura: 'Matemáticas', horas: '5', especialidad: false },
    { id: '2-3', asignatura: 'Ciencias', horas: '4', especialidad: false },
    { id: '2-4', asignatura: 'Geografía', horas: '4', especialidad: false },
    { id: '2-5', asignatura: 'Historia', horas: '3', especialidad: false },
    { id: '2-6', asignatura: 'Tecnología', horas: '3', especialidad: true },
    { id: '2-7', asignatura: 'Inglés', horas: '3', especialidad: true },
    { id: '2-8', asignatura: 'Artes', horas: '3', especialidad: true },
    { id: '2-9', asignatura: 'Educación Física', horas: '2', especialidad: true },
    { id: '2-10', asignatura: 'Formación', horas: '2', especialidad: false },
    { id: '2-11', asignatura: 'Vida Saludable', horas: '2', especialidad: false },
    { id: '2-12', asignatura: 'Tutoría', horas: '1', especialidad: false },
  ],
  'grado-3': [
    { id: '3-1', asignatura: 'Español', horas: '5', especialidad: false },
    { id: '3-2', asignatura: 'Matemáticas', horas: '5', especialidad: false },
    { id: '3-3', asignatura: 'Ciencias', horas: '4', especialidad: false },
    { id: '3-4', asignatura: 'Geografía', horas: '4', especialidad: false },
    { id: '3-5', asignatura: 'Historia', horas: '3', especialidad: false },
    { id: '3-6', asignatura: 'Tecnología', horas: '3', especialidad: true },
    { id: '3-7', asignatura: 'Inglés', horas: '3', especialidad: true },
    { id: '3-8', asignatura: 'Artes', horas: '3', especialidad: true },
    { id: '3-9', asignatura: 'Educación Física', horas: '2', especialidad: true },
    { id: '3-10', asignatura: 'Formación', horas: '2', especialidad: false },
    { id: '3-11', asignatura: 'Vida Saludable', horas: '2', especialidad: false },
    { id: '3-12', asignatura: 'Tutoría', horas: '1', especialidad: false },
  ]
};

const initialHorasObjetivo = { 'grado-1': 36, 'grado-2': 36, 'grado-3': 36 };

const initialDistribuciones: Record<string, DistribucionRow[]> = {
  'grado-1': [
    { id: nanoid(), asignatura: 'Español', horas: '5', grupos: ['RELC', 'RELC', 'RELC', 'RELC', 'RELC', 'RELC'] },
    { id: nanoid(), asignatura: 'Inglés', horas: '3', grupos: ['NGGR', 'NGGR', 'CFRM', 'MSPG', 'MSPG', 'MSPG'] },
    { id: nanoid(), asignatura: 'Artes', horas: '3', grupos: ['MRDC', 'NAGH', 'NAGH', 'JAAZ', 'NAGH', 'NAGH'] },
    { id: nanoid(), asignatura: 'Matemáticas', horas: '5', grupos: ['ARCM', 'ARCM', 'ARCM', 'ARCM', 'THRR', 'MEDA'] },
    { id: nanoid(), asignatura: 'Ciencias', horas: '4', grupos: ['EEDA', 'EEDA', 'EEDA', 'EEDA', 'EEDA', 'JAcHB'] },
    { id: nanoid(), asignatura: 'Geografía', horas: '4', grupos: ['AAHS', 'AAHS', 'AAHS', 'AVAR', 'AVAR', 'AVAR'] },
    { id: nanoid(), asignatura: 'Historia', horas: '3', grupos: ['DDJ', 'DDJ', 'DDJ', 'DDJ', 'DDJ', 'DDJ'] },
    { id: nanoid(), asignatura: 'Formación', horas: '2', grupos: ['DACZ', 'DACZ', 'DACZ', 'DACZ', 'DACZ', 'DACZ'] },
    { id: nanoid(), asignatura: 'Tecnología', horas: '3', grupos: ['', '', '', '', '', ''] },
    { id: nanoid(), asignatura: 'Educación Física', horas: '2', grupos: ['DDT', 'AR', 'AR', 'AR', 'DDT', 'DDT'] },
    { id: nanoid(), asignatura: 'Vida Saludable', horas: '2', grupos: ['JAcHB', 'AVAR', 'AVAR', 'JAcHB', 'JAcHB', 'NAGH'] },
    { id: nanoid(), asignatura: 'Tutoría', horas: '1', grupos: ['EEDA', 'EEDA', 'NAGH', 'DDJ', 'AVAR', 'AVAR'] },
  ],
  'grado-2': [
    { id: nanoid(), asignatura: 'Español', horas: '5', grupos: ['MRAD', 'MRAD', 'GDJ', 'GDJ', 'GDJ', 'RELC'] },
    { id: nanoid(), asignatura: 'Inglés', horas: '3', grupos: ['CFRM', 'CFRM', 'CFRM', 'MYSL', 'MYSL', 'MYSL'] },
    { id: nanoid(), asignatura: 'Artes', horas: '3', grupos: ['DDJ', 'JCCH', 'JCCH', 'JCCH', 'JCCH', 'JCCH'] },
    { id: nanoid(), asignatura: 'Matemáticas', horas: '5', grupos: ['EMP', 'EMP', 'JAHS', 'MEDA', 'MEDA', 'MEDA'] },
    { id: nanoid(), asignatura: 'Ciencias', horas: '4', grupos: ['SPPT', 'MGFR', 'EMP', 'IRS', 'SPPT', 'SPPT'] },
    { id: nanoid(), asignatura: 'Historia', horas: '3', grupos: ['AAHS', 'AAHS', 'AAHS', 'AAHS', 'ESC', 'ESC'] },
    { id: nanoid(), asignatura: 'Formación', horas: '2', grupos: ['DACZ', 'DACZ', 'MBTV', 'MBTV', 'MBTV', 'MBTV'] },
    { id: nanoid(), asignatura: 'Tecnología', horas: '3', grupos: ['', '', '', '', '', ''] },
    { id: nanoid(), asignatura: 'Educación Física', horas: '2', grupos: ['DDT', 'AR', 'DDT', 'DDT', 'DDT', 'DDT'] },
    { id: nanoid(), asignatura: 'Vida Saludable', horas: '2', grupos: ['MBTV', 'MBTV', 'NAGH', 'MBTV', 'MBTV', 'NAGH'] },
    { id: nanoid(), asignatura: 'Tutoría', horas: '1', grupos: ['AAHS', 'EMP', 'EMP', 'MEDA', 'MEDA', 'MBTV'] },
  ],
  'grado-3': [
    { id: nanoid(), asignatura: 'Español', horas: '5', grupos: ['AMRH', 'AMRH', 'AMRH', 'AMRH', 'AMRH', 'AMRH'] },
    { id: nanoid(), asignatura: 'Inglés', horas: '3', grupos: ['CFRM', 'CFRM', 'CFRM', 'CFRM', 'CFRM', 'CFRM'] },
    { id: nanoid(), asignatura: 'Artes', horas: '3', grupos: ['MRDC', 'MRDC', 'MRDC', 'MRDC', 'MRDC', 'MRDC'] },
    { id: nanoid(), asignatura: 'Matemáticas', horas: '5', grupos: ['MSFG', 'MSFG', 'MSFG', 'MSFG', 'MSFG', 'JAHS'] },
    { id: nanoid(), asignatura: 'Ciencias', horas: '4', grupos: ['MGFR', 'MJGF', 'MGFR', 'MJGF', 'AMG', 'AMG'] },
    { id: nanoid(), asignatura: 'Historia', horas: '3', grupos: ['NGGR', 'NGGR', 'NGGR', 'NGGR', 'NGGR', 'NGGR'] },
    { id: nanoid(), asignatura: 'Formación', horas: '2', grupos: ['MBTV', 'MBTV', 'MBTV', 'MBTV', 'MBTV', 'MBTV'] },
    { id: nanoid(), asignatura: 'Tecnología', horas: '3', grupos: ['', '', '', '', '', ''] },
    { id: nanoid(), asignatura: 'Educación Física', horas: '2', grupos: ['DDT', 'AR', 'DDT', 'DDT', 'DDT', 'AR'] },
    { id: nanoid(), asignatura: 'Vida Saludable', horas: '2', grupos: ['JCCH', 'DDJ', 'JCCH', 'DDJ', 'DDT', 'DDT'] },
    { id: nanoid(), asignatura: 'Tutoría', horas: '1', grupos: ['MSFG', 'NGGR', 'NGGR', 'MSFG', 'MBTV', 'AMG'] },
  ]
};


const initialReglas = [
  { id: "R1", nombre: "No sobreponer asignaturas", descripcion: "Un grupo no puede tener dos materias en el mismo bloque", activa: true },
  { id: "R2", nombre: "Docente único por bloque", descripcion: "Un docente no puede estar en dos clases al mismo tiempo", activa: true },
  { id: "R3", nombre: "No repetir clase el mismo día", descripcion: "Una materia no puede repetirse más de una vez por día en el mismo grupo", activa: true }
];

const initialInstitucion: InstitucionInfo = {
    nombre: 'Nombre de la Institución',
    cicloEscolar: '2024-2025',
    director: 'Nombre del Director(a)',
    direccion: 'Dirección de la Institución',
    email: '',
    telefono: '',
};

const initialAulas: Aula[] = [
    { id: 'A101', nombre: 'Salón 101', capacidad: 30 },
    { id: 'B202', nombre: 'Laboratorio de Ciencias', capacidad: 25 },
    { id: 'C303', nombre: 'Aula de Medios', capacidad: 20 },
];

// Definición del estado de la tienda
interface AppState {
    institucion: InstitucionInfo;
    niveles: Nivel[];
    datos: Record<string, any[]>;
    horasObjetivo: Record<string, number>;
    distribuciones: Record<string, DistribucionRow[]>;
    docentes: Docente[];
    aulas: Aula[];
    horarios: Record<string, any[]>;
    restricciones: Record<string, { noDisponibles: string[], preferidos: string[] }>;
    bloquesFijos: any[];
    bloquesSinAsignar: Record<string, any[]>;
    reglas: any[];
    setInstitucion: (info: InstitucionInfo) => void;
    setNiveles: (niveles: Nivel[]) => void;
    setDatos: (datos: Record<string, any[]>) => void;
    setHorasObjetivo: (horas: Record<string, number>) => void;
    setDistribuciones: (distribuciones: Record<string, DistribucionRow[]>) => void;
    setDocentes: (docentes: Docente[]) => void;
    setAulas: (aulas: Aula[]) => void;
    setHorarios: (horarios: Record<string, any[]>) => void;
    setRestricciones: (docenteId: string, noDisponibles: string[]) => void;
    setBloquesFijos: (bloques: any[]) => void;
    setReglas: (reglas: any[]) => void;
    setBloquesSinAsignar: (bloques: Record<string, any[]>) => void;
    updateNivelData: (nivelId: string, nivelData: any[]) => void;
    updateDistribucionData: (nivelId: string, distribucionData: DistribucionRow[]) => void;
    handleNivelesSave: (nuevosNiveles: Nivel[]) => void;
    depurarDatos: () => {nombresCorregidos: number, duplicadosEncontrados: number};
    limpiarHorarioGrupo: (nivelId: string, grupo: string) => void;
    limpiarTodosLosHorarios: () => void;
}

const limpiarNombreAsignatura = (nombre: string): string => {
  if (!nombre) return '';
  const regex = /^(.*?)\1$/;
  const match = nombre.trim().match(regex);
  return match ? match[1].trim() : nombre.trim();
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      institucion: initialInstitucion,
      niveles: initialNiveles,
      datos: initialDatos,
      horasObjetivo: initialHorasObjetivo,
      distribuciones: initialDistribuciones,
      docentes: initialDocentes,
      aulas: initialAulas,
      horarios: {},
      restricciones: {},
      bloquesFijos: [],
      bloquesSinAsignar: {},
      reglas: initialReglas,

      // Acciones
      setInstitucion: (institucion) => set({ institucion }),
      setNiveles: (niveles) => set({ niveles }),
      setDatos: (datos) => set({ datos }),
      setHorasObjetivo: (horasObjetivo) => set({ horasObjetivo }),
      setDistribuciones: (distribuciones) => set({ distribuciones }),
      setDocentes: (docentes) => set({ docentes }),
      setAulas: (aulas) => set({ aulas }),
      setHorarios: (horarios) => set({ horarios }),
      setRestricciones: (docenteId, noDisponibles) => set(state => ({
        restricciones: {
          ...state.restricciones,
          [docenteId]: {
            ...(state.restricciones[docenteId] || { preferidos: [] }),
            noDisponibles
          }
        }
      })),
      setBloquesFijos: (bloquesFijos) => set({ bloquesFijos }),
      setReglas: (reglas) => set({ reglas }),
      setBloquesSinAsignar: (bloquesSinAsignar) => set({ bloquesSinAsignar }),

      updateNivelData: (nivelId, nivelData) => set(state => ({
        datos: { ...state.datos, [nivelId]: nivelData }
      })),
      
      updateDistribucionData: (nivelId, distribucionData) => set(state => ({
        distribuciones: { ...state.distribuciones, [nivelId]: distribucionData }
      })),
      
      handleNivelesSave: (nuevosNiveles) => set(state => {
        const nuevosDatos = { ...state.datos };
        const nuevosObjetivos = { ...state.horasObjetivo };
        const nuevasDistribuciones = { ...state.distribuciones };
        
        const nivelIds = new Set(nuevosNiveles.map(n => n.id));

        Object.keys(nuevosDatos).forEach(key => { if (!nivelIds.has(key)) delete nuevosDatos[key]; });
        Object.keys(nuevosObjetivos).forEach(key => { if (!nivelIds.has(key)) delete nuevosObjetivos[key]; });
        Object.keys(nuevasDistribuciones).forEach(key => { if (!nivelIds.has(key)) delete nuevasDistribuciones[key]; });
        
        nuevosNiveles.forEach(nivel => {
            if (!nuevosDatos[nivel.id]) {
                nuevosDatos[nivel.id] = [];
                nuevosObjetivos[nivel.id] = 30; 
                nuevasDistribuciones[nivel.id] = [];
            }
        });
        
        return { 
          niveles: nuevosNiveles,
          datos: nuevosDatos, 
          horasObjetivo: nuevosObjetivos, 
          distribuciones: nuevasDistribuciones
        };
      }),

      depurarDatos: () => {
        const state = get();
        const nuevosDatos: Record<string, any[]> = {};
        let duplicadosEncontrados = 0;
        let nombresCorregidos = 0;

        for (const nivelId in state.datos) {
            const asignaturas = state.datos[nivelId];
            if (Array.isArray(asignaturas)) {
                
                const asignaturasConNombreLimpio = asignaturas.map(a => {
                    const nombreOriginal = a.asignatura;
                    const nombreLimpio = limpiarNombreAsignatura(nombreOriginal);
                    if (nombreOriginal !== nombreLimpio) {
                        nombresCorregidos++;
                    }
                    return { ...a, asignatura: nombreLimpio };
                });

                const asignaturasUnicas: any[] = [];
                const seen = new Set();
                
                for (const a of asignaturasConNombreLimpio) {
                    if (a.asignatura && a.asignatura.trim()) {
                        const key = a.asignatura.toLowerCase();
                        if (!seen.has(key)) {
                            seen.add(key);
                            asignaturasUnicas.push(a);
                        } else {
                            duplicadosEncontrados++;
                        }
                    } else {
                         asignaturasUnicas.push(a);
                    }
                }
                nuevosDatos[nivelId] = asignaturasUnicas;
            } else {
                nuevosDatos[nivelId] = asignaturas;
            }
        }
        set({ datos: nuevosDatos });
        return { nombresCorregidos, duplicadosEncontrados };
      },

      limpiarHorarioGrupo: (nivelId, grupo) => set(state => {
        const nuevosHorarios = { ...state.horarios };
        const grupoKey = `${nivelId}_${grupo}`;
        if (nuevosHorarios[grupoKey]) {
          delete nuevosHorarios[grupoKey];
        }
        return { horarios: nuevosHorarios };
      }),

      limpiarTodosLosHorarios: () => set({ horarios: {}, bloquesSinAsignar: {} }),
    }),
    {
      name: 'scheduler-app-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

    