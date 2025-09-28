
"use client";

import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trash2, Book, Clock, User, Sparkles } from "lucide-react";
import { suggestTeacher } from '@/ai/flows/suggest-teacher';
import type { Docente, DistribucionRow } from '@/lib/types';
import { useDocentesFiltrados } from '@/hooks/useDocentesFiltrados';

const GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface AsignaturaOption {
  value: string;
  label: string;
  horas: string;
}

interface DistribucionGrupoProps {
  data: DistribucionRow[];
  setData: (data: DistribucionRow[]) => void;
  asignaturasOptions: AsignaturaOption[];
  docentes: Docente[];
  isEditable?: boolean;
}

const GrupoCell: FC<{
    row: DistribucionRow;
    groupIndex: number;
    docentes: Docente[];
    isEditable: boolean;
    handleUpdate: (id: string, field: keyof DistribucionRow | number, value: any) => void;
}> = ({ row, groupIndex, docentes, isEditable, handleUpdate }) => {
    
    const [isLoading, setIsLoading] = useState(false);
    const docentesFiltrados = useDocentesFiltrados(row.asignatura);

    const handleSuggestTeacher = async (rowId: string, groupIndex: number, subject: string) => {
        if (!subject) return;
        setIsLoading(true);
        try {
            const result = await suggestTeacher({ subject });
            if (result.teacherName) {
                const suggestedDocente = docentes.find(d => 
                    d.nombre.toLowerCase().includes(result.teacherName.toLowerCase()) || 
                    result.teacherName.toLowerCase().includes(d.nombre.toLowerCase())
                );
                
                if(suggestedDocente && (suggestedDocente.asignaturas || []).includes(subject)){
                    handleUpdate(rowId, groupIndex, suggestedDocente.id);
                }
            }
        } catch (error) {
            console.error("Error suggesting teacher:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TableCell className="text-center">
            <div className="flex items-center gap-1">
                <Select
                    value={row.grupos[groupIndex] || ''}
                    onValueChange={(value) => handleUpdate(row.id, groupIndex, value)}
                    disabled={!isEditable || !row.asignatura}
                >
                    <SelectTrigger className="w-36 mx-auto">
                        <SelectValue placeholder="Profesor" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="sin-asignar">Sin asignar</SelectItem>
                        {docentesFiltrados.map(docente => (
                            <SelectItem key={docente.id} value={docente.id}>
                                {docente.nombre} ({docente.id})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleSuggestTeacher(row.id, groupIndex, row.asignatura)}
                    disabled={!isEditable || !row.asignatura || isLoading}
                    title="Sugerir profesor con IA"
                >
                    <Sparkles className={`h-4 w-4 text-muted-foreground hover:text-amber-500 transition-colors ${isLoading ? 'animate-pulse' : ''}`}/>
                </Button>
            </div>
        </TableCell>
    );
};


export const DistribucionGrupo: FC<DistribucionGrupoProps> = ({
  data,
  setData,
  asignaturasOptions,
  docentes,
  isEditable = false,
}) => {

  const handleUpdate = (id: string, field: keyof DistribucionRow | number, value: any) => {
    const newData = data.map(row => {
      if (row.id === id) {
        if (typeof field === 'number') { // Actualizando un input de grupo
            const nuevosGrupos = [...row.grupos];
            nuevosGrupos[field] = value === 'sin-asignar' ? '' : value;
            return { ...row, grupos: nuevosGrupos };
        }
        if (field === 'asignatura') { // Sincronizar horas al cambiar asignatura
           const selectedAsignatura = asignaturasOptions.find(opt => opt.value === value);
           const horas = selectedAsignatura ? selectedAsignatura.horas : '';
           return { ...row, asignatura: value, horas: horas, grupos: Array(GRUPOS.length).fill('') }; // Resetear docentes al cambiar materia
        }
        return { ...row, [field]: value };
      }
      return row;
    });
    setData(newData);
  };

  const handleDeleteRow = (id: string) => {
    setData(data.filter(row => row.id !== id));
  };
  
  const horasPorGrupo = useMemo(() => {
    const total: Record<string, number> = {};
    GRUPOS.forEach((_, index) => {
        total[index] = data.reduce((acc, row) => {
            if(row.grupos[index]) {
                return acc + (Number(row.horas) || 0);
            }
            return acc;
        }, 0);
    });
    return total;
  }, [data]);

  const asignaturasDisponibles = useMemo(() => {
    const asignaturasSeleccionadas = new Set(data.map(d => d.asignatura));
    return asignaturasOptions.filter(opt => !asignaturasSeleccionadas.has(opt.value));
  }, [data, asignaturasOptions]);

  return (
    <div className="w-full">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead><div className="flex items-center gap-2"><Book /> Asignatura</div></TableHead>
              <TableHead><div className="flex items-center gap-2"><Clock /> Horas</div></TableHead>
              {GRUPOS.map(g => <TableHead key={g}><div className="flex items-center gap-2 justify-center"><User /> Grupo {g}</div></TableHead>)}
              <TableHead className="text-right w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="w-[250px]">
                     <Select
                        value={row.asignatura}
                        onValueChange={(value) => handleUpdate(row.id, 'asignatura', value)}
                        disabled={!isEditable}
                      >
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          {row.asignatura && <SelectItem value={row.asignatura}>{row.asignatura}</SelectItem>}
                          {asignaturasDisponibles.map(asig => <SelectItem key={asig.value} value={asig.value}>{asig.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                  </TableCell>
                  <TableCell className="w-[100px]">
                    <Input
                      type="number"
                      value={row.horas}
                      readOnly
                      disabled
                      className="bg-muted"
                    />
                  </TableCell>
                   {GRUPOS.map((_, index) => (
                      <GrupoCell 
                        key={index}
                        row={row}
                        groupIndex={index}
                        docentes={docentes}
                        isEditable={isEditable}
                        handleUpdate={handleUpdate}
                      />
                   ))}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRow(row.id)}
                      disabled={!isEditable}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={GRUPOS.length + 4} className="h-24 text-center text-muted-foreground">
                  No hay distribución definida. Agregue una fila para comenzar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
           <TableFooter>
                <TableRow className="hover:bg-transparent">
                    <TableCell className="font-bold text-right">Total Horas/Grupo:</TableCell>
                    <TableCell/>
                    {GRUPOS.map((_, index) => (
                        <TableCell key={index} className="font-bold text-center">
                            {horasPorGrupo[index]} hrs
                        </TableCell>
                    ))}
                    <TableCell />
                </TableRow>
           </TableFooter>
        </Table>
      </div>
    </div>
  );
};
