

export interface Nivel {
  id: string;
  tipo: 'Grado' | 'Semestre';
  nombre: string;
}

export interface Docente {
  id: string;
  nombre: string;
  horasMaximas: number;
  asignaturas: string[];
}

export interface Aula {
  id: string;
  nombre: string;
  capacidad: number;
}

export interface DistribucionRow {
  id: string;
  asignatura: string;
  horas: string;
  grupos: string[];
}
