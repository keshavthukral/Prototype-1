import { db, type SupportRequest } from '@/lib/db/database'

export async function createSupportRequest(patientId: string): Promise<SupportRequest> {
  const now = new Date()
  const request: SupportRequest = {
    id: crypto.randomUUID(), patientId, requestType: 'contact_me', priority: 'high',
    status: 'pending', requestedAt: now, createdAt: now, updatedAt: now, synced: false,
  }
  await db.transaction('rw', db.supportRequests, db.syncQueue, async () => {
    await db.supportRequests.put(request)
    await db.syncQueue.add({ operation: 'create', table: 'support_requests', recordId: request.id, data: request as unknown as Record<string, unknown>, timestamp: now, retryCount: 0 })
  })
  return request
}

export async function getSupportRequests(patientId: string): Promise<SupportRequest[]> {
  return db.supportRequests.where('patientId').equals(patientId).reverse().sortBy('requestedAt')
}
