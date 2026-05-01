import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ContactoPage() {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-border/40 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold">
            4Tercios
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Volver</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <header className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Contacto
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            Escríbenos para soporte, preguntas o alianzas.
          </p>
        </header>

        <div className="border-border/50 bg-card mx-auto mt-10 max-w-3xl rounded-xl border p-6 sm:p-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold">Email</h2>
              <p className="text-muted-foreground mt-2 text-sm">Responderemos lo antes posible.</p>
              <div className="mt-4">
                <Button asChild>
                  <a href="mailto:hola@4tercios.thefndrs.com">hola@4tercios.thefndrs.com</a>
                </Button>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold">Legal</h2>
              <p className="text-muted-foreground mt-2 text-sm">Políticas y documentos.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href="/terminos">Términos</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/privacidad">Privacidad</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
