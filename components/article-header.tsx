import { Title } from "@/components/ui/title"
import { spacing } from "@/lib/design-system"
import { cn } from "@/lib/utils"

interface ArticleHeaderProps {
  title: string
  image?: string
  category: string
}

export function ArticleHeader({ title, image }: ArticleHeaderProps) {
  return (
    <header className="relative">
      {image && (
        <div className="aspect-[21/9] md:aspect-[21/7] overflow-hidden">
          <img src={image || "/placeholder.svg"} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}
      <div className={cn(spacing.containerNarrow, 'px-4 py-8')}>
        <div className={image ? 'relative -mt-32 z-10' : ''}>
          <div className={cn(image && 'bg-background/95 backdrop-blur-sm rounded-lg p-8 shadow-lg')}>
            <Title as="h1" margin="sm" className="text-balance">
              {title}
            </Title>
          </div>
        </div>
      </div>
    </header>
  )
}
