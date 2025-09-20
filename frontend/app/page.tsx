import { GradientBars } from "@/components/ui/gradient-bars"
import AnimatedAIChat from "@/components/mvpblocks/animated-ai-chat"

export default function Home() {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <GradientBars />

      <div className="relative z-10">
        <AnimatedAIChat />
      </div>
    </div>
  )
}
