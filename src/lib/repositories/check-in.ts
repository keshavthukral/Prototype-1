import { db, type ReportedEnergy, type ReportedMood, type WellBeingCheckIn } from '@/lib/db/database'

export interface SaveCheckInInput {
  patientId: string
  reportedMood: ReportedMood
  reportedEnergy: ReportedEnergy
  requestedContact: boolean
}

function localDate(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export async function saveWellBeingCheckIn(input: SaveCheckInInput): Promise<WellBeingCheckIn> {
  const now = new Date()
  const checkIn: WellBeingCheckIn = {
    id: crypto.randomUUID(),
    patientId: input.patientId,
    reportedAt: now,
    reportedMood: input.reportedMood,
    reportedEnergy: input.reportedEnergy,
    requestedContact: input.requestedContact,
    createdAt: now,
    synced: false,
  }

  await db.transaction('rw', db.wellBeingCheckIns, db.dailyReports, db.syncQueue, async () => {
    await db.wellBeingCheckIns.put(checkIn)
    await db.syncQueue.add({
      operation: 'create', table: 'well_being_check_ins', recordId: checkIn.id,
      data: checkIn as unknown as Record<string, unknown>, timestamp: now, retryCount: 0,
    })

    const reportDate = localDate(now)
    const existing = await db.dailyReports.where('[patientId+reportDate]').equals([input.patientId, reportDate]).first()
    const report = {
      id: existing?.id ?? crypto.randomUUID(), patientId: input.patientId, reportDate,
      remindersCompleted: existing?.remindersCompleted ?? 0,
      remindersPostponed: existing?.remindersPostponed ?? 0,
      remindersTotal: existing?.remindersTotal ?? 0,
      dailyCheckInCompleted: true, sourceUpdatedAt: now,
      createdAt: existing?.createdAt ?? now, updatedAt: now, synced: false,
    }
    await db.dailyReports.put(report)
    await db.syncQueue.add({
      operation: existing ? 'update' : 'create', table: 'daily_reports', recordId: report.id,
      data: report as unknown as Record<string, unknown>, timestamp: now, retryCount: 0,
    })
  })

  return checkIn
}

export async function getWellBeingCheckIns(patientId: string): Promise<WellBeingCheckIn[]> {
  return db.wellBeingCheckIns.where('patientId').equals(patientId).reverse().sortBy('reportedAt')
}

export async function getLatestCheckIn(patientId: string): Promise<WellBeingCheckIn | undefined> {
  const records = await getWellBeingCheckIns(patientId)
  return records[0]
}
