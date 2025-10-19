import { Title } from '@/components/ui/title'
import { spacing, typography } from '@/lib/design-system'
import { cn } from '@/lib/utils'

interface CategoryHeaderProps {
  title: string
  description: string
}

export function CategoryHeader({ title, description }: CategoryHeaderProps) {
  return (
    <section className={cn(spacing.section, 'bg-muted/30')}>
      <div className={cn(spacing.containerNarrow, 'text-center')}>
        <Title as="h1" align="center" margin="sm">
          {title}
        </Title>
        <p className={cn(typography.sectionSubtitle, 'mx-auto max-w-2xl text-balance')}>
          {description}
        </p>
      </div>
    </section>
  )
}
