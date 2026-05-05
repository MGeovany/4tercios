import { LockClosedIcon } from "@radix-ui/react-icons";

export function PrivacyNote() {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <span className="mt-0.5 text-zinc-500" aria-hidden>
        <LockClosedIcon />
      </span>
      <div>
        <p className="text-sm font-medium text-zinc-900">Privacidad primero</p>
        <p className="mt-1 text-sm leading-6 text-zinc-700">
          Tu selfie se usa solo para encontrar coincidencias. No se publica en la galeria.
          Puedes borrar tu busqueda cuando quieras.
        </p>
      </div>
    </div>
  );
}
