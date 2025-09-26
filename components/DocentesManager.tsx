

"use client";

import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Docente } from '@/lib/types';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, UserPlus, User, Hash, Clock, BookCopy, Pencil, ChevronDown, Search, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useDistribucionStore';
import { DocenteRestrictionsModal } from './DocenteRestrictionsModal';


interface DocentesManagerProps {
    asignaturasPorDocente: Record<string, string[]>;
    todasLasAsignaturas: string[];
}

export const DocentesManager: FC<DocentesManagerProps> = ({ asignaturasPorDocente, todasLasAsignaturas }) => {
    const { docentes, setDocentes } = useAppStore();
    const [newDocente, setNewDocente] = useState<{ id: string; nombre: string; horasMaximas: string; asignaturas: string[] }>({ id: '', nombre: '', horasMaximas: '', asignaturas: [] });
    const [editingDocente, setEditingDocente] = useState<Docente | null>(null);
    const [restrictingDocente, setRestrictingDocente] = useState<Docente | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const { toast } = useToast();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewDocente(prev => ({ ...prev, [name]: value }));
    }

    const handleAsignaturasChange = (asignatura: string) => {
        setNewDocente(prev => {
            const newAsignaturas = prev.asignaturas.includes(asignatura)
                ? prev.asignaturas.filter(a => a !== asignatura)
                : [...prev.asignaturas, asignatura];
            return { ...prev, asignaturas: newAsignaturas };
        });
    }
    
    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditingDocente(prev => prev ? ({ ...prev, [name]: value }) : null);
    }

    const handleEditAsignaturasChange = (asignatura: string) => {
        setEditingDocente(prev => {
            if (!prev) return null;
            const currentAsignaturas = prev.asignaturas || [];
            const newAsignaturas = currentAsignaturas.includes(asignatura)
                ? currentAsignaturas.filter(a => a !== asignatura)
                : [...currentAsignaturas, asignatura];
            return { ...prev, asignaturas: newAsignaturas };
        });
    }

    const handleAddDocente = (e: React.FormEvent) => {
        e.preventDefault();
        const { id, nombre, horasMaximas, asignaturas } = newDocente;

        if (!id.trim() || !nombre.trim() || !horasMaximas) {
            toast({ title: "Error", description: "Los campos de ID, Nombre y Horas son requeridos.", variant: "destructive" });
            return;
        }
        
        if (docentes.some(d => d.id.trim().toLowerCase() === id.trim().toLowerCase())) {
             toast({ title: "Error", description: "El ID del docente ya existe.", variant: "destructive" });
             setNewDocente(prev => ({ ...prev, id: '' }));
            return;
        }

        const nuevo: Docente = {
            id: id.trim().toUpperCase(),
            nombre: nombre.trim(),
            horasMaximas: parseInt(horasMaximas, 10),
            asignaturas: asignaturas
        }

        setDocentes([...docentes, nuevo]);
        setNewDocente({ id: '', nombre: '', horasMaximas: '', asignaturas: [] });
    }
    
    const handleDeleteDocente = (id: string) => {
        setDocentes(docentes.filter(d => d.id !== id));
    }
    
    const handleEditDocente = (docente: Docente) => {
        setEditingDocente({ ...docente });
    };

    const handleSaveDocente = () => {
        if (!editingDocente) return;

        const { id, nombre, horasMaximas, asignaturas } = editingDocente;

        if (!nombre?.trim() || !horasMaximas) {
            toast({ title: "Error", description: "Los campos de Nombre y Horas son requeridos.", variant: "destructive" });
            return;
        }
        
        const docentesActualizados = docentes.map(d => {
            if (d.id === id) {
                return {
                    ...d,
                    nombre: nombre.trim(),
                    horasMaximas: Number(horasMaximas),
                    asignaturas: asignaturas || []
                };
            }
            return d;
        });

        setDocentes(docentesActualizados);
        setEditingDocente(null);
    };

    const docentesFiltrados = useMemo(() => {
        const query = busqueda.trim().toLowerCase();
        if (!query) return docentes;

        return docentes.filter(docente => 
            docente.nombre.toLowerCase().includes(query) ||
            docente.id.toLowerCase().includes(query)
        );
    }, [busqueda, docentes]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Agregar Nuevo Docente</CardTitle>
                    <CardDescription>Complete el formulario para añadir un nuevo docente al sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddDocente} className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-end gap-4">
                            <div className="grid gap-1.5 flex-grow">
                                <Label htmlFor="nombre-docente">Nombre del Docente</Label>
                                <Input 
                                    id="nombre-docente"
                                    name="nombre"
                                    value={newDocente.nombre}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Dr. Alan Turing"
                                    disabled={!!editingDocente}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="id-docente">ID Único</Label>
                                <Input 
                                    id="id-docente"
                                    name="id"
                                    value={newDocente.id}
                                    onChange={handleInputChange}
                                    placeholder="Ej: TURINGA"
                                    className="w-28"
                                    disabled={!!editingDocente}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="horas-docente">Horas Máximas</Label>
                                <Input 
                                    id="horas-docente"
                                    name="horasMaximas"
                                    type="number"
                                    value={newDocente.horasMaximas}
                                    onChange={handleInputChange}
                                    placeholder="Ej: 35"
                                    className="w-28"
                                    disabled={!!editingDocente}
                                />
                            </div>
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Asignaturas Calificadas</Label>
                            <div className="flex items-center gap-2 flex-wrap">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" disabled={!!editingDocente}>
                                            Seleccionar Asignaturas <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-64 max-h-72 overflow-y-auto">
                                        {todasLasAsignaturas.map(asig => (
                                            <DropdownMenuCheckboxItem
                                                key={asig}
                                                checked={newDocente.asignaturas.includes(asig)}
                                                onCheckedChange={() => handleAsignaturasChange(asig)}
                                                onSelect={(e) => e.preventDefault()} // Evita que el menú se cierre
                                            >
                                                {asig}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="flex gap-1 flex-wrap">
                                    {newDocente.asignaturas.map(asig => <Badge key={asig} variant="secondary">{asig}</Badge>)}
                                </div>
                            </div>
                        </div>
                        <Button type="submit" disabled={!!editingDocente} className="mt-2">
                            <UserPlus className="mr-2 h-4 w-4"/>
                            Agregar Docente
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Lista de Docentes</CardTitle>
                            <CardDescription>
                                Estos son los docentes registrados actualmente en el sistema.
                            </CardDescription>
                        </div>
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o ID..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><div className="flex items-center gap-2"><User/>Nombre</div></TableHead>
                                    <TableHead><div className="flex items-center gap-2"><Hash/>ID</div></TableHead>
                                    <TableHead><div className="flex items-center gap-2"><Clock/>Horas Máximas</div></TableHead>
                                    <TableHead><div className="flex items-center gap-2"><BookCopy/>Asignaturas Calificadas</div></TableHead>
                                    <TableHead className="text-right w-[120px]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {docentesFiltrados.length > 0 ? (
                                    docentesFiltrados.map(docente => (
                                        <TableRow key={docente.id}>
                                            <TableCell className="font-medium">{docente.nombre}</TableCell>
                                            <TableCell>{docente.id}</TableCell>
                                            <TableCell>{docente.horasMaximas} hrs</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                <div className="flex gap-1 flex-wrap max-w-xs">
                                                   {(docente.asignaturas || []).length > 0 ? (docente.asignaturas || []).map(a => <Badge key={a} variant="outline" className="font-normal">{a}</Badge>) : 'Sin asignaturas'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setRestrictingDocente(docente)} disabled={!!editingDocente} title="Definir restricciones horarias">
                                                    <Ban className="h-4 w-4 text-muted-foreground hover:text-orange-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEditDocente(docente)} disabled={!!editingDocente} title="Editar docente">
                                                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-blue-600"/>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteDocente(docente.id)} disabled={!!editingDocente} title="Eliminar docente">
                                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No se encontraron docentes con los criterios de búsqueda.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!editingDocente} onOpenChange={(isOpen) => !isOpen && setEditingDocente(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Docente</DialogTitle>
                        <DialogDescription>
                            Modifique los datos del docente. El ID no se puede cambiar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-nombre" className="text-right">Nombre</Label>
                            <Input id="edit-nombre" name="nombre" value={editingDocente?.nombre || ''} onChange={handleEditInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-horas" className="text-right">Horas Máx.</Label>
                            <Input id="edit-horas" name="horasMaximas" type="number" value={editingDocente?.horasMaximas || ''} onChange={handleEditInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Asignaturas</Label>
                            <div className="col-span-3 flex flex-col gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            Seleccionar Asignaturas <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-64 max-h-72 overflow-y-auto">
                                        {todasLasAsignaturas.map(asig => (
                                            <DropdownMenuCheckboxItem
                                                key={asig}
                                                checked={(editingDocente?.asignaturas || []).includes(asig)}
                                                onCheckedChange={() => handleEditAsignaturasChange(asig)}
                                                onSelect={(e) => e.preventDefault()}
                                            >
                                                {asig}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="flex gap-1 flex-wrap">
                                    {(editingDocente?.asignaturas || []).map(asig => <Badge key={asig} variant="secondary">{asig}</Badge>)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancelar</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleSaveDocente}>Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {restrictingDocente && (
                <DocenteRestrictionsModal 
                    docente={restrictingDocente}
                    isOpen={!!restrictingDocente}
                    onClose={() => setRestrictingDocente(null)}
                />
            )}
        </div>
    )
}
