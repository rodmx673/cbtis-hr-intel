
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, PlusCircle, Book, Clock, Wrench, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from 'nanoid';
import { cn } from '@/lib/utils';


type Column = {
  key: string;
  header: string;
};

type EditableTableProps = {
  data: Record<string, any>[];
  setData: (data: Record<string, any>[]) => void;
  columns: Column[];
  newRowTemplate: Record<string, any>;
  showFooter?: boolean;
  horasObjetivo?: number;
  isEditable?: boolean;
};

const columnIcons: { [key: string]: React.ReactNode } = {
  asignatura: <Book className="h-4 w-4 text-muted-foreground" />,
  horas: <Clock className="h-4 w-4 text-muted-foreground" />,
  especialidad: <Wrench className="h-4 w-4 text-muted-foreground" />,
};

export const EditableTable: FC<EditableTableProps> = ({ 
  data, 
  setData, 
  columns, 
  newRowTemplate, 
  showFooter = false, 
  horasObjetivo = 0,
  isEditable = false 
}) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleUpdate = (id: string, key: string, value: any) => {
    const newData = data.map(row => {
      if (row.id === id) {
        return { ...row, [key]: value };
      }
      return row;
    });
    
    setData(newData);
  };

  const handleAddRow = () => {
    setData([...data, { ...newRowTemplate, id: nanoid() }]);
  };

  const handleDeleteRow = (id: string) => {
    const newData = data.filter((row) => row.id !== id);
    setData(newData);
  };
  
  const totalHoras = useMemo(() => {
    return data.reduce((total, row) => total + (Number(row.horas) || 0), 0);
  }, [data]);

  const cumpleObjetivo = totalHoras === horasObjetivo;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !isEditable) return;
    const items = Array.from(data);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setData(items);
  };
  
  const renderCell = (row: Record<string, any>, col: Column) => {
    const value = row[col.key];

    if (col.key === 'especialidad') {
      return (
        <div className="flex items-center justify-center">
            <Checkbox
              checked={!!value}
              onCheckedChange={(checked) => handleUpdate(row.id, col.key, checked)}
              disabled={!isEditable}
            />
        </div>
      );
    }
    
    return (
      <Input
        value={value || ""}
        onChange={(e) => handleUpdate(row.id, col.key, e.target.value)}
        className="bg-background focus:bg-white transition-colors"
        type={col.key === 'horas' ? 'number' : 'text'}
        min={col.key === 'horas' ? 0 : undefined}
        disabled={!isEditable}
      />
    );
  }
  
  const hasEmptyRow = useMemo(() => {
    if (data.length === 0) return false;
    const lastRow = data[data.length - 1];
    return !lastRow.asignatura || (typeof lastRow.asignatura === 'string' && lastRow.asignatura.trim() === '');
  }, [data]);

  const renderTableContent = () => {
     if (!isClient) {
        return (
            <TableBody>
                <TableRow>
                    <TableCell colSpan={columns.length + 2} className="h-24 text-center">
                        Cargando...
                    </TableCell>
                </TableRow>
            </TableBody>
        );
     }
     
     return (
        <DragDropContext onDragEnd={onDragEnd}>
              <Droppable 
                droppableId="tabla-asignaturas" 
                isDropDisabled={!isEditable}
                isCombineEnabled={false}
                ignoreContainerClipping={false}
              >
                {(provided) => (
                    <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                      {data.length > 0 ? (
                        data.map((row, index) => (
                          <Draggable key={row.id} draggableId={row.id.toString()} index={index} isDragDisabled={!isEditable}>
                            {(provided, snapshot) => (
                              <TableRow 
                                ref={provided.innerRef} 
                                {...provided.draggableProps}
                                className={cn(snapshot.isDragging && "table-row-dragging")}
                              >
                                <TableCell {...provided.dragHandleProps} className={isEditable ? "cursor-grab" : "cursor-not-allowed"}>
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </TableCell>
                                {columns.map((col) => (
                                  <TableCell key={col.key}>
                                    {renderCell(row, col)}
                                  </TableCell>
                                ))}
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteRow(row.id)}
                                    aria-label="Eliminar fila"
                                    disabled={!isEditable}
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length + 2} className="h-24 text-center text-muted-foreground">
                            No hay datos. Agregue una fila para comenzar.
                          </TableCell>
                        </TableRow>
                      )}
                      {provided.placeholder}
                    </TableBody>
                )}
              </Droppable>
        </DragDropContext>
     );
  }


  return (
      <div className="w-full">
        <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40px]"></TableHead>
                  {columns.map((col) => (
                    <TableHead key={col.key} className="font-semibold capitalize">
                      <div className="flex items-center gap-2">
                        {columnIcons[col.key]}
                        {col.header}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-right w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              {renderTableContent()}
              {showFooter && (
                <TableFooter>
                    <TableRow className="hover:bg-transparent">
                        <TableCell/>
                        <TableCell colSpan={1} className="font-bold text-right">
                            Total:
                        </TableCell>
                        <TableCell className="font-bold">
                            <div className="flex items-center gap-2">
                              <span>{totalHoras} / {horasObjetivo} hrs</span>
                              <div
                                className={cn(
                                  "h-3 w-3 rounded-full transition-colors",
                                  cumpleObjetivo ? 'bg-green-500' : 'bg-yellow-400'
                                )}
                                title={cumpleObjetivo ? 'Carga horaria completa' : 'Carga horaria incompleta o excedida'}
                              />
                            </div>
                        </TableCell>
                        <TableCell colSpan={2}/>
                    </TableRow>
                </TableFooter>
              )}
            </Table>
        </div>
        <div className="mt-4 flex justify-start">
          <Button onClick={handleAddRow} variant="outline" className="border-dashed border-2" disabled={hasEmptyRow || !isEditable}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Asignatura
          </Button>
        </div>
      </div>
  );
};
