export interface Highlight {
  id: number
  title: string
  description: string
  videoSrc: string
  youtubeUrl: string
}

export const highlightsData: Highlight[] = [
  {
    id: 1,
    title: "The Immaculate Reception 2.0",
    description: "Week 7: Steelers vs Raiders",
    videoSrc: "/videos/highlight-1.mp4",
    youtubeUrl: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID_1",
  },
  {
    id: 2,
    title: "Launches a 60-Yard Bomb",
    description: "Week 8: Chiefs vs Bills",
    videoSrc: "/videos/highlight-2.mp4",
    youtubeUrl: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID_2",
  },
  {
    id: 3,
    title: "Beast Mode Activated",
    description: "Week 8: 49ers vs Seahawks",
    videoSrc: "/videos/highlight-3.mp4",
    youtubeUrl: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID_3",
  },
]
