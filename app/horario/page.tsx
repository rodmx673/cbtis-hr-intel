
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wand2, UserCheck, Download, Loader2, GripVertical, AlertCircle, Trash2, Combine } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { generarHorarioDesdeDistribucion } from '@/lib/horario-generator';
import { optimizarHorario } from '@/lib/horario-optimizer';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useDistribucionStore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { SafeDroppable } from '@/components/SafeDroppable';


const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HORAS = [
  '07:00-07:50', '07:50-08:40', '08:40-09:30', '09:30-10:00 (Receso)',
  '10:00-10:50', '10:50-11:40', '11:40-12:30', '12:30-13:20'
];

const generarColorUnico = (index: number) => {
  const goldenRatio = 0.618033988749895;
  const hue = (index * goldenRatio * 360) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

export default function HorarioPorGrupo() {
  const { 
      niveles, datos, horarios, setHorarios, institucion, 
      bloquesSinAsignar, setBloquesSinAsignar,
      limpiarHorarioGrupo, limpiarTodosLosHorarios
  } = useAppStore();
  
  const [isClient, setIsClient] = useState(false);
  const [conflictos, setConflictos] = useState<Record<string, boolean>>({});
  const [nivelSeleccionado, setNivelSeleccionado] = useState('');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('A');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const horarioRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && niveles.length > 0 && !nivelSeleccionado) {
      setNivelSeleccionado(niveles[0].id);
    }
  }, [isClient, niveles, nivelSeleccionado]);

  const coloresGenerados = useMemo(() => {
    if (!isClient) return {};
    const todasLasAsignaturas = new Set<string>();
    Object.values(datos).flat().forEach((asignatura: any) => {
        if(asignatura.asignatura) todasLasAsignaturas.add(asignatura.asignatura);
    });

    const colores: Record<string, string> = {};
    Array.from(todasLasAsignaturas).forEach((asignatura, index) => {
        colores[asignatura] = generarColorUnico(index);
    });
    return colores;
  }, [isClient, datos]);


  useEffect(() => {
    if(!isClient || Object.keys(horarios).length === 0) {
      setConflictos({});
      return;
    }

    const nuevosConflictos: Record<string, boolean> = {};
    const bloquesPorHora: Record<string, any[]> = {};
    const asignaturasPorDiaGrupo: Record<string, string[]> = {};

    Object.entries(horarios).forEach(([grupoKey, bloquesGrupo]) => {
      if(Array.isArray(bloquesGrupo)) {
        bloquesGrupo.forEach(bloque => {
          const keyHora = `${bloque.dia}_${bloque.hora}`;
          if(!bloquesPorHora[keyHora]) bloquesPorHora[keyHora] = [];
          bloquesPorHora[keyHora].push({ ...bloque, grupoKey });
          
          const keyDia = `${grupoKey}_${bloque.dia}_${bloque.asignatura}`;
          if (!asignaturasPorDiaGrupo[keyDia]) asignaturasPorDiaGrupo[keyDia] = [];
          asignaturasPorDiaGrupo[keyDia].push(bloque.hora);
        });
      }
    });

    for(const key in bloquesPorHora){
      const bloques = bloquesPorHora[key];
      const docentesEnBloque = bloques.map(b => b.docenteId);
      const docentesDuplicados = docentesEnBloque.filter((d, i) => d && docentesEnBloque.indexOf(d) !== i);

      if(docentesDuplicados.length > 0){
        bloques.forEach(bloque => {
          if(docentesDuplicados.includes(bloque.docenteId)){
             const conflictoKey = `${bloque.grupoKey}_${bloque.dia}_${bloque.hora}`;
             nuevosConflictos[conflictoKey] = true;
          }
        });
      }
    }
    
    for(const key in asignaturasPorDiaGrupo){
        const horasConflicto = asignaturasPorDiaGrupo[key];
        if (horasConflicto.length > 2) { // Un conflicto es tener la misma materia MÁS de 2 veces al día
            const [grupoKey, dia, asignatura] = key.split('_');
            const bloquesDelGrupo = horarios[grupoKey];
            if (Array.isArray(bloquesDelGrupo)) {
                bloquesDelGrupo.forEach(bloque => {
                    if (bloque.dia === dia && bloque.asignatura === asignatura && horasConflicto.includes(bloque.hora)) {
                        const conflictoKey = `${grupoKey}_${dia}_${bloque.hora}`;
                        nuevosConflictos[conflictoKey] = true;
                    }
                });
            }
        }
    }

    setConflictos(nuevosConflictos);
  }, [horarios, isClient]);

  const handleGenerarHorario = () => {
    if (nivelSeleccionado && grupoSeleccionado) {
      const { horarioGenerado, bloquesNoAsignados: bloquesRestantes } = generarHorarioDesdeDistribucion(nivelSeleccionado, grupoSeleccionado);
      setHorarios(horarioGenerado);
      setBloquesSinAsignar({ ...bloquesSinAsignar, [grupoKey]: bloquesRestantes });
    }
  };
  
  const handleOptimizarHorario = () => {
      if (nivelSeleccionado && grupoSeleccionado) {
          const { horarioOptimizado, bloquesNoAsignados: bloquesRestantes } = optimizarHorario(nivelSeleccionado, grupoSeleccionado);
          setHorarios(horarioOptimizado);
          setBloquesSinAsignar({ ...bloquesSinAsignar, [grupoKey]: bloquesRestantes });
      }
  };

  const onDragEnd = (result: DropResult) => {
    // Lógica para soltar se implementará en el siguiente paso.
    console.log('Elemento soltado:', result);
  };


  const handleDownloadPdf = async () => {
    if (!horarioRef.current || !currentNivel) return;
    setIsGeneratingPdf(true);

    try {
        const canvas = await html2canvas(horarioRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`horario_${currentNivel.nombre}_Grupo_${grupoSeleccionado}.pdf`);
    } catch (error) {
        console.error("Error al generar PDF:", error);
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const currentHorario = useMemo(() => {
    if (!nivelSeleccionado || !grupoSeleccionado) return [];
    const key = `${nivelSeleccionado}_${grupoSeleccionado}`;
    
    const horarioTabla: Record<string, Record<string, any>> = {};
    const horarioData = horarios[key] || [];

    if (Array.isArray(horarioData)) {
      horarioData.forEach(bloque => {
          if(!horarioTabla[bloque.hora]) horarioTabla[bloque.hora] = {};
          horarioTabla[bloque.hora][bloque.dia] = bloque;
      });
    }

    return HORAS.map(hora => ({
        hora,
        ...DIAS.reduce((acc, dia) => {
            acc[dia] = horarioTabla[hora]?.[dia] || {};
            return acc;
        }, {} as Record<string, any>)
    }));

  }, [nivelSeleccionado, grupoSeleccionado, horarios]);
  
  const currentNivel = niveles.find(n => n.id === nivelSeleccionado);
  const GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const grupoKey = `${nivelSeleccionado}_${grupoSeleccionado}`;
  const currentBloquesSinAsignar = bloquesSinAsignar[grupoKey] || [];

  if (!isClient) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8 flex items-center justify-center">
          <p>Cargando datos del horario...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="max-w-screen-2xl mx-auto space-y-8">
          <header className="flex items-center justify-between">
              <Button variant="outline" asChild>
                  <Link href="/"><ArrowLeft className="mr-2 h-4 w-4"/> Volver</Link>
              </Button>
              <div className="text-center">
                  <h2 className="text-xl font-semibold text-foreground">{institucion.nombre}</h2>
                  <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">
                      Horario por Grupo
                  </h1>
                  <p className="mt-2 text-lg text-muted-foreground">
                      Visualice y ajuste el horario. Los conflictos se resaltan en rojo.
                  </p>
              </div>
              <div className="flex items-center gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/horario/docente"><UserCheck className="mr-2 h-4 w-4"/> Vista por Docente</Link>
                  </Button>
                  <Button onClick={handleGenerarHorario} disabled={!nivelSeleccionado || !grupoSeleccionado}>
                      <Wand2 className="mr-2 h-4 w-4"/>
                      Generar Horario
                  </Button>
                  <Button onClick={handleOptimizarHorario} disabled={!currentBloquesSinAsignar.length}>
                      <Combine className="mr-2 h-4 w-4"/>
                      Optimizar
                  </Button>
                  <Button onClick={handleDownloadPdf} disabled={!currentNivel || isGeneratingPdf}>
                      {isGeneratingPdf ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                          <Download className="mr-2 h-4 w-4"/>
                      )}
                      Descargar PDF
                  </Button>
              </div>
          </header>

          <div className="flex justify-center items-center gap-4">
              <Select value={nivelSeleccionado} onValueChange={setNivelSeleccionado}>
                  <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Seleccione un nivel" />
                  </SelectTrigger>
                  <SelectContent>
                      {niveles.map(nivel => (
                      <SelectItem key={nivel.id} value={nivel.id}>{nivel.nombre}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
              <Select value={grupoSeleccionado} onValueChange={setGrupoSeleccionado}>
                  <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Seleccione un grupo" />
                  </SelectTrigger>
                  <SelectContent>
                      {GRUPOS.map(g => <SelectItem key={g} value={g}>Grupo {g}</SelectItem>)}
                  </SelectContent>
              </Select>
              <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => limpiarHorarioGrupo(nivelSeleccionado, grupoSeleccionado)}
                  disabled={!horarios[grupoKey]}
                >
                  <Trash2 className="mr-2 h-4 w-4"/>
                  Limpiar Horario del Grupo
              </Button>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                        variant="destructive"
                        size="sm"
                        disabled={Object.keys(horarios).length === 0}
                      >
                        <AlertCircle className="mr-2 h-4 w-4"/>
                        Limpiar Todos los Horarios
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                              Esta acción eliminará permanentemente TODOS los horarios generados
                              para TODOS los grupos y niveles. No podrá deshacer esta acción.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={limpiarTodosLosHorarios}>
                              Sí, limpiar todo
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
          </div>
          
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-grow" ref={horarioRef}>
                  {currentNivel ? (
                      <Card>
                          <CardHeader>
                              <CardTitle>Horario de {currentNivel.nombre} - Grupo {grupoSeleccionado}</CardTitle>
                              <CardDescription>
                                  Arrastre los bloques de la derecha para llenar los espacios vacíos o reorganice el horario.
                              </CardDescription>
                          </CardHeader>
                          <CardContent>
                              <div className="rounded-md border">
                                  <Table>
                                      <TableHeader>
                                          <TableRow>
                                              <TableHead className="w-[150px]">Hora</TableHead>
                                              {DIAS.map(dia => <TableHead key={dia}>{dia}</TableHead>)}
                                          </TableRow>
                                      </TableHeader>
                                        <TableBody>
                                        {currentHorario.map((fila) => (
                                            <TableRow key={fila.hora} className={fila.hora.includes('Receso') ? 'bg-muted/50 font-medium' : ''}>
                                                <TableCell className="font-semibold">{fila.hora}</TableCell>
                                                {DIAS.map((dia) => {
                                                    const bloque = fila[dia];
                                                    const conflictoKey = `${grupoKey}_${dia}_${fila.hora}`;
                                                    const hayConflicto = conflictos[conflictoKey];
                                                    const colorFondo = coloresGenerados[bloque.asignatura] || 'hsl(var(--accent-foreground))';
                                                    
                                                    return (
                                                      <TableCell 
                                                          key={dia}
                                                          className={cn(
                                                            "text-center p-1 min-h-[70px] transition-colors", 
                                                            hayConflicto && "celda-conflicto-resaltado"
                                                          )}
                                                      >
                                                        {fila.hora.includes('Receso') ? (
                                                          <span>RECESO</span>
                                                        ) : bloque.asignatura ? (
                                                            <div 
                                                              className="flex flex-col gap-1 items-center justify-center text-xs p-1 rounded-md"
                                                              style={{ backgroundColor: colorFondo, color: '#FFFFFF' }}
                                                            >
                                                                <span className="font-bold">{bloque.asignatura}</span>
                                                                <span className="opacity-80">{bloque.docenteId}</span>
                                                            </div>
                                                        ) : (
                                                          <div className="text-muted-foreground opacity-60 h-full w-full">-</div>
                                                        )}
                                                      </TableCell>
                                                    )
                                                })}
                                            </TableRow>
                                        ))}
                                        </TableBody>
                                  </Table>
                              </div>
                          </CardContent>
                      </Card>
                  ) : (
                      <div className="text-center py-10">
                          <p className="text-muted-foreground">
                              Seleccione un nivel y grupo para ver el horario.
                          </p>
                      </div>
                  )}
              </div>
              <aside className="w-full lg:w-64 flex-shrink-0">
                  <Card className="sticky top-8">
                      <CardHeader>
                        <CardTitle>Bloques sin Asignar</CardTitle>
                        <CardDescription>
                          Arrastre estos bloques hacia el horario.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <SafeDroppable droppableId="bloques-sin-asignar">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={cn(
                                "p-2 rounded-md min-h-[200px] space-y-2 transition-colors",
                                snapshot.isDraggingOver ? 'bg-primary/10' : 'bg-muted/50'
                              )}
                            >
                              {currentBloquesSinAsignar.length > 0 ? (
                                currentBloquesSinAsignar.map((bloque, index) => (
                                  <Draggable key={bloque.id} draggableId={bloque.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={cn(
                                              "p-2 rounded-md shadow-sm text-white text-sm select-none flex items-center gap-2 cursor-grab",
                                              snapshot.isDragging && 'shadow-lg'
                                            )}
                                            style={{ 
                                              backgroundColor: coloresGenerados[bloque.asignatura] || '#ccc'
                                            }}
                                        >
                                          <GripVertical className="h-5 w-5 text-white/70"/>
                                          <div>
                                              <p className="font-bold">{bloque.asignatura}</p>
                                              <p className="text-xs opacity-80">{bloque.docenteId}</p>
                                          </div>
                                        </div>
                                    )}
                                  </Draggable>
                                ))
                              ) : (
                                <div className="flex flex-col items-center justify-center text-center text-muted-foreground text-sm py-4 h-full">
                                    <AlertCircle className="h-6 w-6 mb-2"/>
                                    <p>No hay bloques sin asignar para este grupo.</p>
                                </div>
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </SafeDroppable>
                      </CardContent>
                  </Card>
              </aside>
            </div>
        </div>
      </DragDropContext>
    </main>
  );
}
