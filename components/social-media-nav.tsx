/**
 * Social Media Navigation Component
 * Implements Font Awesome 6.x icons with accessibility and security compliance
 * Supports dynamic Firestore integration with fallback to static configuration
 */

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Static fallback configuration for social media links
const FALLBACK_SOCIAL_LINKS = [
  {
    platform: "facebook",
    url: "https://facebook.com/voidfantasyleague",
    iconClass: "fab fa-facebook-f",
    displayOrder: 1,
    isActive: true
  },
  {
    platform: "instagram", 
    url: "https://instagram.com/voidfantasyleague",
    iconClass: "fab fa-instagram",
    displayOrder: 2,
    isActive: true
  },
  {
    platform: "tiktok",
    url: "https://tiktok.com/@voidfantasyleague", 
    iconClass: "fab fa-tiktok",
    displayOrder: 3,
    isActive: true
  },
  {
    platform: "linkedin",
    url: "https://linkedin.com/company/void-fantasy-league",
    iconClass: "fab fa-linkedin-in",
    displayOrder: 4,
    isActive: true
  },
  {
    platform: "youtube",
    url: "https://youtube.com/@voidfantasyleague",
    iconClass: "fab fa-youtube", 
    displayOrder: 5,
    isActive: true
  }
]

interface SocialMediaLink {
  platform: string
  url: string
  iconClass: string
  displayOrder: number
  isActive: boolean
  lastUpdated?: string
}

interface SocialMediaNavProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "horizontal" | "vertical"
  showLabels?: boolean
}

/**
 * Social Media Navigation Component
 * @param className - Additional CSS classes
 * @param size - Icon size variant (sm: 20px, md: 24px, lg: 28px)
 * @param variant - Layout orientation
 * @param showLabels - Whether to show platform labels
 */
export function SocialMediaNav({ 
  className, 
  size = "md", 
  variant = "horizontal",
  showLabels = false 
}: SocialMediaNavProps) {
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>(FALLBACK_SOCIAL_LINKS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // TODO: Implement Firestore real-time listener
  useEffect(() => {
    const loadSocialLinks = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Firestore integration placeholder
        // const unsubscribe = onSnapshot(
        //   collection(db, 'socialMediaLinks'),
        //   (snapshot) => {
        //     const links = snapshot.docs.map(doc => ({
        //       id: doc.id,
        //       ...doc.data()
        //     })) as SocialMediaLink[]
        //     setSocialLinks(links.filter(link => link.isActive).sort((a, b) => a.displayOrder - b.displayOrder))
        //   },
        //   (error) => {
        //     console.error('Error loading social links:', error)
        //     setError('Failed to load social media links')
        //     setSocialLinks(FALLBACK_SOCIAL_LINKS)
        //   }
        // )
        // return () => unsubscribe()
        
        // For now, use fallback data
        setSocialLinks(FALLBACK_SOCIAL_LINKS)
      } catch (err) {
        console.error('Error setting up social links listener:', err)
        setError('Failed to initialize social media links')
        setSocialLinks(FALLBACK_SOCIAL_LINKS)
      } finally {
        setLoading(false)
      }
    }

    loadSocialLinks()
  }, [])

  const getSizeClasses = () => {
    switch (size) {
      case "sm": return "w-5 h-5 text-sm"
      case "lg": return "w-7 h-7 text-lg" 
      default: return "w-6 h-6 text-base"
    }
  }

  const getAriaLabel = (platform: string) => {
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1)
    return `Visit our ${platformName} page (opens in new tab)`
  }

  if (loading) {
    return (
      <nav className={cn("flex", variant === "vertical" ? "flex-col" : "flex-row", className)}>
        {/* Loading skeleton */}
        {[...Array(5)].map((_, i) => (
          <div 
            key={i}
            className={cn(
              "animate-pulse bg-muted rounded-full",
              getSizeClasses(),
              variant === "horizontal" ? "mr-2 last:mr-0" : "mb-2 last:mb-0"
            )}
          />
        ))}
      </nav>
    )
  }

  if (error) {
    console.warn('Social media navigation error:', error)
    // Still render fallback links even on error
  }

  return (
    <nav 
      className={cn(
        "flex",
        variant === "vertical" ? "flex-col" : "flex-row items-center",
        className
      )}
      role="navigation"
      aria-label="Social media links"
    >
      <ul className={cn(
        "flex list-none m-0 p-0",
        variant === "vertical" ? "flex-col space-y-2" : "flex-row space-x-2"
      )}>
        {socialLinks.map((link) => (
          <li key={link.platform}>
            <Link
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={getAriaLabel(link.platform)}
              className={cn(
                "social-media-link inline-flex items-center justify-center",
                "text-muted-foreground hover:text-primary",
                "transition-all duration-300 ease-in-out",
                "hover:scale-110 hover:opacity-80",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                "rounded-full p-2",
                getSizeClasses()
              )}
            >
              <i 
                className={cn(link.iconClass, getSizeClasses())}
                aria-hidden="true"
              />
              {showLabels && (
                <span className="ml-2 text-sm font-medium capitalize">
                  {link.platform}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}