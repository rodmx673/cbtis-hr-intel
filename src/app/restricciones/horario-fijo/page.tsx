
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from 'nanoid';
import { useAppStore } from "@/store/useDistribucionStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface BloqueFijo {
  id: string;
  dia: string;
  hora: string;
  nivelId: string;
  grupo: string;
  asignatura: string;
  docenteId: string;
  bloqueado: boolean;
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HORAS = [
  '07:00-07:50', '07:50-08:40', '08:40-09:30',
  '10:00-10:50', '10:50-11:40', '11:40-12:30', '12:30-13:20'
];
const GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function HorariosFijosPage() {
  const { docentes, niveles, distribuciones, horarios, bloquesFijos, setBloquesFijos } = useAppStore();
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddBloque = () => {
    const newBloque: BloqueFijo = {
      id: nanoid(),
      dia: '',
      hora: '',
      nivelId: '',
      grupo: '',
      asignatura: '',
      docenteId: '',
      bloqueado: true
    };
    setBloquesFijos([newBloque, ...bloquesFijos]);
  };
  
  const handleUpdateBloque = (id: string, field: keyof BloqueFijo, value: any) => {
    const nuevosBloques = bloquesFijos.map(b => {
        if (b.id === id) {
            const updatedBloque = { ...b, [field]: value };

            if (field === 'nivelId' || field === 'grupo' || field === 'dia') {
                updatedBloque.asignatura = '';
                updatedBloque.docenteId = '';
                updatedBloque.hora = '';
            }
            
            if (field === 'asignatura' && value) {
                const distribucionNivel = distribuciones[updatedBloque.nivelId] || [];
                const distribucionFila = distribucionNivel.find(d => d.asignatura === value);
                const grupoIndex = GRUPOS.indexOf(updatedBloque.grupo);
                updatedBloque.docenteId = distribucionFila?.grupos[grupoIndex] || '';
            }
            
            if (field === 'docenteId' && value) {
                 const distribucionNivel = distribuciones[updatedBloque.nivelId] || [];
                 const grupoIndex = GRUPOS.indexOf(updatedBloque.grupo);
                 let asignaturaAsignada = '';
                 for(const dist of distribucionNivel){
                     if(dist.grupos[grupoIndex] === value){
                         asignaturaAsignada = dist.asignatura;
                         break;
                     }
                 }
                 updatedBloque.asignatura = asignaturaAsignada;
            }

            return updatedBloque;
        }
        return b;
    });

    const bloqueActualizado = nuevosBloques.find(b => b.id === id);
    if (!bloqueActualizado) return;

    const { dia, hora, docenteId } = bloqueActualizado;
    
    if (dia && hora && docenteId) {
      const isTeacherConflict = nuevosBloques.some(b => 
          b.id !== id && 
          b.dia === dia && 
          b.hora === hora && 
          b.docenteId === docenteId &&
          b.docenteId !== '' &&
          b.bloqueado
      );
      if (isTeacherConflict) {
          toast({
              title: "Error: Conflicto de docente",
              description: `El docente ya tiene un bloque fijo asignado el ${dia} a las ${hora}.`,
              variant: "destructive",
          });
          return;
      }
    }
    
    setBloquesFijos(nuevosBloques);
  };
  
  const handleDeleteBloque = (id: string) => {
    setBloquesFijos(bloquesFijos.filter(b => b.id !== id));
  };
  
  const obtenerAsignaturasYDocentesDisponibles = (nivelId: string, grupo: string) => {
    if(!nivelId || !grupo) return { asignaturas: [], docentes: [] };

    const distribucionNivel = distribuciones[nivelId];
    if (!distribucionNivel || distribucionNivel.length === 0) return { asignaturas: [], docentes: [] };
    
    const grupoIndex = GRUPOS.indexOf(grupo);
    if(grupoIndex === -1) return { asignaturas: [], docentes: [] };

    const asignaturasDisponibles = distribucionNivel
        .filter(d => d.grupos[grupoIndex])
        .map(d => d.asignatura);
    
    const docentesDisponibles = distribucionNivel
        .map(d => d.grupos[grupoIndex])
        .filter(Boolean);
    
    const docentesUnicos = [...new Set(docentesDisponibles)];
    
    const docentesInfo = docentes.filter(d => docentesUnicos.includes(d.id));

    return { asignaturas: asignaturasDisponibles, docentes: docentesInfo };
  }

  const getSlotOccupationByTeacher = (dia: string, hora: string, docenteId: string, currentBloqueId: string) => {
    if (!dia || !hora || !docenteId) return null;

    const bloqueFijoConflicto = bloquesFijos.find(b =>
        b.id !== currentBloqueId && b.bloqueado &&
        b.dia === dia && b.hora === hora && b.docenteId === docenteId
    );

    if (bloqueFijoConflicto) {
        const nivelInfo = niveles.find(n => n.id === bloqueFijoConflicto.nivelId);
        return {
            asignatura: bloqueFijoConflicto.asignatura,
            grupo: `${nivelInfo?.nombre || 'N/A'} - G${bloqueFijoConflicto.grupo}`
        };
    }
    return null;
  };
  
  const obtenerHorasOcupadas = (dia: string, nivelId: string, grupo: string, bloqueIdActual: string) => {
    if (!dia || !nivelId || !grupo) return [];
    const grupoKey = `${nivelId}_${grupo}`;
    const ocupadas = new Set<string>();

    // Horas ocupadas por otros bloques fijos para el mismo grupo
    bloquesFijos.forEach(b => {
        if(b.id !== bloqueIdActual && b.bloqueado && b.dia === dia && b.nivelId === nivelId && b.grupo === grupo) {
            ocupadas.add(b.hora);
        }
    });

    // Horas ocupadas en el horario general
    if(horarios[grupoKey]){
        horarios[grupoKey].forEach((h:any) => {
             // Asegurarse que el bloque del horario general no sea un bloque fijo que ya estamos considerando
            const esFijoCorrespondiente = bloquesFijos.some(bf => 
                bf.id === bloqueIdActual && bf.dia === h.dia && bf.hora === h.hora
            );
            if (h.dia === dia && !esFijoCorrespondiente) ocupadas.add(h.hora);
        })
    }
    
    return Array.from(ocupadas);
  }

  if (!isClient) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <p>Cargando datos...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-screen-xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">
              Gestión de Horarios Fijos
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Defina bloques horarios que el generador no debe modificar.
            </p>
          </div>
           <Button onClick={handleAddBloque} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Bloque Fijo
            </Button>
        </header>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Bloques Fijos</CardTitle>
                    <CardDescription>
                      Asegúrese que la distribución académica esté completa para el nivel y grupo antes de fijar un bloque.
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Día</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Asignatura</TableHead>
                      <TableHead>Docente</TableHead>
                      <TableHead className="text-center">Bloqueado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bloquesFijos.length > 0 ? (
                      bloquesFijos.map(bloque => {
                        const { asignaturas, docentes: docentesDisponibles } = obtenerAsignaturasYDocentesDisponibles(bloque.nivelId, bloque.grupo);
                        const horasOcupadas = obtenerHorasOcupadas(bloque.dia, bloque.nivelId, bloque.grupo, bloque.id);
                        
                        return (
                          <TableRow key={bloque.id}>
                            <TableCell className="w-[140px]">
                              <Select value={bloque.dia} onValueChange={v => handleUpdateBloque(bloque.id, 'dia', v)}>
                                <SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger>
                                <SelectContent>{DIAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="w-[180px]">
                              <Select value={bloque.nivelId} onValueChange={v => handleUpdateBloque(bloque.id, 'nivelId', v)}>
                                <SelectTrigger><SelectValue placeholder="Nivel"/></SelectTrigger>
                                <SelectContent>{niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}</SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="w-[180px]">
                                <Select 
                                    value={bloque.grupo} 
                                    onValueChange={v => handleUpdateBloque(bloque.id, 'grupo', v)} 
                                    disabled={!bloque.nivelId}
                                >
                                  <SelectTrigger><SelectValue placeholder="Grupo"/></SelectTrigger>
                                  <SelectContent>
                                    {GRUPOS.map(g => (
                                      <SelectItem key={g} value={g}>Grupo {g}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </TableCell>
                             <TableCell className="w-[150px]">
                              <Select 
                                value={bloque.hora} 
                                onValueChange={v => handleUpdateBloque(bloque.id, 'hora', v)}
                                disabled={!bloque.dia || !bloque.nivelId || !bloque.grupo}
                              >
                                <SelectTrigger><SelectValue placeholder="Hora" /></SelectTrigger>
                                <SelectContent>
                                  {HORAS.map(h => {
                                    const isOccupied = horasOcupadas.includes(h);
                                    return <SelectItem key={h} value={h} disabled={isOccupied}>{h}</SelectItem>
                                  })}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="w-[200px]">
                                <Select 
                                  value={bloque.asignatura} 
                                  onValueChange={v => handleUpdateBloque(bloque.id, 'asignatura', v)}
                                  disabled={!bloque.nivelId || !bloque.grupo}
                                >
                                  <SelectTrigger><SelectValue placeholder="Asignatura"/></SelectTrigger>
                                  <SelectContent>
                                  {asignaturas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell className="w-[200px]">
                              <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                  <div className="relative">
                                    <Select 
                                      value={bloque.docenteId} 
                                      onValueChange={v => handleUpdateBloque(bloque.id, 'docenteId', v)}
                                      disabled={!bloque.nivelId || !bloque.grupo || !bloque.asignatura}
                                    >
                                      <SelectTrigger><SelectValue placeholder="Docente"/></SelectTrigger>
                                      <SelectContent>{docentesDisponibles.map(docenteInfo => {
                                          if (!docenteInfo) return null;
                                          const occupation = getSlotOccupationByTeacher(bloque.dia, bloque.hora, docenteInfo.id, bloque.id);
                                          const isDisabled = !!occupation;
                                          return (
                                            <SelectItem key={docenteInfo.id} value={docenteInfo.id} disabled={isDisabled}>
                                                {docenteInfo.nombre}
                                            </SelectItem>
                                          )
                                      })}</SelectContent>
                                    </Select>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    {(() => {
                                        const ocupadoPor = getSlotOccupationByTeacher(bloque.dia, bloque.hora, bloque.docenteId, bloque.id);
                                        return ocupadoPor ? <p>Conflicto: Ocupado con {ocupadoPor.asignatura} en {ocupadoPor.grupo}</p> : <p>Docente disponible en este horario.</p>
                                    })()}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox checked={bloque.bloqueado} onCheckedChange={v => handleUpdateBloque(bloque.id, 'bloqueado', v as boolean)} />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteBloque(bloque.id)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          No hay bloques fijos definidos.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
