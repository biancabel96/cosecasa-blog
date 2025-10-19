export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-border bg-muted/20 py-6 px-4 mt-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="sm:text-left">© {year} cosecase.it. Tutti i diritti riservati.</p>
        <a
          href="https://theinkedengineer.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground transition hover:text-brand-primary sm:text-right"
        >
          Made by TheInkedEngineer
        </a>
      </div>
    </footer>
  )
}
