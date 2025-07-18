import type { SVGProps } from "react"

export function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12v6a2 2 0 0 0 2 2h4v-6a2 2 0 0 0-2-2h-2V9a2 2 0 0 1 2-2h2V4h-2a4 4 0 0 0-4 4v4z" />
      <path d="M15 4v2a2 2 0 0 0 2 2h2v3h-2a2 2 0 0 1-2-2V4z" />
    </svg>
  )
}
