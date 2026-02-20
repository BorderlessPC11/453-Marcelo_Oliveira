import { AppHeader } from "@/components/app-header"
import { InspectionHistory } from "@/components/inspection-history"

export async function generateStaticParams() {
  return []
}

export default async function HistoricoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <>
      <AppHeader title="Historico" subtitle="Atividades da vistoria" showBack />
      <main>
        <InspectionHistory id={id} />
      </main>
    </>
  )
}
