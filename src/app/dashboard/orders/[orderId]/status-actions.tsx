"use client";

import * as React from "react";
import { CheckCircledIcon, DownloadIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import { setOrderStatusAction } from "./actions";
import type { OrderStatus } from "@/lib/db/types";

export function OrderStatusActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
  children?: React.ReactNode;
}) {
  const [pending, setPending] = React.useState<OrderStatus | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const setStatus = async (next: OrderStatus) => {
    setPending(next);
    setError(null);
    try {
      await setOrderStatusAction(orderId, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        className="w-full"
        disabled={status === "paid" || pending !== null}
        onClick={() => setStatus("paid")}
      >
        <CheckCircledIcon /> {pending === "paid" ? "Guardando..." : "Marcar como pagada"}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        disabled={status === "delivered" || pending !== null}
        onClick={() => setStatus("delivered")}
      >
        <DownloadIcon />{" "}
        {pending === "delivered" ? "Guardando..." : "Marcar como entregada"}
      </Button>
      {status !== "cancelled" ? (
        <Button
          variant="ghost"
          className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
          disabled={pending !== null}
          onClick={() => setStatus("cancelled")}
        >
          {pending === "cancelled" ? "Guardando..." : "Cancelar orden"}
        </Button>
      ) : null}
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
