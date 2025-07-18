/**
 * Firestore Data Schemas and Validation Rules
 * Comprehensive type definitions for all collections
 */

// Social Media Links Collection Schema
export interface SocialMediaLink {
  id?: string
  platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'youtube' | 'discord'
  url: string
  isActive: boolean
  iconClass: string
  displayOrder: number
  lastUpdated: Date
  createdBy?: string
  updatedBy?: string
}

// Rating Adjustments Collection Schema
export interface RatingAdjustmentDocument {
  id?: string
  playerId: number
  playerName: string
  teamId: number
  adjustments: RatingChange[]
  author: string // 'AUTO' for automatic adjustments, or user ID/name
  reason?: string
  timestamp: Date
  seasonIndex: number
  weekIndex: number
  gameId?: number
  adjustmentType: 'manual' | 'automatic' | 'performance' | 'injury'
  isGrouped?: boolean // If this adjustment was grouped with others
  groupId?: string // ID for grouped adjustments
}

export interface RatingChange {
  attribute: string
  oldValue: number
  newValue: number
  change: number
  category: 'physical' | 'mental' | 'skill' | 'overall'
}

// Firestore Validation Rules (for Firebase Console)
export const FIRESTORE_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Social Media Links - Admin only
    match /socialMediaLinks/{linkId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Rating Adjustments - Read for all, write for admins and AUTO system
    match /ratingAdjustments/{adjustmentId} {
      allow read: if true;
      allow create, update: if request.auth != null && 
        (request.auth.token.admin == true || 
         resource.data.author == 'AUTO');
      allow delete: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // League Data - Read only for most users
    match /league_data/{leagueId}/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
`

// Firestore Collection References
export const COLLECTIONS = {
  SOCIAL_MEDIA_LINKS: 'socialMediaLinks',
  RATING_ADJUSTMENTS: 'ratingAdjustments',
  LEAGUE_DATA: 'league_data',
  LEAGUE_SETTINGS: 'league_settings'
} as const

// Default Social Media Configuration
export const DEFAULT_SOCIAL_LINKS: Omit<SocialMediaLink, 'id' | 'lastUpdated'>[] = [
  {
    platform: 'facebook',
    url: 'https://facebook.com/voidfantasyleague',
    iconClass: 'fab fa-facebook-f',
    displayOrder: 1,
    isActive: true
  },
  {
    platform: 'instagram',
    url: 'https://instagram.com/voidfantasyleague', 
    iconClass: 'fab fa-instagram',
    displayOrder: 2,
    isActive: true
  },
  {
    platform: 'tiktok',
    url: 'https://tiktok.com/@voidfantasyleague',
    iconClass: 'fab fa-tiktok',
    displayOrder: 3,
    isActive: true
  },
  {
    platform: 'linkedin',
    url: 'https://linkedin.com/company/void-fantasy-league',
    iconClass: 'fab fa-linkedin-in',
    displayOrder: 4,
    isActive: true
  },
  {
    platform: 'youtube',
    url: 'https://youtube.com/@voidfantasyleague',
    iconClass: 'fab fa-youtube',
    displayOrder: 5,
    isActive: true
  }
]

// Validation Functions
export function validateSocialMediaLink(link: Partial<SocialMediaLink>): string[] {
  const errors: string[] = []
  
  if (!link.platform) errors.push('Platform is required')
  if (!link.url) errors.push('URL is required')
  if (!link.iconClass) errors.push('Icon class is required')
  if (typeof link.displayOrder !== 'number') errors.push('Display order must be a number')
  if (typeof link.isActive !== 'boolean') errors.push('isActive must be a boolean')
  
  // URL validation
  if (link.url && !isValidUrl(link.url)) {
    errors.push('Invalid URL format')
  }
  
  return errors
}

export function validateRatingAdjustment(adjustment: Partial<RatingAdjustmentDocument>): string[] {
  const errors: string[] = []
  
  if (!adjustment.playerId) errors.push('Player ID is required')
  if (!adjustment.playerName) errors.push('Player name is required')
  if (!adjustment.author) errors.push('Author is required')
  if (!adjustment.adjustments || adjustment.adjustments.length === 0) {
    errors.push('At least one rating adjustment is required')
  }
  
  // Validate each rating change
  adjustment.adjustments?.forEach((change, index) => {
    if (!change.attribute) errors.push(`Adjustment ${index + 1}: Attribute is required`)
    if (typeof change.oldValue !== 'number') errors.push(`Adjustment ${index + 1}: Old value must be a number`)
    if (typeof change.newValue !== 'number') errors.push(`Adjustment ${index + 1}: New value must be a number`)
    if (change.newValue < 0 || change.newValue > 100) {
      errors.push(`Adjustment ${index + 1}: New value must be between 0 and 100`)
    }
  })
  
  return errors
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}