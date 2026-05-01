"use server";

import { revalidatePath } from "next/cache";

import { requirePhotographer } from "@/lib/server/auth";
import { updateOrderStatus } from "@/lib/server/orders";
import type { OrderStatus } from "@/lib/db/types";

export async function setOrderStatusAction(orderId: string, status: OrderStatus) {
  await requirePhotographer();
  await updateOrderStatus(orderId, status);
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
}
