"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wand2, UserCheck, Download, Loader2, GripVertical, AlertCircle, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { generarHorarioDesdeDistribucion } from '@/lib/horario-generator';
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
};

type Bloque = {
  id: string;
  asignatura?: string;
  docenteId?: string;
  dia?: string;
  hora?: string;
  [key: string]: any;
};

type FilaHorario = {
  hora: string;
  [key: string]: any;
};

export default function HorarioPorGrupo() {
  const { 
    niveles, datos, horarios, setHorarios, institucion, 
    bloquesSinAsignar, setBloquesSinAsignar,
    limpiarHorarioGrupo, limpiarTodosLosHorarios,
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
      if (asignatura.asignatura) todasLasAsignaturas.add(asignatura.asignatura);
    });

    const colores: Record<string, string> = {};
    Array.from(todasLasAsignaturas).forEach((asignatura, index) => {
      colores[asignatura] = generarColorUnico(index);
    });
    return colores;
  }, [isClient, datos]);

  useEffect(() => {
    if (!isClient || Object.keys(horarios).length === 0) return;

    const nuevosConflictos: Record<string, boolean> = {};
    const bloquesPorHora: Record<string, any[]> = {};
    const asignaturasPorDiaGrupo: Record<string, string[]> = {};

    Object.entries(horarios).forEach(([grupoKey, bloquesGrupo]) => {
      if (Array.isArray(bloquesGrupo)) {
        bloquesGrupo.forEach((bloque: Bloque) => {
          // Saltar bloques que no tienen día/hora (ej. bloques que están temporalmente sin asignar en el store)
          if (!bloque.dia || !bloque.hora) return;

          const keyHora = `${bloque.dia}_${bloque.hora}`;
          if (!bloquesPorHora[keyHora]) bloquesPorHora[keyHora] = [];
          bloquesPorHora[keyHora].push({ ...bloque, grupoKey });
          
          const keyDia = `${grupoKey}_${bloque.dia}_${bloque.asignatura}`;
          if (!asignaturasPorDiaGrupo[keyDia]) asignaturasPorDiaGrupo[keyDia] = [];
          asignaturasPorDiaGrupo[keyDia].push(bloque.hora as string);
        });
      }
    });

    for (const key in bloquesPorHora) {
      const bloques = bloquesPorHora[key];
      const docentesEnBloque = bloques.map(b => b.docenteId);
      const docentesDuplicados = docentesEnBloque.filter((d, i) => docentesEnBloque.indexOf(d) !== i && d);

      if (docentesDuplicados.length > 0) {
        bloques.forEach(bloque => {
          if (docentesDuplicados.includes(bloque.docenteId)) {
            const conflictoKey = `${bloque.grupoKey}_${bloque.dia}_${bloque.hora}`;
            nuevosConflictos[conflictoKey] = true;
          }
        });
      }
    }
    
    for (const key in asignaturasPorDiaGrupo) {
      const horasConflicto = asignaturasPorDiaGrupo[key];
      if (horasConflicto.length > 1) {
        const [grupoKey, dia, asignatura] = key.split('_');
        const bloquesDelGrupo = horarios[grupoKey];
        if (Array.isArray(bloquesDelGrupo)) {
          bloquesDelGrupo.forEach(bloque => {
            if (bloque.dia === dia && bloque.asignatura === asignatura && horasConflicto.includes(bloque.hora as string)) {
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
      const grupoKey = `${nivelSeleccionado}_${grupoSeleccionado}`;
      
      // Actualiza directamente el estado de bloques sin asignar
      setBloquesSinAsignar({
        ...bloquesSinAsignar,
        [grupoKey]: bloquesRestantes
      });
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const grupoKey = `${nivelSeleccionado}_${grupoSeleccionado}`;
    
    const bloquesActualesSinAsignar = [...(bloquesSinAsignar[grupoKey] || [])];
    const bloquesActualesEnHorario = [...(horarios[grupoKey] || [])];
    const [, idBloqueSinAsignar, indexBloqueSinAsignar] = draggableId.split('-');

    // 1. Mover de "Sin Asignar" al Horario
    if (source.droppableId === 'bloques-sin-asignar' && destination.droppableId.startsWith('celda-')) {
      const [, dia, hora] = destination.droppableId.split('-');
      
      // Quitar de bloques sin asignar
      const [bloqueMovido] = bloquesActualesSinAsignar.splice(source.index, 1);

      // Crear bloque con su nueva posición
      const nuevoBloqueAsignado: Bloque = {
        ...bloqueMovido,
        dia,
        hora,
      };
      
      // Buscar si ya hay un bloque en esa celda para regresarlo a "sin asignar"
      const bloqueAnteriorIndex = bloquesActualesEnHorario.findIndex(
          (b: Bloque) => b.dia === dia && b.hora === hora
      );

      let bloquesParaHorario = [...bloquesActualesEnHorario];
      if (bloqueAnteriorIndex !== -1) {
          // Bloque anterior en la celda: se devuelve a bloques sin asignar
          const [bloqueAnterior] = bloquesParaHorario.splice(bloqueAnteriorIndex, 1);
          bloquesActualesSinAsignar.push(bloqueAnterior);
      }

      // Añadir el nuevo bloque a la lista del horario
      bloquesParaHorario.push(nuevoBloqueAsignado);
      
      // Actualizar estados
      setHorarios({ ...horarios, [grupoKey]: bloquesParaHorario });
      setBloquesSinAsignar({ ...bloquesSinAsignar, [grupoKey]: bloquesActualesSinAsignar });
      return;
    }

    // 2. Mover del Horario a "Sin Asignar"
    if (source.droppableId.startsWith('celda-') && destination.droppableId === 'bloques-sin-asignar') {
        const [, dia, hora] = source.droppableId.split('-');
        
        // Buscar y remover el bloque del horario
        const bloqueIndex = bloquesActualesEnHorario.findIndex(
            (b: Bloque) => b.dia === dia && b.hora === hora
        );
        
        if (bloqueIndex !== -1) {
            const [bloqueMovido] = bloquesActualesEnHorario.splice(bloqueIndex, 1);
            
            // Limpiar las propiedades de posición del bloque y agregarlo a 'sin asignar'
            const bloqueParaSinAsignar: Bloque = { ...bloqueMovido };
            delete bloqueParaSinAsignar.dia;
            delete bloqueParaSinAsignar.hora;
            
            bloquesActualesSinAsignar.splice(destination.index, 0, bloqueParaSinAsignar);

            // Actualizar estados
            setHorarios({ ...horarios, [grupoKey]: bloquesActualesEnHorario });
            setBloquesSinAsignar({ ...bloquesSinAsignar, [grupoKey]: bloquesActualesSinAsignar });
        }
        return;
    }
    
    // 3. Mover de Celda a Celda (Reemplazo)
    if (source.droppableId.startsWith('celda-') && destination.droppableId.startsWith('celda-')) {
        const [, srcDia, srcHora] = source.droppableId.split('-');
        const [, destDia, destHora] = destination.droppableId.split('-');

        if (srcDia === destDia && srcHora === destHora) return; // Mover a la misma celda
        
        // 1. Obtener el bloque de la celda de origen
        const srcBloqueIndex = bloquesActualesEnHorario.findIndex(
            (b: Bloque) => b.dia === srcDia && b.hora === srcHora
        );
        
        if (srcBloqueIndex === -1) return;
        
        const [bloqueMovido] = bloquesActualesEnHorario.splice(srcBloqueIndex, 1);

        // 2. Verificar si hay un bloque en la celda de destino para regresarlo a "sin asignar"
        const destBloqueIndex = bloquesActualesEnHorario.findIndex(
            (b: Bloque) => b.dia === destDia && b.hora === destHora
        );

        if (destBloqueIndex !== -1) {
            // Bloque anterior en la celda: se devuelve a bloques sin asignar
            const [bloqueAnterior] = bloquesActualesEnHorario.splice(destBloqueIndex, 1);
            
            const bloqueParaSinAsignar: Bloque = { ...bloqueAnterior };
            delete bloqueParaSinAsignar.dia;
            delete bloqueParaSinAsignar.hora;
            bloquesActualesSinAsignar.push(bloqueParaSinAsignar);
        }

        // 3. Crear el nuevo bloque asignado en la celda de destino
        const nuevoBloqueAsignado: Bloque = {
            ...bloqueMovido,
            dia: destDia,
            hora: destHora,
        };

        // 4. Agregar el bloque movido a la nueva posición
        bloquesActualesEnHorario.push(nuevoBloqueAsignado);
        
        // 5. Actualizar estados
        setHorarios({ ...horarios, [grupoKey]: bloquesActualesEnHorario });
        setBloquesSinAsignar({ ...bloquesSinAsignar, [grupoKey]: bloquesActualesSinAsignar });
        return;
    }
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

  // INICIO DE LA ADAPTACIÓN: Función para descargar JSON
  const handleDownloadJson = () => {
    if (!nivelSeleccionado || !grupoSeleccionado) return;
    
    const key = `${nivelSeleccionado}_${grupoSeleccionado}`;
    const horarioData = horarios[key] || [];

    // 1. Convertir los datos a una cadena JSON
    const jsonString = JSON.stringify(horarioData, null, 2); // 'null, 2' para formato legible
    
    // 2. Crear un Blob (Binary Large Object) con el contenido JSON
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 3. Crear un enlace de descarga
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // 4. Asignar el nombre del archivo
    const currentNivelNombre = niveles.find(n => n.id === nivelSeleccionado)?.nombre || 'Horario';
    a.download = `horario_${currentNivelNombre}_Grupo_${grupoSeleccionado}.json`;
    
    // 5. Simular el clic y limpiar
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  // FIN DE LA ADAPTACIÓN


  const currentHorario = useMemo(() => {
    if (!nivelSeleccionado || !grupoSeleccionado) return [];
    const key = `${nivelSeleccionado}_${grupoSeleccionado}`;
    
    const horarioTabla: Record<string, Record<string, any>> = {};
    const horarioData = horarios[key] || [];

    if (Array.isArray(horarioData)) {
      horarioData.forEach((bloque: Bloque) => {
        if (!horarioTabla[bloque.hora as string]) horarioTabla[bloque.hora as string] = {};
        horarioTabla[bloque.hora as string][bloque.dia as string] = bloque;
      });
    }

    return HORAS.map(hora => {
      const filaBase: FilaHorario = { hora };
      DIAS.forEach(dia => {
        filaBase[dia] = horarioTabla[hora]?.[dia] || {};
      });
      return filaBase;
    });

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
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          
          {/* INICIO DE LA CORRECCIÓN 1: Se eliminó 'asChild' */}
          <Button variant="outline"> 
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4"/> Volver
            </Link>
          </Button>
          {/* FIN DE LA CORRECCIÓN 1 */}

          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">{institucion.nombre}</h2>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Horario por Grupo
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Visualice y ajuste el horario. Los conflictos se resaltan en rojo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            
            {/* INICIO DE LA CORRECCIÓN 2: Se eliminó 'asChild' */}
            <Button variant="outline">
              <Link href="/horario/docente">
                <UserCheck className="mr-2 h-4 w-4"/> Vista por Docente
              </Link>
            </Button>
            {/* FIN DE LA CORRECCIÓN 2 */}

            <Button onClick={handleGenerarHorario} disabled={!nivelSeleccionado || !grupoSeleccionado}>
              <Wand2 className="mr-2 h-4 w-4"/>
              Generar Horario
            </Button>
            <Button onClick={handleDownloadPdf} disabled={!currentNivel || isGeneratingPdf}>
              {isGeneratingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4"/>
              )}
              Descargar PDF
            </Button>
            
            {/* INICIO DE LA ADAPTACIÓN: Botón de Descargar JSON */}
            <Button 
              onClick={handleDownloadJson} 
              disabled={!currentNivel || Object.keys(horarios).length === 0}
              variant="secondary"
            >
              <Download className="mr-2 h-4 w-4"/>
              Descargar JSON
            </Button>
            {/* FIN DE LA ADAPTACIÓN */}

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
              {GRUPOS.map(g => (
                <SelectItem key={g} value={g}>Grupo {g}</SelectItem>
              ))}
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
        
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow" ref={horarioRef}>
              {currentNivel ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Horario de {currentNivel.nombre} - Grupo {grupoSeleccionado}</CardTitle>
                    <CardDescription>
                      Arrastre los bloques de la derecha para llenar los espacios vacíos o intercambiar.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[150px]">Hora</TableHead>
                            {DIAS.map(dia => (
                              <TableHead key={dia}>{dia}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentHorario.map((fila, index) => (
                            <TableRow 
                              key={index} 
                              className={fila.hora.includes('Receso') ? 'bg-muted/50 font-medium' : ''}
                            >
                              <TableCell className="font-semibold">{fila.hora}</TableCell>
                              {DIAS.map(dia => {
                                const bloque = fila[dia] as Bloque;
                                const conflictoKey = `${grupoKey}_${dia}_${fila.hora}`;
                                const hayConflicto = conflictos[conflictoKey];
                                const colorFondo = bloque?.asignatura 
                                  ? coloresGenerados[bloque.asignatura] 
                                  : 'hsl(var(--accent-foreground))';
                                const isReceso = fila.hora.includes('Receso');
                                const isDroppable = !isReceso;

                                return (
                                  <SafeDroppable 
                                    key={`${dia}-${fila.hora}`} 
                                    droppableId={`celda-${dia}-${fila.hora}`} 
                                    isDropDisabled={!isDroppable}
                                  >
                                    {(provided, snapshot) => (
                                      <TableCell 
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={cn(
                                          "text-center p-1 min-h-[70px] transition-colors", 
                                          hayConflicto && "bg-red-200/50 border-2 border-red-500", 
                                          snapshot.isDraggingOver && 'bg-accent/20'
                                        )}
                                      >
                                        {isReceso ? (
                                          <span>RECESO</span>
                                        ) : (
                                          bloque?.asignatura ? (
                                              <Draggable 
                                                key={`bloque-horario-${bloque.id}`}
                                                draggableId={`bloque-horario-${bloque.id}`}
                                                index={index} 
                                              >
                                                {(provided, snapshot) => (
                                                    <div 
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                      className={cn(
                                                        "flex flex-col gap-1 items-center justify-center text-xs p-1 rounded-md cursor-grab",
                                                        snapshot.isDragging && 'shadow-xl'
                                                      )}
                                                      style={{ 
                                                            backgroundColor: colorFondo, 
                                                            color: '#FFFFFF' 
                                                          }}
                                                      >
                                                        <span className="font-bold">{bloque.asignatura}</span>
                                                        <span className="opacity-80">{bloque.docenteId}</span>
                                                      </div>
                                                )}
                                              </Draggable>
                                          ) : (
                                            <div className="text-muted-foreground opacity-60 h-full w-full">-</div>
                                          )
                                        )}
                                        {provided.placeholder}
                                      </TableCell>
                                    )}
                                  </SafeDroppable>
                                );
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
                    Estos bloques no pudieron ser asignados automáticamente.
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
                            <Draggable 
                              key={`bloque-${bloque.id}-${index}`} 
                              draggableId={`bloque-${bloque.id}-${index}`} 
                              index={index}
                            >
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
                                    backgroundColor: bloque.asignatura 
                                      ? coloresGenerados[bloque.asignatura] 
                                      : '#ccc'
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
                          <div className="flex flex-col items-center justify-center text-center text-muted-foreground text-sm py-4">
                            <AlertCircle className="h-6 w-6 mb-2"/>
                            <p>No hay bloques sin asignar para este grupo, o no se ha generado un horario.</p>
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
        </DragDropContext>
      </div>
    </main>
  );
}