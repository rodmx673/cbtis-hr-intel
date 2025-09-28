
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function limpiarNombreAsignatura(nombre: string): string {
    if (!nombre) return '';
    // Detecta patrones como "MateriaMateria" o "Materia 1Materia 1"
    const regex = /^(.*?)\1$/;
    const match = nombre.trim().match(regex);
    if (match) {
        return match[1].trim();
    }
    return nombre.trim();
}

export function obtenerAsignaturasDesdeCargaHorariaBase(cargaHorariaBase: Record<string, any[]>): string[] {
    const asignaturasSet = new Set<string>();
    Object.values(cargaHorariaBase).flat().forEach(asignacion => {
        if (asignacion && asignacion.asignatura) {
            const nombreLimpio = limpiarNombreAsignatura(asignacion.asignatura);
            if(nombreLimpio) asignaturasSet.add(nombreLimpio);
        }
    });
    return Array.from(asignaturasSet).sort();
}
