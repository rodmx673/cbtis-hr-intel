
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useDistribucionStore";
import { Trash2 } from "lucide-react";

export function BotonDepurar() {
  const { toast } = useToast();
  const depurarDatosStore = useAppStore(state => state.depurarDatos);

  const handleDepurar = () => {
    try {
        const { nombresCorregidos, duplicadosEncontrados } = depurarDatosStore();
        toast({
            title: "✅ Depuración Completada",
            description: `Se corrigieron ${nombresCorregidos} nombres y se eliminaron ${duplicadosEncontrados} asignaturas duplicadas.`,
        });

    } catch (error) {
         toast({
            title: "❌ Error al Depurar",
            description: "No se pudieron depurar los datos. Revise la consola para más detalles.",
            variant: "destructive"
        });
        console.error("Error al depurar datos:", error);
    }
  };

  return (
      <Button variant="outline" size="sm" onClick={handleDepurar} className="text-muted-foreground border-dashed">
        <Trash2 className="mr-2 h-4 w-4"/> Depurar y Limpiar Datos de Carga Horaria
      </Button>
  );
}

    