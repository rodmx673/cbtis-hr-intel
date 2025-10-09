"use client";

import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trash2, Book, Clock, User, Sparkles, Plus } from "lucide-react";
import { suggestTeacher } from '@/ai/flows/suggest-teacher';
import type { Docente, DistribucionRow } from '@/lib/types';
import { useDocentesFiltrados } from '@/hooks/useDocentesFiltrados';

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

  const handleSuggestTeacher = async () => {
    if (!row.asignatura) return;
    setIsLoading(true);
    try {
      const result = await suggestTeacher({ subject: row.asignatura });
      if (result.teacherName) {
        const suggested = docentes.find(d =>
          d.nombre.toLowerCase().includes(result.teacherName.toLowerCase()) ||
          result.teacherName.toLowerCase().includes(d.nombre.toLowerCase())
        );
        if (suggested && (suggested.asignaturas || []).includes(row.asignatura)) {
          handleUpdate(row.id, groupIndex, suggested.id);
        }
      }
    } catch (error) {
      console.error("Error sugiriendo profesor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TableCell className="text-center">
      <div className="flex items-center gap-1">
        <Select
          value={row.grupos[groupIndex] || ''}
          onValueChange={(value) => handleUpdate(row.id, groupIndex, value === 'sin-asignar' ? '' : value)}
          disabled={!isEditable || !row.asignatura}
        >
          <SelectTrigger className="w-36 mx-auto">
            <SelectValue placeholder="Profesor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sin-asignar">Sin asignar</SelectItem>
            {docentesFiltrados.map(d => (
              <SelectItem key={d.id} value={d.id}>
                {d.nombre} ({d.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSuggestTeacher}
          disabled={!isEditable || !row.asignatura || isLoading}
          title="Sugerir profesor con IA"
        >
          <Sparkles className={`h-4 w-4 text-muted-foreground hover:text-amber-500 transition-colors ${isLoading ? 'animate-pulse' : ''}`} />
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
  const [grupos, setGrupos] = useState(['A', 'B', 'C', 'D', 'E', 'F']);

  const handleUpdate = (id: string, field: keyof DistribucionRow | number, value: any) => {
    const newData = data.map(row => {
      if (row.id === id) {
        if (typeof field === 'number') {
          const nuevosGrupos = [...row.grupos];
          nuevosGrupos[field] = value;
          return { ...row, grupos: nuevosGrupos };
        }
        if (field === 'asignatura') {
          const selected = asignaturasOptions.find(opt => opt.value === value);
          const horas = selected ? selected.horas : '';
          return { ...row, asignatura: value, horas, grupos: Array(grupos.length).fill('') };
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

  const handleAddRow = () => {
    const newRow: DistribucionRow = {
      id: crypto.randomUUID(),
      asignatura: '',
      horas: '',
      grupos: Array(grupos.length).fill(''),
    };
    setData([...data, newRow]);
  };

  const horasPorGrupo = useMemo(() => {
    const total: Record<number, number> = {};
    grupos.forEach((_, index) => {
      total[index] = data.reduce((acc, row) => {
        return row.grupos[index] ? acc + (Number(row.horas) || 0) : acc;
      }, 0);
    });
    return total;
  }, [data, grupos]);

  const asignaturasDisponibles = useMemo(() => {
    const seleccionadas = new Set(data.map(d => d.asignatura));
    return asignaturasOptions.filter(opt => !seleccionadas.has(opt.value));
  }, [data, asignaturasOptions]);

  return (
    <div className="w-full space-y-4">
      {/* Control de Grupos */}
      <div className="flex items-center gap-2 flex-wrap">
        <strong>Grupos:</strong>
        {grupos.map((g, index) => (
          <div key={index} className="flex items-center gap-1 border rounded px-2 py-1">
            <Input
              value={g}
              onChange={(e) => {
                const updated = [...grupos];
                updated[index] = e.target.value;
                setGrupos(updated);
              }}
              className="w-20"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                const updated = grupos.filter((_, i) => i !== index);
                setGrupos(updated);

                const updatedData = data.map(row => {
                  const newGrupos = [...row.grupos];
                  newGrupos.splice(index, 1);
                  return { ...row, grupos: newGrupos };
                });
                setData(updatedData);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        <Button onClick={() => setGrupos([...grupos, `Grupo ${grupos.length + 1}`])}>
          <Plus className="h-4 w-4 mr-1" /> Agregar Grupo
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead><div className="flex items-center gap-2"><Book /> Asignatura</div></TableHead>
              <TableHead><div className="flex items-center gap-2"><Clock /> Horas</div></TableHead>
              {grupos.map((g, i) => (
                <TableHead key={i} className="text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <User /> {g}
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-right w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="w-[250px]">
                  <Select
                    value={row.asignatura}
                    onValueChange={(val) => handleUpdate(row.id, 'asignatura', val)}
                    disabled={!isEditable}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar asignatura" />
                    </SelectTrigger>
                    <SelectContent>
                      {row.asignatura && (
                        <SelectItem value={row.asignatura}>
                          {asignaturasOptions.find(a => a.value === row.asignatura)?.label}
                        </SelectItem>
                      )}
                      {asignaturasDisponibles.map(a => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="w-[100px]">
                  <Input value={row.horas} readOnly disabled className="bg-muted" />
                </TableCell>
                {grupos.map((_, i) => (
                  <GrupoCell
                    key={i}
                    row={row}
                    groupIndex={i}
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
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={grupos.length + 3} className="text-center text-muted-foreground">
                  No hay distribución definida.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell className="font-bold text-right">Total Horas/Grupo:</TableCell>
              <TableCell />
              {grupos.map((_, i) => (
                <TableCell key={i} className="text-center font-bold">
                  {horasPorGrupo[i]} hrs
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Botón para agregar fila */}
      {isEditable && (
        <div className="text-right">
          <Button onClick={handleAddRow}>
            + Agregar Asignatura
          </Button>
        </div>
      )}
    </div>
  );
};