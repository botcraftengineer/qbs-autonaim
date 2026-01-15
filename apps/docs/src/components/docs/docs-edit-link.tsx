import { ExternalLink } from "lucide-react"
import Link from "next/link"

interface DocsEditLinkProps {
  path: string
}

export function DocsEditLink({ path }: DocsEditLinkProps) {
  const githubUrl = `https://github.com/qbs-autonaim/docs/edit/main/${path}`

  return (
    <Link
      href={githubUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      Редактировать страницу
      <ExternalLink className="h-3 w-3" />
    </Link>
  )
}
