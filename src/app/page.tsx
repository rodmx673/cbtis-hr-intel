
"use client";

import { useState, useEffect, useMemo } from 'react';
import { EditableTable } from '@/components/EditableTable';
import { DistribucionGrupo } from '@/components/DistribucionGrupo';
import { DocentesManager } from '@/components/DocentesManager';
import { NivelConfigurator } from '@/components/NivelConfigurator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Pencil, PlusCircle, CalendarClock, UserCheck } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { obtenerAsignaturasDesdeCargaHorariaBase } from '@/lib/utils';
import { BotonDepurar } from '@/components/BotonDepurar';
import { useAppStore } from '@/store/useDistribucionStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Nivel } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import type { DistribucionRow } from '@/lib/types';


const columns = [
  { key: 'asignatura', header: 'Asignatura' },
  { key: 'horas', header: 'Horas/Semana' },
  { key: 'especialidad', header: 'Especialidad' },
];

const newRowTemplate = { asignatura: '', horas: '', especialidad: false };


export default function GestionHorariosAsignaturasBase() {
  const { 
    niveles, datos, horasObjetivo, distribuciones, docentes, horarios,
    setHorasObjetivo, 
    updateNivelData, updateDistribucionData, handleNivelesSave
  } = useAppStore();

  const [isClient, setIsClient] = useState(false);
  const [nivelSeleccionado, setNivelSeleccionado] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Zustand's persist middleware handles rehydration automatically
  }, []);

  useEffect(() => {
    if (isClient) {
      if (niveles.length > 0 && !niveles.find(n => n.id === nivelSeleccionado)) {
          setNivelSeleccionado(niveles[0].id);
      } else if (niveles.length === 0) {
          setNivelSeleccionado('');
      }
    }
  }, [niveles, nivelSeleccionado, isClient]);
  
  const handleObjetivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!nivelSeleccionado) return;
    const nuevoObjetivo = {
      ...horasObjetivo,
      [nivelSeleccionado]: parseInt(e.target.value, 10) || 0,
    };
    setHorasObjetivo(nuevoObjetivo);
  };
  
  const currentNivelData = nivelSeleccionado ? datos[nivelSeleccionado] || [] : [];
  const currentDistribucionData = nivelSeleccionado ? distribuciones[nivelSeleccionado] || [] : [];
  const currentNivel = niveles.find(n => n.id === nivelSeleccionado);
  const currentHorasObjetivo = nivelSeleccionado ? horasObjetivo[nivelSeleccionado] || 0 : 0;
  
  const asignaturasOptions = useMemo(() => 
    currentNivelData
      .map(d => ({ value: d.asignatura, label: d.asignatura, horas: d.horas }))
      .filter(d => d.value)
  , [currentNivelData]);
  
  const asignaturasPorDocente = useMemo(() => {
    const mapa: Record<string, Set<string>> = {};
    Object.values(horarios).forEach(grupoDeBloques => {
        if (Array.isArray(grupoDeBloques)) {
            grupoDeBloques.forEach(bloque => {
                if (bloque && bloque.docenteId && bloque.asignatura) {
                    if (!mapa[bloque.docenteId]) {
                        mapa[bloque.docenteId] = new Set();
                    }
                    mapa[bloque.docenteId].add(bloque.asignatura);
                }
            });
        }
    });

    const resultado: Record<string, string[]> = {};
    for (const docenteId in mapa) {
        resultado[docenteId] = Array.from(mapa[docenteId]);
    }
    return resultado;
}, [horarios]);

  const todasLasAsignaturas = useMemo(() => {
    if (!isClient) return [];
    return obtenerAsignaturasDesdeCargaHorariaBase(datos);
  }, [isClient, datos]);
  
  const handleAddDistribucionRow = () => {
    if (!nivelSeleccionado) return;
    const newRow: DistribucionRow = {
      id: uuidv4(),
      asignatura: '',
      horas: '',
      grupos: Array(6).fill(''),
    };
    updateDistribucionData(nivelSeleccionado, [...currentDistribucionData, newRow]);
  };

  const hasEmptyDistribucionRow = useMemo(() => {
     return currentDistribucionData.some(row => !row.asignatura);
  }, [currentDistribucionData]);

  const asignaturasDisponiblesDistribucion = useMemo(() => {
    const asignaturasSeleccionadas = new Set(currentDistribucionData.map(d => d.asignatura));
    return asignaturasOptions.filter(opt => !asignaturasSeleccionadas.has(opt.value));
  }, [currentDistribucionData, asignaturasOptions]);


  if (!isClient) {
      return (
        <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8 flex items-center justify-center">
            <p>Cargando datos...</p>
        </main>
      )
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">
            Scheduler Base Configurator
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Defina las asignaturas, carga horaria, docentes y distribución base para su institución.
          </p>
        </header>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {niveles.length > 0 && (
              <>
                <Select
                  value={nivelSeleccionado}
                  onValueChange={(value) => setNivelSeleccionado(value)}
                  disabled={editMode}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Seleccione un nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {niveles.map(nivel => (
                      <SelectItem key={nivel.id} value={nivel.id}>{nivel.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Label htmlFor="horas-objetivo" className="text-muted-foreground">Meta de Horas:</Label>
                  <Input
                    id="horas-objetivo"
                    type="number"
                    value={currentHorasObjetivo}
                    onChange={handleObjetivoChange}
                    className="w-24"
                    disabled={!nivelSeleccionado || !editMode}
                  />
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
                <Label htmlFor="edit-mode" className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                    <Pencil className="h-4 w-4"/>
                    Modo Edición
                </Label>
                <Switch
                    id="edit-mode"
                    checked={editMode}
                    onCheckedChange={setEditMode}
                    disabled={!nivelSeleccionado && niveles.length > 0}
                />
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(true)}>
                <Settings className="h-5 w-5" />
                <span className="sr-only">Configurar niveles</span>
            </Button>
            <ThemeToggle />
        </div>

        <Tabs defaultValue="carga-horaria" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-7">
            <TabsTrigger value="carga-horaria">
                Carga Horaria
            </TabsTrigger>
            <TabsTrigger value="distribucion">
                Distribución por Grupo
            </TabsTrigger>
              <TabsTrigger value="docentes">
                Docentes
            </TabsTrigger>
              <TabsTrigger value="restricciones" asChild>
              <Link href="/restricciones">
                  Restricciones
              </Link>
            </TabsTrigger>
            <TabsTrigger value="horarios-fijos" asChild>
              <Link href="/restricciones/horario-fijo">
                  Horarios Fijos
              </Link>
            </TabsTrigger>
            <TabsTrigger value="horario-grupo" asChild>
              <Link href="/horario">
                  Horario por Grupo
              </Link>
            </TabsTrigger>
            <TabsTrigger value="horario-docente" asChild>
              <Link href="/horario/docente">
                  Horario por Docente
              </Link>
            </TabsTrigger>
          </TabsList>
            <TabsContent value="carga-horaria">
              {nivelSeleccionado && currentNivel ? (
                <Card className="shadow-md border-border mt-4">
                  <CardHeader>
                    <CardTitle className="font-headline">Carga Horaria Base: {currentNivel.nombre}</CardTitle>
                    <CardDescription>
                      Defina las asignaturas y la cantidad de horas semanales para este nivel.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EditableTable
                      key={`base-${nivelSeleccionado}`}
                      data={currentNivelData}
                      setData={(newData) => updateNivelData(nivelSeleccionado, newData)}
                      columns={columns}
                      newRowTemplate={newRowTemplate}
                      showFooter={true}
                      horasObjetivo={currentHorasObjetivo}
                      isEditable={editMode}
                    />
                  </CardContent>
                  <CardFooter>
                    <BotonDepurar />
                  </CardFooter>
                </Card>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    {niveles.length > 0 ? "Seleccione un nivel para ver su configuración." : "Agregue un nivel para comenzar."}
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="distribucion">
              {nivelSeleccionado && currentNivel ? (
                <Card className="shadow-md border-border mt-4">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-headline">Distribución Académica por Grupo: {currentNivel.nombre}</CardTitle>
                      <CardDescription>
                        Asigne las materias definidas a los diferentes grupos. El código de profesor se puede usar para la asignación.
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={handleAddDistribucionRow} 
                      variant="outline"
                      disabled={hasEmptyDistribucionRow || asignaturasDisponiblesDistribucion.length === 0 || !editMode}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Agregar Asignatura
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <DistribucionGrupo
                        key={`distribucion-${nivelSeleccionado}`}
                        data={currentDistribucionData}
                        setData={(newData) => updateDistribucionData(nivelSeleccionado, newData)}
                        asignaturasOptions={asignaturasOptions}
                        docentes={docentes}
                        isEditable={editMode}
                      />
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    Seleccione un nivel para configurar la distribución.
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="docentes">
                <Card className="shadow-md border-border mt-4">
                    <CardHeader>
                      <CardTitle className="font-headline">Gestión de Docentes</CardTitle>
                      <CardDescription>
                        Añada, edite o elimine los docentes de la institución.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DocentesManager 
                            asignaturasPorDocente={asignaturasPorDocente}
                            todasLasAsignaturas={todasLasAsignaturas}
                        />
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
      </div>
      <NivelConfigurator 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        niveles={niveles}
        onSave={handleNivelesSave}
      />
    </main>
  );
}
