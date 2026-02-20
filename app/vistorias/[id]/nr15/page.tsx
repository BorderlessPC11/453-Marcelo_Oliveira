import { AppHeader } from "@/components/app-header"
import { NR15Assessment } from "@/components/nr15-assessment"

export async function generateStaticParams() {
  return []
}

export default async function NR15Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <>
      <AppHeader
        title="Avaliacao NR-15"
        subtitle="Insalubridade"
        showBack
      />
      <main>
        <NR15Assessment id={id} />
      </main>
    </>
  )
}
