"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Image as ImageIcon,
  MessageCircle,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock search results
const searchResults = [
  { id: "1", confidence: 98, selected: false },
  { id: "2", confidence: 95, selected: false },
  { id: "3", confidence: 92, selected: false },
  { id: "4", confidence: 89, selected: false },
  { id: "5", confidence: 85, selected: false },
  { id: "6", confidence: 82, selected: false },
  { id: "7", confidence: 78, selected: false },
  { id: "8", confidence: 75, selected: false },
  { id: "9", confidence: 72, selected: false },
  { id: "10", confidence: 68, selected: false },
  { id: "11", confidence: 65, selected: false },
  { id: "12", confidence: 62, selected: false },
];

const eventData = {
  id: "1",
  name: "Carrera 10K San Pedro Sula",
  pricePerPhoto: 3.0,
  photographer: "Carlos Mejía",
  whatsapp: "+504 9999-9999",
};

export default function SearchResultsPage() {
  const [photos, setPhotos] = useState(searchResults);

  const selectedPhotos = photos.filter((p) => p.selected);
  const totalPrice = selectedPhotos.length * eventData.pricePerPhoto;

  const togglePhoto = (id: string) => {
    setPhotos(photos.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)));
  };

  const selectAll = () => {
    setPhotos(photos.map((p) => ({ ...p, selected: true })));
  };

  const clearSelection = () => {
    setPhotos(photos.map((p) => ({ ...p, selected: false })));
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return (
        <Badge className="bg-green-100 text-green-700">{confidence}% coincidencia</Badge>
      );
    } else if (confidence >= 75) {
      return (
        <Badge className="bg-amber-100 text-amber-700">{confidence}% coincidencia</Badge>
      );
    }
    return <Badge variant="secondary">{confidence}% posible</Badge>;
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border/40 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold">4Tercios</span>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Back & Title */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link href={`/evento/${eventData.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al evento
            </Link>
          </Button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Tus fotos encontradas
              </h1>
              <p className="text-muted-foreground mt-1">
                {eventData.name} • {photos.length} fotos coinciden con tu selfie
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Seleccionar todas
              </Button>
              {selectedPhotos.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Limpiar selección
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Photo Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                    photo.selected
                      ? "border-foreground ring-foreground ring-2 ring-offset-2"
                      : "hover:border-border border-transparent"
                  }`}
                  onClick={() => togglePhoto(photo.id)}
                >
                  {/* Photo placeholder with watermark */}
                  <div className="bg-muted relative aspect-[4/3]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="text-muted-foreground/30 h-8 w-8" />
                    </div>
                    {/* Watermark overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-muted-foreground/10 rotate-[-30deg] text-3xl font-bold">
                        4TERCIOS
                      </div>
                    </div>
                    {/* Selection checkbox */}
                    <div className="absolute top-2 left-2">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${
                          photo.selected
                            ? "border-foreground bg-foreground"
                            : "border-white/80 bg-black/20"
                        }`}
                      >
                        {photo.selected && <Check className="text-background h-4 w-4" />}
                      </div>
                    </div>
                    {/* Confidence badge */}
                    <div className="absolute right-2 bottom-2">
                      {getConfidenceBadge(photo.confidence)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info notice */}
            <div className="border-border/50 bg-muted/30 mt-6 flex items-start gap-3 rounded-lg border p-4">
              <Sparkles className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="text-muted-foreground text-sm">
                <p className="text-foreground font-medium">
                  Resultados ordenados por coincidencia
                </p>
                <p className="mt-1">
                  Las fotos con mayor porcentaje tienen más probabilidad de ser tuyas.
                  Revisa todas las opciones antes de comprar.
                </p>
              </div>
            </div>
          </div>

          {/* Cart/Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingCart className="h-5 w-5" />
                    Tu selección
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedPhotos.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center">
                      <ImageIcon className="text-muted-foreground/30 mx-auto mb-2 h-12 w-12" />
                      <p className="text-sm">Selecciona las fotos que deseas comprar</p>
                    </div>
                  ) : (
                    <>
                      {/* Selected photos summary */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Fotos seleccionadas
                          </span>
                          <span className="font-medium">{selectedPhotos.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Precio por foto</span>
                          <span className="font-medium">
                            ${eventData.pricePerPhoto.toFixed(2)}
                          </span>
                        </div>
                        <div className="border-border border-t pt-3">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Total</span>
                            <span className="text-xl font-semibold">
                              ${totalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-3">
                        <Button className="w-full" size="lg">
                          Solicitar compra
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                          <a
                            href={`https://wa.me/${eventData.whatsapp.replace(/[^0-9]/g, "")}?text=Hola! Me gustaría comprar ${selectedPhotos.length} fotos del evento ${eventData.name}. Total: $${totalPrice.toFixed(2)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Contactar por WhatsApp
                          </a>
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Photographer info */}
                  <div className="border-border border-t pt-4 text-center">
                    <p className="text-muted-foreground text-xs">
                      Fotos por{" "}
                      <span className="text-foreground font-medium">
                        {eventData.photographer}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
