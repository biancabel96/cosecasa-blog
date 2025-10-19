export const typography = {
  display: "font-serif text-5xl md:text-7xl font-bold leading-tight text-balance",
  hero: "font-sans text-4xl md:text-6xl font-semibold leading-tight text-balance",
  sectionTitle: "font-sans text-3xl md:text-4xl font-semibold leading-tight",
  sectionSubtitle: "text-lg md:text-l text-muted-foreground leading-relaxed",
  cardTitle: "font-sans text-xl font-semibold leading-snug",
  subheading: "font-sans text-lg font-medium leading-snug",
  eyebrow: "uppercase tracking-[0.28em] text-xs text-muted-foreground/80",
  body: "text-base leading-relaxed text-foreground",
  bodyMuted: "text-base leading-relaxed text-muted-foreground",
  small: "text-sm text-muted-foreground",
}

export const spacing = {
  container: "container mx-auto px-4",
  containerNarrow: "container mx-auto px-4 max-w-4xl",
  containerWide: "container mx-auto px-4 max-w-6xl",
  section: "py-16 px-4",
  sectionHero: "py-20 px-4",
  stackLg: "space-y-12",
  stackMd: "space-y-8",
  stackSm: "space-y-4",
}

export const surfaces = {
  card: "bg-card text-card-foreground border border-border rounded-xl shadow-sm",
  cardInteractive: "hover:shadow-lg transition-shadow duration-300",
  cardMuted: "bg-muted/30",
  frosted: "bg-background/95 backdrop-blur-md border border-border/60 shadow-lg",
}

export const radii = {
  base: "rounded-xl",
  large: "rounded-2xl",
  pill: "rounded-full",
}

export const effects = {
  transition: "transition-all duration-300",
  hoverRaise: "hover:-translate-y-1",
  hoverGlow: "hover:shadow-lg",
}
