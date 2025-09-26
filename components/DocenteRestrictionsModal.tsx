
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { useAppStore } from '@/store/useDistribucionStore';
import type { Docente } from '@/lib/types';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';

interface DocenteRestrictionsModalProps {
  docente: Docente;
  isOpen: boolean;
  onClose: () => void;
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HORAS = [
  '07:00-07:50', '07:50-08:40', '08:40-09:30', 
  '10:00-10:50', '10:50-11:40', '11:40-12:30', '12:30-13:20'
];

export const DocenteRestrictionsModal: FC<DocenteRestrictionsModalProps> = ({ docente, isOpen, onClose }) => {
  const { restricciones, setRestricciones } = useAppStore();
  const [bloquesNoDisponibles, setBloquesNoDisponibles] = useState<string[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      const currentRestricciones = restricciones[docente.id]?.noDisponibles || [];
      setBloquesNoDisponibles(currentRestricciones);
    }
  }, [isOpen, docente, restricciones]);

  const handleDayToggle = (dia: string, isChecked: boolean) => {
    const horasDelDia = HORAS.map(hora => `${dia}_${hora}`);
    setBloquesNoDisponibles(prev => {
      const otrosBloques = prev.filter(b => !b.startsWith(dia));
      return isChecked ? [...otrosBloques, ...horasDelDia] : otrosBloques;
    });
  };

  const handleBlockToggle = (dia: string, hora: string, isChecked: boolean) => {
    const bloqueId = `${dia}_${hora}`;
    setBloquesNoDisponibles(prev => 
      isChecked ? [...prev, bloqueId] : prev.filter(b => b !== bloqueId)
    );
  };
  
  const handleSave = () => {
    setRestricciones(docente.id, bloquesNoDisponibles);
    onClose();
  };

  const isDayFullyBlocked = (dia: string) => {
    return HORAS.every(hora => bloquesNoDisponibles.includes(`${dia}_${hora}`));
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Restricciones Horarias para {docente.nombre}</DialogTitle>
          <div className={cn("text-sm text-muted-foreground")}>
            Marque los días o bloques de horas en los que el docente <Badge variant="outline">{docente.id}</Badge> no está disponible.
          </div>
        </DialogHeader>

        <div className="py-4">
            <h4 className="font-semibold mb-3">Bloquear Días Completos</h4>
            <div className="flex items-center space-x-6">
                {DIAS.map(dia => (
                    <div key={dia} className="flex items-center space-x-2">
                        <Checkbox
                            id={`check-day-${dia}`}
                            checked={isDayFullyBlocked(dia)}
                            onCheckedChange={(checked) => handleDayToggle(dia, !!checked)}
                        />
                        <Label htmlFor={`check-day-${dia}`}>{dia}</Label>
                    </div>
                ))}
            </div>
        </div>

        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[150px]">Hora</TableHead>
                        {DIAS.map(dia => (
                            <TableHead key={dia} className="text-center">{dia}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {HORAS.map(hora => (
                        <TableRow key={hora}>
                            <TableCell className="font-semibold text-sm">{hora}</TableCell>
                            {DIAS.map(dia => (
                                <TableCell key={`${dia}-${hora}`} className="text-center">
                                    <Checkbox
                                        checked={bloquesNoDisponibles.includes(`${dia}_${hora}`)}
                                        onCheckedChange={(checked) => handleBlockToggle(dia, hora, !!checked)}
                                    />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        <DialogFooter>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Restricciones</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
