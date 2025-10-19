import { getAllPosts, getAllTags } from "./markdown"
import { cache } from "react"

export interface Article {
  id: string
  title: string
  excerpt: string
  content: string
  image: string
  date: string
  categories: string[]
}

// Fetch articles from GitHub-backed markdown at build time
const getArticlesFromRepo = cache(async (): Promise<Article[]> => {
  const posts = await getAllPosts()

  return posts.map((post) => ({
    id: post.slug,
    title: post.metadata.title,
    excerpt: post.metadata.excerpt,
    content: post.content,
    image: post.metadata.image || "/placeholder.svg",
    date: post.metadata.date,
    categories: post.metadata.tags,
  }))
})

const getCategoriesFromRepo = cache(async (): Promise<string[]> => {
  return await getAllTags()
})

// Export async functions for server components
export async function getArticles(): Promise<Article[]> {
  return await getArticlesFromRepo()
}

export async function getCategories(): Promise<string[]> {
  return await getCategoriesFromRepo()
}

// Fallback mock data for backwards compatibility (will be removed after testing)
const mockArticles: Article[] = [
  {
    id: "bagno-moderno-design",
    title: "Il Bagno Moderno: Tra Funzionalità e Design",
    excerpt: "Come trasformare il bagno in un'oasi di benessere con le ultime tendenze del design contemporaneo.",
    content: `<p>Il bagno moderno non è più solo uno spazio funzionale, ma un vero e proprio santuario del benessere. Le tendenze attuali privilegiano linee pulite, materiali naturali e tecnologie innovative.</p>
    <p>I rivestimenti in pietra naturale, i sanitari sospesi e l'illuminazione LED creano un'atmosfera rilassante e sofisticata. L'integrazione di elementi smart trasforma l'esperienza quotidiana in un momento di puro piacere.</p>`,
    image: "/modern-bathroom.png",
    date: "2024-01-15",
    categories: ["Bagno", "Design", "Interior"],
  },
  {
    id: "arte-contemporanea-firenze",
    title: "L'Arte Contemporanea a Firenze: Nuove Prospettive",
    excerpt:
      "Un viaggio attraverso le gallerie e gli spazi espositivi che stanno ridefinendo il panorama artistico fiorentino.",
    content: `<p>Firenze, culla del Rinascimento, si reinventa attraverso l'arte contemporanea. Nuovi spazi espositivi e gallerie innovative stanno trasformando il volto culturale della città.</p>
    <p>Dalla Manifattura Tabacchi al nuovo centro Pecci, l'arte contemporanea trova spazio accanto ai capolavori del passato, creando un dialogo unico tra tradizione e innovazione.</p>`,
    image: "/contemporary-art-gallery-florence.jpg",
    date: "2024-01-12",
    categories: ["Arte e Cultura", "Viaggi e Destinazioni"],
  },
  {
    id: "cucina-italiana-design",
    title: "La Cucina Italiana: Design e Tradizione",
    excerpt:
      "Come il design contemporaneo incontra la tradizione culinaria italiana nella progettazione degli spazi cucina.",
    content: `<p>La cucina italiana moderna è un perfetto equilibrio tra funzionalità e bellezza. I materiali naturali come il marmo di Carrara e il legno massello si sposano con elettrodomestici all'avanguardia.</p>
    <p>L'isola centrale diventa il cuore della casa, dove la famiglia si riunisce e la tradizione culinaria si tramanda di generazione in generazione.</p>`,
    image: "/italian-kitchen-design-modern.jpg",
    date: "2024-01-10",
    categories: ["Tavola e Cucina", "Design", "Interior"],
  },
  {
    id: "illuminazione-outdoor",
    title: "Illuminazione Outdoor: Creare Atmosfera nel Giardino",
    excerpt:
      "Le migliori soluzioni per illuminare gli spazi esterni e creare atmosfere suggestive durante le serate estive.",
    content: `<p>L'illuminazione outdoor trasforma completamente l'esperienza degli spazi esterni. Dalle luci soffuse che accarezzano le piante ai faretti che evidenziano elementi architettonici.</p>
    <p>La tecnologia LED permette di creare scenari luminosi personalizzati, rispettando l'ambiente e riducendo i consumi energetici.</p>`,
    image: "/outdoor-garden-lighting-evening.jpg",
    date: "2024-01-08",
    categories: ["Illuminazione", "Outdoor", "Design"],
  },
  {
    id: "profumi-nicchia-italiani",
    title: "Profumi di Nicchia: L'Eccellenza Italiana",
    excerpt:
      "Alla scoperta delle maison profumiere italiane che stanno conquistando il mondo con creazioni uniche e raffinate.",
    content: `<p>L'Italia vanta una tradizione profumiera di eccellenza, dalle storiche maison fiorentine alle nuove realtà creative che stanno ridefinendo l'arte della profumeria.</p>
    <p>Ingredienti pregiati, lavorazioni artigianali e creatività italiana si fondono per creare fragranze uniche che raccontano storie di bellezza e passione.</p>`,
    image: "/luxury-italian-perfume-bottles.jpg",
    date: "2024-01-05",
    categories: ["Beauty e Profumi", "Arte e Cultura"],
  },
  {
    id: "architettura-sostenibile",
    title: "Architettura Sostenibile: Il Futuro del Costruire",
    excerpt:
      "Come l'architettura contemporanea sta abbracciando la sostenibilità ambientale senza rinunciare alla bellezza.",
    content: `<p>L'architettura sostenibile rappresenta il futuro del costruire. Materiali eco-compatibili, tecnologie innovative e design bioclimatico si uniscono per creare edifici che rispettano l'ambiente.</p>
    <p>Dalle case passive agli edifici a energia positiva, l'architettura italiana sta guidando la transizione verso un futuro più sostenibile.</p>`,
    image: "/sustainable-architecture-green-building.jpg",
    date: "2024-01-03",
    categories: ["Architettura", "Design"],
  },
  {
    id: "hospitality-design-trends",
    title: "Hospitality Design: Tendenze 2024",
    excerpt:
      "Le nuove tendenze nel design dell'ospitalità che stanno trasformando hotel e ristoranti in esperienze memorabili.",
    content: `<p>Il design dell'ospitalità si evolve per creare esperienze sempre più coinvolgenti. Materiali naturali, tecnologie integrate e attenzione al benessere degli ospiti sono i pilastri delle nuove tendenze.</p>
    <p>Dall'hotel boutique al ristorante stellato, ogni spazio racconta una storia unica attraverso il design.</p>`,
    image: "/luxury-hotel-lobby-design.jpg",
    date: "2024-01-01",
    categories: ["Hospitality", "Design", "Interior"],
  },
  {
    id: "food-beverage-trends",
    title: "Food & Beverage: Innovazione e Tradizione",
    excerpt:
      "Come l'innovazione sta trasformando il mondo del food & beverage mantenendo salde le radici nella tradizione italiana.",
    content: `<p>Il settore food & beverage italiano vive una fase di grande fermento creativo. Chef stellati e giovani talenti sperimentano nuove tecniche mantenendo il rispetto per la tradizione.</p>
    <p>Dalla cucina molecolare ai cocktail artigianali, l'Italia continua a essere protagonista dell'innovazione gastronomica mondiale.</p>`,
    image: "/italian-fine-dining-restaurant.jpg",
    date: "2023-12-28",
    categories: ["Food & Beverage", "Arte e Cultura"],
  },
  {
    id: "hobby-creativi-italiani",
    title: "Hobby Creativi: La Rinascita dell'Artigianato",
    excerpt:
      "Come gli hobby creativi stanno vivendo una nuova primavera, riscoprendo tecniche artigianali tradizionali.",
    content: `<p>Gli hobby creativi stanno vivendo un momento di grande popolarità. Dalla ceramica al ricamo, dalle tecniche di tintura naturale alla lavorazione del legno, sempre più persone riscopre il piacere di creare con le proprie mani.</p>
    <p>Questa tendenza rappresenta un ritorno alle origini, una ricerca di autenticità in un mondo sempre più digitale.</p>`,
    image: "/italian-artisan-pottery-workshop.jpg",
    date: "2023-12-25",
    categories: ["Hobby", "Arte e Cultura"],
  },
]

const mockCategories = [
  "Architettura",
  "Arte e Cultura",
  "Bagno",
  "Beauty e Profumi",
  "Design",
  "Food & Beverage",
  "Hobby",
  "Hospitality",
  "Illuminazione",
  "Interior",
  "Outdoor",
  "Tavola e Cucina",
  "Viaggi e Destinazioni",
]

// Legacy exports (deprecated - use getArticles() and getCategories() instead)
export const articles = mockArticles
export const categories = mockCategories
