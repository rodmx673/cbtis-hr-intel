
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PlusCircle } from 'lucide-react';
import type { Nivel } from '@/app/page';
import { nanoid } from 'nanoid';

interface NivelConfiguratorProps {
  isOpen: boolean;
  onClose: () => void;
  niveles: Nivel[];
  onSave: (niveles: Nivel[]) => void;
}

export const NivelConfigurator = ({ isOpen, onClose, niveles: initialNiveles, onSave }: NivelConfiguratorProps) => {
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  
  useEffect(() => {
    // Deep copy to avoid modifying the original state directly
    setNiveles(JSON.parse(JSON.stringify(initialNiveles)));
    setIsDirty(false);
  }, [isOpen, initialNiveles]);

  const handleUpdate = (id: string, field: keyof Nivel, value: string) => {
    setNiveles(currentNiveles => 
      currentNiveles.map(n => n.id === id ? { ...n, [field]: value } : n)
    );
    setIsDirty(true);
  };

  const handleAddNivel = () => {
    setNiveles([...niveles, { id: nanoid(), tipo: 'Grado', nombre: '' }]);
    setIsDirty(true);
  };

  const handleDeleteNivel = (id: string) => {
    setNiveles(niveles.filter(n => n.id !== id));
    setIsDirty(true);
  };

  const handleSaveChanges = () => {
    // Optional: Add validation here to prevent empty names
    onSave(niveles.filter(n => n.nombre.trim() !== ''));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Configuración de Niveles</DialogTitle>
          <DialogDescription>
            Agregue, edite o elimine los niveles educativos de su institución.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {niveles.map((nivel) => (
            <div key={nivel.id} className="flex items-end gap-2">
              <div className="grid gap-1.5 flex-grow">
                <Label htmlFor={`nombre-${nivel.id}`}>Nombre del Nivel</Label>
                <Input
                  id={`nombre-${nivel.id}`}
                  value={nivel.nombre}
                  onChange={(e) => handleUpdate(nivel.id, 'nombre', e.target.value)}
                  placeholder="Ej: 1° Grado, 3er Semestre"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`tipo-${nivel.id}`}>Tipo</Label>
                <Select
                  value={nivel.tipo}
                  onValueChange={(value: 'Grado' | 'Semestre') => handleUpdate(nivel.id, 'tipo', value)}
                >
                  <SelectTrigger id={`tipo-${nivel.id}`} className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grado">Grado</SelectItem>
                    <SelectItem value="Semestre">Semestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleDeleteNivel(nivel.id)}
                aria-label="Eliminar nivel"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
           <Button onClick={handleAddNivel} variant="outline" className="mt-4 border-dashed border-2">
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Nivel
          </Button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSaveChanges} disabled={!isDirty}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
