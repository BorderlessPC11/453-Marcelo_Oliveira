import { AppHeader } from "@/components/app-header"
import { InspectionDetail } from "@/components/inspection-detail"

export async function generateStaticParams() {
  return []
}

export default async function VistoriaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <>
      <AppHeader title="Detalhes da Vistoria" showBack />
      <main>
        <InspectionDetail id={id} />
      </main>
    </>
  )
}
