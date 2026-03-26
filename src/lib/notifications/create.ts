import { prisma } from "@/lib/db/prisma";
import type { NotificationType } from "./types";
import { Prisma } from "@prisma/client";
import { sendPushToUser, sendPushBulk } from "./push";

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

  // PWA 푸시 자동 발송 (DB 저장 후, fire-and-forget)
  sendPushToUser(input.userId, {
    title: input.title,
    body: input.content,
    url: input.actionUrl,
  }).catch(() => {});
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

  // PWA 푸시 벌크 발송
  const userIds = [...new Set(inputs.map((i) => i.userId))];
  sendPushBulk(userIds, {
    title: inputs[0].title,
    body: inputs[0].content,
    url: inputs[0].actionUrl,
  }).catch(() => {});
}
