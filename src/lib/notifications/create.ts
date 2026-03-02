import { prisma } from "@/lib/db/prisma";
import type { NotificationType } from "./types";
import { Prisma } from "@prisma/client";

interface CreateNotificationInput {
  userId: bigint;
  notificationType: NotificationType;
  title: string;
  content?: string;
  actionUrl?: string;
  actionType?: string;
  metadata?: Prisma.InputJsonValue;
  notifiableType?: string;
  notifiableId?: bigint;
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  await prisma.notifications.create({
    data: {
      user_id: input.userId,
      notification_type: input.notificationType,
      title: input.title,
      content: input.content,
      action_url: input.actionUrl,
      action_type: input.actionType,
      metadata: input.metadata ?? Prisma.JsonNull,
      notifiable_type: input.notifiableType,
      notifiable_id: input.notifiableId,
      status: "unread",
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function createNotificationBulk(
  inputs: CreateNotificationInput[]
): Promise<void> {
  if (inputs.length === 0) return;
  await prisma.notifications.createMany({
    data: inputs.map((input) => ({
      user_id: input.userId,
      notification_type: input.notificationType,
      title: input.title,
      content: input.content,
      action_url: input.actionUrl,
      action_type: input.actionType,
      metadata: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      notifiable_type: input.notifiableType,
      notifiable_id: input.notifiableId,
      status: "unread",
      created_at: new Date(),
      updated_at: new Date(),
    })),
    skipDuplicates: true,
  });
}
