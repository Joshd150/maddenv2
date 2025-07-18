/**
 * Firestore Integration Service
 * Handles real-time data synchronization and CRUD operations
 */

import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  type Unsubscribe 
} from 'firebase/firestore'
import { db } from './firebase'
import { 
  type SocialMediaLink, 
  type RatingAdjustmentDocument,
  COLLECTIONS,
  validateSocialMediaLink,
  validateRatingAdjustment 
} from './firestore-schemas'

/**
 * Social Media Links Service
 */
export class SocialMediaService {
  private static unsubscribe: Unsubscribe | null = null

  /**
   * Subscribe to real-time social media links updates
   */
  static subscribeToLinks(
    callback: (links: SocialMediaLink[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(
      collection(db, COLLECTIONS.SOCIAL_MEDIA_LINKS),
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    )

    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const links: SocialMediaLink[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
        })) as SocialMediaLink[]
        
        callback(links)
      },
      (error) => {
        console.error('Error fetching social media links:', error)
        onError?.(error)
      }
    )

    return this.unsubscribe
  }

  /**
   * Add new social media link
   */
  static async addLink(link: Omit<SocialMediaLink, 'id' | 'lastUpdated'>): Promise<string> {
    const errors = validateSocialMediaLink(link)
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.SOCIAL_MEDIA_LINKS), {
      ...link,
      lastUpdated: Timestamp.now()
    })

    return docRef.id
  }

  /**
   * Update existing social media link
   */
  static async updateLink(id: string, updates: Partial<SocialMediaLink>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SOCIAL_MEDIA_LINKS, id)
    await updateDoc(docRef, {
      ...updates,
      lastUpdated: Timestamp.now()
    })
  }

  /**
   * Delete social media link
   */
  static async deleteLink(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SOCIAL_MEDIA_LINKS, id)
    await deleteDoc(docRef)
  }

  /**
   * Cleanup subscription
   */
  static cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
  }
}

/**
 * Rating Adjustments Service
 */
export class RatingAdjustmentsService {
  private static unsubscribe: Unsubscribe | null = null

  /**
   * Subscribe to real-time rating adjustments
   */
  static subscribeToAdjustments(
    leagueId: string,
    callback: (adjustments: RatingAdjustmentDocument[]) => void,
    onError?: (error: Error) => void,
    limitCount: number = 50
  ): Unsubscribe {
    const q = query(
      collection(db, COLLECTIONS.RATING_ADJUSTMENTS),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )

    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const adjustments: RatingAdjustmentDocument[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        })) as RatingAdjustmentDocument[]
        
        callback(adjustments)
      },
      (error) => {
        console.error('Error fetching rating adjustments:', error)
        onError?.(error)
      }
    )

    return this.unsubscribe
  }

  /**
   * Add new rating adjustment
   */
  static async addAdjustment(
    adjustment: Omit<RatingAdjustmentDocument, 'id' | 'timestamp'>
  ): Promise<string> {
    const errors = validateRatingAdjustment(adjustment)
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.RATING_ADJUSTMENTS), {
      ...adjustment,
      timestamp: Timestamp.now()
    })

    return docRef.id
  }

  /**
   * Group adjustments by player and time window
   */
  static groupAdjustmentsByTime(
    adjustments: RatingAdjustmentDocument[],
    timeWindowMs: number = 5 * 60 * 1000 // 5 minutes
  ): RatingAdjustmentDocument[] {
    const grouped = new Map<string, RatingAdjustmentDocument[]>()
    
    // Sort by timestamp
    const sorted = [...adjustments].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    )
    
    for (const adjustment of sorted) {
      const playerKey = `${adjustment.playerId}-${adjustment.author}`
      
      if (!grouped.has(playerKey)) {
        grouped.set(playerKey, [])
      }
      
      const playerAdjustments = grouped.get(playerKey)!
      const lastAdjustment = playerAdjustments[playerAdjustments.length - 1]
      
      // If within time window, merge adjustments
      if (lastAdjustment && 
          adjustment.timestamp.getTime() - lastAdjustment.timestamp.getTime() <= timeWindowMs) {
        lastAdjustment.adjustments.push(...adjustment.adjustments)
        lastAdjustment.timestamp = adjustment.timestamp
        if (adjustment.reason) {
          lastAdjustment.reason = lastAdjustment.reason 
            ? `${lastAdjustment.reason}; ${adjustment.reason}`
            : adjustment.reason
        }
      } else {
        playerAdjustments.push(adjustment)
      }
    }
    
    return Array.from(grouped.values()).flat()
  }

  /**
   * Cleanup subscription
   */
  static cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
  }
}

/**
 * Error handling utilities
 */
export class FirestoreErrorHandler {
  static handleError(error: any, context: string): string {
    console.error(`Firestore error in ${context}:`, error)
    
    if (error.code === 'permission-denied') {
      return 'You do not have permission to perform this action.'
    }
    
    if (error.code === 'unavailable') {
      return 'Service is temporarily unavailable. Please try again later.'
    }
    
    if (error.code === 'not-found') {
      return 'The requested data was not found.'
    }
    
    return 'An unexpected error occurred. Please try again.'
  }
}

/**
 * Performance monitoring
 */
export class FirestorePerformance {
  private static metrics = new Map<string, number>()

  static startTimer(operation: string): void {
    this.metrics.set(operation, Date.now())
  }

  static endTimer(operation: string): number {
    const start = this.metrics.get(operation)
    if (!start) return 0
    
    const duration = Date.now() - start
    this.metrics.delete(operation)
    
    console.log(`Firestore ${operation} took ${duration}ms`)
    return duration
  }
}