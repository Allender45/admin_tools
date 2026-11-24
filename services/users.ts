// Деактивация прежнего владельца пропуска после подтверждённой перевыдачи.
//
// Сценарий: оператор выдаёт сотруднику пропуск, который ещё числится за
// другим (скорее всего, уже уволенным) человеком, и подтверждает перевыдачу.
// Тогда прежний владелец в admin_tools переводится в неактивные, пропуск
// с него снимается; учётка AD блокируется. Сбой AD операцию не отменяет —
// пропуск к этому моменту уже переведён, ошибку пишем в лог.

import prisma from '@/lib/db'
import { setAdUserEnabled } from './ad'

export interface DeactivatedOwner {
    id: number
    name: string // «Фамилия Имя»
}

export async function deactivatePreviousSkudOwner(
    cardCode: string,
    excludeUserId: number,
): Promise<DeactivatedOwner | null> {
    const old = await prisma.user.findFirst({
        where: {
            skudPass: { equals: cardCode, mode: 'insensitive' },
            id: { not: excludeUserId },
        },
    })
    if (!old) return null

    await prisma.user.update({
        where: { id: old.id },
        data: { isActive: false, skudPass: null },
    })

    if (old.adLogin) {
        try {
            await setAdUserEnabled(old.adLogin, false)
        } catch (e) {
            console.warn(`[users] прежний владелец деактивирован, но AD ${old.adLogin} заблокировать не удалось: ${(e as Error).message}`)
        }
    }

    return { id: old.id, name: `${old.lastName} ${old.firstName}` }
}
