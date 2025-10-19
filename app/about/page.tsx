import Image from "next/image"

import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Title } from "@/components/ui/title"
import { spacing } from "@/lib/design-system"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className={spacing.section}>
          <div className={spacing.containerNarrow}>
            <div className="relative overflow-hidden rounded-[3rem] border border-border bg-card/90 p-10 shadow-[0_45px_160px_-96px_var(--ring)] md:p-16">
              <div className="pointer-events-none absolute inset-0 -z-10">
                <div aria-hidden className="absolute -top-32 -right-16 h-72 w-72 rounded-full border border-brand-primary/40 opacity-60" />
                <div aria-hidden className="absolute -bottom-36 -left-24 h-80 w-80 rounded-full bg-brand-primary/12 blur-3xl" />
              </div>
              <div className="flex flex-col gap-10 md:flex-row md:items-start">
                <div className="mx-auto flex flex-col items-center gap-6 md:mx-0 md:items-start">
                  <div className="relative">
                    <div aria-hidden className="absolute -inset-8 rounded-full bg-brand-primary/18 blur-3xl" />
                    <div className="relative h-52 w-52 rounded-[2.75rem] border border-border/60 bg-background/85 p-4 shadow-lg md:h-64 md:w-64">
                      <Image
                        src="/maria.png"
                        alt="Maria Rosa Sirotti"
                        width={320}
                        height={320}
                        priority
                        className="h-full w-full rounded-[2rem] object-cover"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-6 text-center md:text-left">
                  <Title
                    as="h1"
                    align="left"
                    margin="none"
                    className="text-balance text-3xl font-semibold tracking-tight md:text-4xl"
                  >
                    Maria Rosa Sirotti
                  </Title>
                  <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">
                    Architetto e giornalista freelance
                  </p>
                  <p className="text-lg text-muted-foreground text-justify md:text-xl">
                    Architetto per formazione e storyteller per vocazione, racconto l'eccellenza italiana tra design,
                    artigianato, fragranze artistiche e viaggi sensoriali.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-16 space-y-10">
              <div className="relative overflow-hidden rounded-[2.5rem] border border-border/80 bg-background/75 p-8 shadow-[0_35px_120px_-100px_var(--ring)] md:p-12">
                <div aria-hidden className="absolute -top-24 -left-12 h-60 w-60 rounded-full bg-brand-primary/12 blur-3xl" />
                <div aria-hidden className="absolute -bottom-16 -right-20 h-64 w-64 rounded-full border border-brand-primary/30 opacity-40" />
                <div className="prose prose-lg max-w-none text-justify text-foreground prose-headings:font-sans prose-headings:text-left prose-a:text-brand-primary prose-strong:text-foreground prose-p:leading-relaxed prose-blockquote:border-l-brand-primary/60">
                  <p className="lead font-sans text-brand-primary">
                    Sono Maria Rosa Sirotti, architetto e giornalista free-lance. Dopo tredici anni di libera
                    professione ho iniziato a curare l'impaginazione e le illustrazioni di libri di storia e a scrivere
                    articoli di architettura per riviste cartacee di settore. Nel tempo ho ampliato il mio campo di
                    interesse: dal design all'arredamento, dall'alto artigianato alle fragranze artistiche di nicchia,
                    dall'arte ai viaggi e al mondo del food.
                  </p>
                  <br/>
                  <p>
                    Così è nata la mia passione per il giornalismo, che oggi è la mia professione. Sono iscritta
                    all'USGI, Unione Sammarinese Giornalisti e Fotoreporter, e sono membro della IFJ, International
                    Federation of Journalists. Collaboro con agenzie di PR e uffici stampa per la redazione di cartelle
                    stampa, interviste, sopralluoghi in aziende e la pubblicazione di articoli dedicati.
                  </p>
                  <blockquote>
                    <p>
                      Cose&amp;Case è il mio magazine online, nato per raccontare tutto ciò che incontro di bello e
                      interessante. L'ho chiamato così perché ogni casa è un mondo ricco di cose che amiamo e che ci
                      fanno stare bene; ogni persona è un microcosmo alla ricerca di ciò che rende la vita piacevole e
                      bella.
                    </p>
                  </blockquote>
                  <p>
                    La mia esperienza in campo architettonico è stata la base su cui ho costruito le prime sezioni di
                    argomenti, che continuano a crescere. Dopo l'esperienza come giornalista per Expo 2015 Milano, ho
                    ampliato la Food Experience, dedicandomi a eventi italiani e internazionali, alla scoperta dei
                    piccoli lussi dei prodotti artigianali del Made in Italy e alla costante divulgazione di altre
                    culture e cucine.
                  </p>
                  <p>
                    Il magazine è strutturato in sezioni tematiche che raccolgono tutti i miei campi d'interesse. Gli
                    articoli sono quasi sempre frutto di esperienze dirette: eventi, visite in luoghi e aziende,
                    conferenze, viaggi. Cose&amp;Case si identifica nel Luxury Style perché propone il massimo della
                    qualità: questo è il vero lusso, non legato al prezzo ma all'eccellenza.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-3xl border border-brand-primary/30 bg-brand-primary/10 p-6 text-brand-primary md:flex-row md:items-center md:justify-between md:p-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em]">Contatti</p>
                  <p className="mt-2 text-sm font-semibold md:text-base">
                    Parliamo di progetti, eventi o collaborazioni stampa.
                  </p>
                </div>
                <a
                  href="mailto:mariarosa.sirotti@gmail.com"
                  className="inline-flex items-center justify-center rounded-full border border-brand-primary bg-brand-primary px-5 py-3 text-sm font-semibold text-brand-primary-foreground shadow-sm transition hover:bg-brand-primary/90"
                >
                  mariarosa.sirotti@gmail.com
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export const metadata = {
  title: "Chi sono - cosecase.it",
  description:
    "Conosci Maria Rosa Sirotti, architetto e giornalista free-lance che racconta l'eccellenza italiana tra design, artigianato, fragranze e viaggi.",
}
