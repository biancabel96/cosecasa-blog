interface ArticleContentProps {
  content: string
}

export function ArticleContent({ content }: ArticleContentProps) {
  return (
    <div className="article-content" dangerouslySetInnerHTML={{ __html: content }} />
  )
}
