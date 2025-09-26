

"use client";

import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Aula } from '@/lib/types';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, UserPlus, Pencil, Search, School, Hash, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useAppStore } from '@/store/useDistribucionStore';
import { nanoid } from 'nanoid';


export const AulasManager: FC = () => {
    const { aulas, setAulas } = useAppStore();
    const [newAula, setNewAula] = useState<{ id: string; nombre: string; capacidad: string }>({ id: '', nombre: '', capacidad: '30' });
    const [editingAula, setEditingAula] = useState<Aula | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const { toast } = useToast();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewAula(prev => ({ ...prev, [name]: value }));
    }

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditingAula(prev => prev ? ({ ...prev, [name]: value }) : null);
    }

    const handleAddAula = (e: React.FormEvent) => {
        e.preventDefault();
        const { id, nombre, capacidad } = newAula;

        if (!id.trim() || !nombre.trim()) {
            toast({ title: "Error", description: "El ID y el Nombre del aula son requeridos.", variant: "destructive" });
            return;
        }
        
        if (aulas.some(d => d.id.trim().toLowerCase() === id.trim().toLowerCase())) {
             toast({ title: "Error", description: "El ID del aula ya existe.", variant: "destructive" });
             setNewAula(prev => ({ ...prev, id: '' }));
            return;
        }

        const nueva: Aula = {
            id: id.trim().toUpperCase(),
            nombre: nombre.trim(),
            capacidad: parseInt(capacidad, 10) || 0,
        }

        setAulas([...aulas, nueva]);
        setNewAula({ id: '', nombre: '', capacidad: '30' });
    }
    
    const handleDeleteAula = (id: string) => {
        setAulas(aulas.filter(d => d.id !== id));
    }
    
    const handleEditAula = (aula: Aula) => {
        setEditingAula({ ...aula });
    };

    const handleSaveAula = () => {
        if (!editingAula) return;

        const { id, nombre, capacidad } = editingAula;

        if (!nombre?.trim()) {
            toast({ title: "Error", description: "El campo de Nombre es requerido.", variant: "destructive" });
            return;
        }
        
        const aulasActualizadas = aulas.map(d => {
            if (d.id === id) {
                return {
                    ...d,
                    nombre: nombre.trim(),
                    capacidad: Number(capacidad) || 0,
                };
            }
            return d;
        });

        setAulas(aulasActualizadas);
        setEditingAula(null);
    };

    const aulasFiltradas = useMemo(() => {
        const query = busqueda.trim().toLowerCase();
        if (!query) return aulas;

        return aulas.filter(aula => 
            aula.nombre.toLowerCase().includes(query) ||
            aula.id.toLowerCase().includes(query)
        );
    }, [busqueda, aulas]);

    return (
        <div className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">Agregar Nueva Aula</h3>
                <form onSubmit={handleAddAula} className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="grid gap-1.5 flex-grow">
                        <Label htmlFor="nombre-aula">Nombre del Aula</Label>
                        <Input 
                            id="nombre-aula"
                            name="nombre"
                            value={newAula.nombre}
                            onChange={handleInputChange}
                            placeholder="Ej: Salón 101, Laboratorio B"
                            disabled={!!editingAula}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="id-aula">ID Único</Label>
                        <Input 
                            id="id-aula"
                            name="id"
                            value={newAula.id}
                            onChange={handleInputChange}
                            placeholder="Ej: S101"
                            className="w-28"
                            disabled={!!editingAula}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="capacidad-aula">Capacidad</Label>
                        <Input 
                            id="capacidad-aula"
                            name="capacidad"
                            type="number"
                            value={newAula.capacidad}
                            onChange={handleInputChange}
                            placeholder="Ej: 30"
                            className="w-28"
                            disabled={!!editingAula}
                        />
                    </div>
                    <Button type="submit" disabled={!!editingAula}>
                        <UserPlus className="mr-2 h-4 w-4"/>
                        Agregar Aula
                    </Button>
                </form>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg">Lista de Aulas</h3>
                        <p className="text-sm text-muted-foreground">
                            Aulas registradas actualmente en el sistema.
                        </p>
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
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><div className="flex items-center gap-2"><School/>Nombre</div></TableHead>
                                <TableHead><div className="flex items-center gap-2"><Hash/>ID</div></TableHead>
                                <TableHead><div className="flex items-center gap-2"><Users/>Capacidad</div></TableHead>
                                <TableHead className="text-right w-[120px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {aulasFiltradas.length > 0 ? (
                                aulasFiltradas.map(aula => (
                                    <TableRow key={aula.id}>
                                        <TableCell className="font-medium">{aula.nombre}</TableCell>
                                        <TableCell>{aula.id}</TableCell>
                                        <TableCell>{aula.capacidad} personas</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditAula(aula)} disabled={!!editingAula}>
                                                <Pencil className="h-4 w-4 text-muted-foreground hover:text-blue-600"/>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAula(aula.id)} disabled={!!editingAula}>
                                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No se encontraron aulas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={!!editingAula} onOpenChange={(isOpen) => !isOpen && setEditingAula(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Aula</DialogTitle>
                        <DialogDescription>
                            Modifique los datos del aula. El ID no se puede cambiar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-nombre-aula" className="text-right">Nombre</Label>
                            <Input id="edit-nombre-aula" name="nombre" value={editingAula?.nombre || ''} onChange={handleEditInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-capacidad-aula" className="text-right">Capacidad</Label>
                            <Input id="edit-capacidad-aula" name="capacidad" type="number" value={editingAula?.capacidad || ''} onChange={handleEditInputChange} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancelar</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleSaveAula}>Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
