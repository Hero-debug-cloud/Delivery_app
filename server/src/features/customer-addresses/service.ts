import { db } from "../../db/index.ts";
import { customerAddresses } from "../../db/schema.ts";
import { eq, and, desc } from "drizzle-orm";
import type { CreateAddressInput, UpdateAddressInput } from "./types.ts";

export async function getCustomerAddresses(customerId: string) {
  return await db
    .select()
    .from(customerAddresses)
    .where(eq(customerAddresses.customerId, customerId))
    .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt));
}

export async function getAddressById(customerId: string, addressId: string) {
  const [address] = await db
    .select()
    .from(customerAddresses)
    .where(
      and(
        eq(customerAddresses.id, addressId),
        eq(customerAddresses.customerId, customerId)
      )
    )
    .limit(1);
  return address || null;
}

export async function createAddress(customerId: string, input: CreateAddressInput) {
  return await db.transaction(async (tx) => {
    // If this is set to default, or if it's the first address, reset others
    let makeDefault = input.isDefault ?? false;

    const existing = await tx
      .select({ id: customerAddresses.id })
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId))
      .limit(1);

    if (existing.length === 0) {
      makeDefault = true;
    }

    if (makeDefault) {
      await tx
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.customerId, customerId));
    }

    const [address] = await tx
      .insert(customerAddresses)
      .values({
        customerId,
        label: input.label,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        isDefault: makeDefault,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
      })
      .returning();

    return address;
  });
}

export async function updateAddress(
  customerId: string,
  addressId: string,
  input: UpdateAddressInput
) {
  return await db.transaction(async (tx) => {
    // Verify address exists
    const [existing] = await tx
      .select()
      .from(customerAddresses)
      .where(
        and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.customerId, customerId)
        )
      )
      .limit(1);

    if (!existing) return null;

    if (input.isDefault === true) {
      // Clear others
      await tx
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.customerId, customerId));
    }

    const [updated] = await tx
      .update(customerAddresses)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(customerAddresses.id, addressId))
      .returning();

    return updated;
  });
}

export async function deleteAddress(customerId: string, addressId: string) {
  return await db.transaction(async (tx) => {
    // Verify address exists
    const [existing] = await tx
      .select()
      .from(customerAddresses)
      .where(
        and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.customerId, customerId)
        )
      )
      .limit(1);

    if (!existing) return false;

    // Delete it
    await tx.delete(customerAddresses).where(eq(customerAddresses.id, addressId));

    // If we deleted the default address, promote another one
    if (existing.isDefault) {
      const [nextDefault] = await tx
        .select()
        .from(customerAddresses)
        .where(eq(customerAddresses.customerId, customerId))
        .orderBy(desc(customerAddresses.createdAt))
        .limit(1);

      if (nextDefault) {
        await tx
          .update(customerAddresses)
          .set({ isDefault: true })
          .where(eq(customerAddresses.id, nextDefault.id));
      }
    }

    return true;
  });
}
