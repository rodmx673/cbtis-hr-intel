
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Docente } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarClock, Download, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useDistribucionStore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


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


export default function HorarioPorDocente() {
  const { docentes, horarios, datos, niveles } = useAppStore();
  const [isClient, setIsClient] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const horarioRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && docentes.length > 0 && !docenteSeleccionado) {
        setDocenteSeleccionado(docentes[0].id);
    }
  }, [isClient, docentes, docenteSeleccionado]);


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

  const currentHorarioDocente = useMemo(() => {
    if (!docenteSeleccionado) return [];
    
    const horarioTabla: Record<string, Record<string, any>> = {};

    Object.entries(horarios).forEach(([grupoKey, bloques]) => {
        if(Array.isArray(bloques)){
            bloques.forEach(bloque => {
                if (bloque.docenteId === docenteSeleccionado) {
                    if(!horarioTabla[bloque.hora]) horarioTabla[bloque.hora] = {};
                    
                    const [nivelId, grupo] = grupoKey.split('_');
                    const nivelInfo = niveles.find((n:any) => n.id === nivelId);

                    horarioTabla[bloque.hora][bloque.dia] = {
                        ...bloque,
                        grupo,
                        nivelNombre: nivelInfo?.nombre || nivelId,
                    };
                }
            })
        }
    });

    return HORAS.map(hora => ({
        hora,
        ...DIAS.reduce((acc, dia) => {
            acc[dia] = horarioTabla[hora]?.[dia] || {};
            return acc;
        }, {} as Record<string, any>)
    }));
  }, [docenteSeleccionado, horarios, niveles]);


  const currentDocente = docentes.find(d => d.id === docenteSeleccionado);
  
  const handleDownloadPdf = async () => {
    if (!horarioRef.current || !currentDocente) return;
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
        pdf.save(`horario_${currentDocente.id}_${currentDocente.nombre}.pdf`);
    } catch (error) {
        console.error("Error al generar PDF:", error);
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  if (!isClient) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8 flex items-center justify-center">
          <p>Cargando datos del horario...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
            <Button variant="outline" asChild>
                <Link href="/"><ArrowLeft className="mr-2 h-4 w-4"/> Volver</Link>
            </Button>
            <div className="text-center">
                <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">
                    Horario por Docente
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Visualice el horario de clases para un docente específico.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                    <Link href="/horario"><CalendarClock className="mr-2 h-4 w-4"/> Vista por Grupo</Link>
                </Button>
                 <Button onClick={handleDownloadPdf} disabled={!docenteSeleccionado || isGeneratingPdf}>
                    {isGeneratingPdf ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4"/>
                    )}
                    Descargar PDF
                </Button>
            </div>
        </header>

        <div className="flex justify-center gap-4">
            <Select value={docenteSeleccionado} onValueChange={setDocenteSeleccionado}>
                <SelectTrigger className="w-[380px]">
                    <SelectValue placeholder="Seleccione un docente" />
                </SelectTrigger>
                <SelectContent>
                    {docentes.map(docente => (
                    <SelectItem key={docente.id} value={docente.id}>{docente.nombre} ({docente.id})</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        
        <div ref={horarioRef}>
            {currentDocente ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Horario de {currentDocente.nombre}</CardTitle>
                        <CardDescription>
                            Este es el horario consolidado para todas las asignaturas y grupos.
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
                                {currentHorarioDocente.map((fila, index) => (
                                    <TableRow key={index} className={fila.hora.includes('Receso') ? 'bg-muted/50 font-medium' : ''}>
                                        <TableCell className="font-semibold">{fila.hora}</TableCell>
                                        {DIAS.map(dia => {
                                            const bloque = fila[dia];
                                            const colorFondo = coloresGenerados[bloque.asignatura] || 'hsl(var(--accent-foreground))';

                                            return (
                                                <TableCell key={dia} className="text-center p-2">
                                                    {fila.hora.includes('Receso') ? (
                                                        <span>RECESO</span>
                                                    ) : (
                                                        bloque.asignatura ? (
                                                            <div 
                                                              className="flex flex-col gap-1 items-center justify-center text-xs p-1 rounded-md"
                                                              style={{ backgroundColor: colorFondo, color: '#FFFFFF' }}
                                                            >
                                                                <span className="font-bold">{bloque.asignatura}</span>
                                                                <span className="opacity-80">{bloque.nivelNombre} - G{bloque.grupo}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-muted-foreground opacity-60">-</div>
                                                        )
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
                        Seleccione un docente para ver su horario.
                    </p>
                </div>
            )}
        </div>
      </div>
    </main>
  );
}
