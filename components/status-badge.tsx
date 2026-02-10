import type { InspectionStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const statusConfig: Record<InspectionStatus, { label: string; className: string }> = {
  rascunho: {
    label: "Rascunho",
    className: "bg-muted text-muted-foreground",
  },
  em_andamento: {
    label: "Em andamento",
    className: "bg-primary/15 text-primary",
  },
  concluida: {
    label: "Concluída",
    className: "bg-accent/15 text-accent",
  },
}

export function StatusBadge({ status }: { status: InspectionStatus }) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
