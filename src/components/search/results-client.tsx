"use client";

import * as React from "react";
import Link from "next/link";
import { ChatBubbleIcon } from "@radix-ui/react-icons";

import { formatHnl } from "@/lib/local-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoCard } from "@/components/photo/photo-card";

export type ResultPhoto = {
  id: string;
  label: string;
  matchScore?: number;
};

export function ResultsClient({
  photos,
  pricePerPhotoHnl,
  whatsapp,
}: {
  photos: ResultPhoto[];
  pricePerPhotoHnl: number;
  whatsapp: string;
}) {
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  const selectedIds = React.useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected]
  );

  const total = selectedIds.length * pricePerPhotoHnl;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {photos.map((p) => (
          <PhotoCard
            key={p.id}
            id={p.id}
            label={p.label}
            matchScore={p.matchScore}
            selected={!!selected[p.id]}
            onToggle={() => setSelected((s) => ({ ...s, [p.id]: !s[p.id] }))}
          />
        ))}
      </div>

      <div className="h-fit lg:sticky lg:top-20">
        <Card>
          <CardHeader>
            <CardTitle>Tu seleccion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm text-zinc-700">Fotos seleccionadas</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
                {selectedIds.length}
              </p>
              <p className="mt-2 text-sm text-zinc-700">
                Estimado:{" "}
                <span className="font-medium text-zinc-950">{formatHnl(total)}</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Precio por foto: {formatHnl(pricePerPhotoHnl)}
              </p>
            </div>

            <div className="space-y-2">
              <Button className="w-full" disabled={selectedIds.length === 0}>
                Comprar seleccion
              </Button>
              <Button asChild variant="secondary" className="w-full">
                <Link
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `Hola, quiero estas fotos: ${selectedIds.join(", ")}.` +
                      ` Total estimado ${formatHnl(total)}.`
                  )}`}
                >
                  <ChatBubbleIcon /> Solicitar por WhatsApp
                </Link>
              </Button>
            </div>

            <p className="text-xs leading-5 text-zinc-500">
              Pagos y entrega digital se implementan en la siguiente iteracion.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
