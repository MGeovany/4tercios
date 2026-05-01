import Link from "next/link";
import { Image as ImageIcon, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GalleryPage({ params }: { params: { id: string } }) {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-border/40 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold">4Tercios</span>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href={`/evento/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </Button>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Galería</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted flex aspect-[4/3] items-center justify-center rounded-xl"
                >
                  <ImageIcon className="text-muted-foreground/40 h-6 w-6" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
