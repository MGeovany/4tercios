"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Image as ImageIcon,
  MapPin,
  Search,
  Shield,
  Sparkles,
  Upload,
} from "lucide-react";

// Mock event data
const eventData = {
  id: "1",
  name: "Carrera 10K San Pedro Sula",
  date: "15 de Abril, 2026",
  city: "San Pedro Sula",
  type: "Carrera",
  photographer: "Carlos Mejía - Fotos Mejía",
  totalPhotos: 847,
  description:
    "Revive los mejores momentos de la Carrera 10K San Pedro Sula. Encuentra tus fotos usando tu selfie.",
};

export default function PublicEventPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setSelfieUploaded(true);
  }, []);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      window.location.href = "/evento/1/resultados";
    }, 2000);
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border/40 bg-background/80 border-b backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold">4Tercios</span>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Event Info */}
        <div className="mb-12 text-center">
          <div className="bg-muted mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4" />
            <span>Búsqueda por selfie</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {eventData.name}
          </h1>
          <div className="text-muted-foreground mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {eventData.date}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {eventData.city}
            </span>
            <span className="flex items-center gap-1">
              <ImageIcon className="h-4 w-4" />
              {eventData.totalPhotos} fotos
            </span>
          </div>
          <p className="text-muted-foreground mx-auto mt-4 max-w-lg">
            {eventData.description}
          </p>
        </div>

        {/* Selfie Upload Card */}
        <Card className="border-border/50 mb-8 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                Encuentra tus fotos con una selfie
              </h2>
              <p className="text-muted-foreground mt-2">
                Sube una selfie y te mostraremos las fotos sugeridas del evento
              </p>
            </div>

            {/* Upload Area */}
            <div
              className={`mt-8 rounded-xl border-2 border-dashed transition-all ${
                isDragging
                  ? "border-foreground bg-muted"
                  : selfieUploaded
                    ? "border-green-500 bg-green-50"
                    : "border-border/50 hover:border-border"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center p-8 text-center">
                {selfieUploaded ? (
                  <>
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                      <div className="bg-muted h-16 w-16 rounded-full" />
                    </div>
                    <p className="font-medium text-green-700">
                      Selfie cargada correctamente
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Haz clic en buscar para encontrar tus fotos
                    </p>
                  </>
                ) : (
                  <>
                    <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                      <Upload className="text-muted-foreground h-8 w-8" />
                    </div>
                    <p className="font-medium">Arrastra tu selfie aquí</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      o haz clic para seleccionar
                    </p>
                    <Button variant="outline" className="mt-4">
                      Seleccionar foto
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Search Button */}
            <Button
              className="mt-6 w-full"
              size="lg"
              disabled={!selfieUploaded || isSearching}
              onClick={handleSearch}
            >
              {isSearching ? (
                <>
                  <span className="border-background mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  Buscando tus fotos...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Buscar mis fotos
                </>
              )}
            </Button>

            {/* Browse Gallery Link */}
            <div className="mt-4 text-center">
              <Button variant="link" asChild>
                <Link href={`/evento/${eventData.id}/galeria`}>
                  O explorar toda la galería
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="flex items-start gap-4 p-6">
            <div className="bg-background flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
              <Shield className="text-muted-foreground h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Tu privacidad es importante</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Tu selfie se usa únicamente para buscar coincidencias y se elimina
                inmediatamente después. No almacenamos datos biométricos ni compartimos tu
                información con terceros.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
