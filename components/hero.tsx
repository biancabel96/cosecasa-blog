import { Title } from '@/components/ui/title'
import { spacing, typography } from '@/lib/design-system'
import { cn } from '@/lib/utils'

export function Hero() {
  return (
    <section className={spacing.sectionHero}>
      <div className={cn(spacing.containerNarrow, 'text-center')}>
        <Title as="h1" align="center" margin="md">
          Storie di bellezza,
          <span className="text-brand-primary"> cultura </span>
          e vita quotidiana
        </Title>
        <p className={cn(typography.sectionSubtitle, 'mx-auto max-w-2xl text-balance')}>
          Un diario personale dove condivido le mie passioni per l'arte, i viaggi, il design e tutto ciò che rende la
          vita più bella e significativa.
        </p>
      </div>
    </section>
  )
}
