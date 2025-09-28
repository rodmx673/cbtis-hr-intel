
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Building, BookOpen, User, MapPin, Mail, Phone, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store/useDistribucionStore";
import type { InstitucionInfo, Nivel } from "@/store/useDistribucionStore";
import { useToast } from "@/hooks/use-toast";
import { NivelConfigurator } from "@/components/NivelConfigurator";
import { BotonDepurar } from "@/components/BotonDepurar";


export default function SettingsPage() {
    const { institucion, setInstitucion, niveles, handleNivelesSave } = useAppStore();
    const [isClient, setIsClient] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();

    const { control, handleSubmit, reset } = useForm<InstitucionInfo>({
        defaultValues: institucion,
    });

    useEffect(() => {
        setIsClient(true);
        reset(institucion);
    }, [institucion, reset, isClient]);

    const onSubmit = (data: InstitucionInfo) => {
        setInstitucion(data);
        toast({
            title: "✅ Configuración Guardada",
            description: "La información de la institución ha sido actualizada.",
        });
    };
    
    if (!isClient) {
        return (
            <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8 flex items-center justify-center">
                <p>Cargando configuración...</p>
            </main>
        );
    }

    return (
        <>
            <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <header className="flex items-center justify-between">
                        <Button variant="outline" asChild>
                            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio</Link>
                        </Button>
                        <div className="text-center">
                            <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">
                                Configuración de la Institución
                            </h1>
                            <p className="mt-2 text-lg text-muted-foreground">
                                Personalice los datos generales de su centro educativo.
                            </p>
                        </div>
                        <div className="w-40"></div>
                    </header>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Información General</CardTitle>
                                <CardDescription>Estos datos se utilizarán en los documentos generados y en la interfaz.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="nombre" className="flex items-center gap-2"><Building className="h-4 w-4"/> Nombre de la Institución</Label>
                                        <Controller
                                            name="nombre"
                                            control={control}
                                            render={({ field }) => <Input id="nombre" {...field} />}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cicloEscolar" className="flex items-center gap-2"><BookOpen className="h-4 w-4"/> Ciclo Escolar</Label>
                                        <Controller
                                            name="cicloEscolar"
                                            control={control}
                                            render={({ field }) => <Input id="cicloEscolar" {...field} placeholder="Ej: 2024-2025"/>}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="director" className="flex items-center gap-2"><User className="h-4 w-4"/> Nombre del Director(a)</Label>
                                    <Controller
                                        name="director"
                                        control={control}
                                        render={({ field }) => <Input id="director" {...field} />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="direccion" className="flex items-center gap-2"><MapPin className="h-4 w-4"/> Dirección</Label>
                                    <Controller
                                        name="direccion"
                                        control={control}
                                        render={({ field }) => <Input id="direccion" {...field} />}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-4 w-4"/> E-mail de Contacto</Label>
                                        <Controller
                                            name="email"
                                            control={control}
                                            render={({ field }) => <Input id="email" type="email" {...field} placeholder="ejemplo@institucion.com"/>}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="telefono" className="flex items-center gap-2"><Phone className="h-4 w-4"/> Teléfono</Label>
                                        <Controller
                                            name="telefono"
                                            control={control}
                                            render={({ field }) => <Input id="telefono" {...field} placeholder="Ej: 55 1234 5678"/>}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
                                    Configurar Niveles Educativos
                                </Button>
                                <Button type="submit" className="w-full sm:w-auto">Guardar Cambios</Button>
                            </CardFooter>
                        </Card>
                    </form>

                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5"/> Zona de Riesgo</CardTitle>
                            <CardDescription>
                                Las siguientes acciones son destructivas y pueden alterar permanentemente sus datos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <BotonDepurar />
                        </CardContent>
                    </Card>

                </div>
            </main>
            <NivelConfigurator 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                niveles={niveles}
                onSave={handleNivelesSave}
            />
        </>
    );
}
