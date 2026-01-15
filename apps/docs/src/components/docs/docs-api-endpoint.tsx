import { Badge } from "@/components/ui/badge"
import { DocsCode } from "./docs-code"
import { cn } from "@/lib/utils"

interface ApiEndpointProps {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "tRPC Query" | "tRPC Mutation"
  path: string
  description?: string
  params?: Array<{
    name: string
    type: string
    required?: boolean
    description: string
  }>
  response?: string
  responseLanguage?: string
}

const methodColors = {
  GET: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  POST: "bg-green-500/10 text-green-500 border-green-500/20",
  PUT: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
  PATCH: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "tRPC Query": "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  "tRPC Mutation": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
}

export function DocsApiEndpoint({
  method,
  path,
  description,
  params,
  response,
  responseLanguage = "json",
}: ApiEndpointProps) {
  return (
    <div className="my-6 overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-3">
        <Badge className={cn("font-mono font-semibold", methodColors[method])}>{method}</Badge>
        <code className="text-sm font-mono text-foreground">{path}</code>
      </div>

      {description && (
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}

      {params && params.length > 0 && (
        <div className="border-b border-border">
          <div className="bg-muted/30 px-4 py-2">
            <h4 className="text-sm font-semibold text-foreground">Параметры</h4>
          </div>
          <div className="divide-y divide-border">
            {params.map((param, index) => (
              <div key={index} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono text-foreground">{param.name}</code>
                  <Badge variant="outline" className="text-xs">
                    {param.type}
                  </Badge>
                  {param.required && (
                    <Badge variant="destructive" className="text-xs">
                      обязательный
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{param.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {response && (
        <div>
          <div className="bg-muted/30 px-4 py-2">
            <h4 className="text-sm font-semibold text-foreground">Пример ответа</h4>
          </div>
          <div className="p-4">
            <DocsCode code={response} language={responseLanguage} />
          </div>
        </div>
      )}
    </div>
  )
}
