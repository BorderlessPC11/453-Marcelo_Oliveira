import { AppHeader } from "@/components/app-header"
import { DocumentGeneration } from "@/components/document-generation"

export default async function DocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <>
      <AppHeader title="Documento" subtitle="Geracao e exportacao" showBack />
      <main>
        <DocumentGeneration id={id} />
      </main>
    </>
  )
}
