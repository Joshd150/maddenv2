// lib/events_db.ts
// Minimal placeholder for EventDB to satisfy imports in madden-firestore-db.ts
export type SnallabotEvent<Event> = { key: string; event_type: string } & Event
export type StoredEvent<Event> = SnallabotEvent<Event> & { timestamp: string; id: string } // Changed Date to string
export type EventNotifier<Event> = (events: SnallabotEvent<Event>[]) => Promise<void>

export const notifiers: { [key: string]: EventNotifier<any>[] } = {}

const EventDB = {
  appendEvents: async (events: any[], delivery: any) => {
    /* no-op */
  },
  queryEvents: async (key: string, event_type: string, after: Date, filters: any, limit: number) => {
    return [] as any[]
  },
  on: (event_type: string, notifier: any) => {
    /* no-op */
  },
}

export default EventDB
