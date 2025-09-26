
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/useDistribucionStore";

export default function RestriccionesPage() {
  const { docentes, restricciones, reglas, setReglas } = useAppStore();
  
  const [isClient, setIsClient] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState("");

  const docentesValidos = docentes.filter(d => Array.isArray(d.asignaturas) && d.asignaturas.length > 0);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const toggleRegla = (id: string) => {
    const actualizadas = reglas.map(r => r.id === id ? { ...r, activa: !r.activa } : r);
    setReglas(actualizadas);
  };
  
  if (!isClient) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8 flex items-center justify-center">
          <p>Cargando datos...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
            <Button variant="outline" asChild>
                <Link href="/"><ArrowLeft className="mr-2 h-4 w-4"/> Volver</Link>
            </Button>
            <div className="text-center">
                <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">
                    Gestión de Reglas y Restricciones
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Defina las reglas del generador y consulte los horarios de los docentes.
                </p>
            </div>
            <div className="w-28"></div>
        </header>

        <Card>
            <CardHeader>
                <CardTitle>Reglas Base del Generador</CardTitle>
                <CardDescription>Active o desactive las reglas que el generador de horarios debe seguir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {reglas.map(regla => (
                    <div key={regla.id} className="flex items-center justify-between p-3 rounded-md border bg-card-50">
                        <div>
                            <h4 className="font-semibold">{regla.nombre}</h4>
                            <p className="text-sm text-muted-foreground">{regla.descripcion}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor={`switch-${regla.id}`}>{regla.activa ? 'Activa' : 'Inactiva'}</Label>
                            <Switch
                                id={`switch-${regla.id}`}
                                checked={regla.activa}
                                onCheckedChange={() => toggleRegla(regla.id)}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Consulta de Restricciones Horarias por Docente</CardTitle>
                <CardDescription>Elija un docente para ver sus bloques horarios no disponibles.</CardDescription>
            </CardHeader>
            <CardContent>
                <Select value={docenteSeleccionado} onValueChange={setDocenteSeleccionado}>
                    <SelectTrigger className="w-full sm:w-[380px] mb-6">
                        <SelectValue placeholder="Seleccione un docente" />
                    </SelectTrigger>
                    <SelectContent>
                        {docentesValidos.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.nombre} ({d.id})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {docenteSeleccionado && (
                    <div>
                         <h4 className="font-bold mb-2">Resumen de Restricciones para: {docentes.find(d => d.id === docenteSeleccionado)?.nombre}</h4>
                         <div className="flex-1">
                            <h5 className="font-semibold text-destructive mb-2">Bloques No Disponibles</h5>
                            <ul className="list-disc list-inside bg-destructive/10 p-4 rounded-md text-sm space-y-1 min-h-[5rem]">
                                {restricciones[docenteSeleccionado]?.noDisponibles.map((r, i) => <li key={`nd-${i}`}>{r.replace(/_/g, " ")}</li>)}
                                {(!restricciones[docenteSeleccionado] || restricciones[docenteSeleccionado].noDisponibles.length === 0) && <p className="text-muted-foreground">Ninguna restricción definida.</p>}
                            </ul>
                       </div>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
