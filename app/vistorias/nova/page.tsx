import { AppHeader } from "@/components/app-header"
import { NewInspectionForm } from "@/components/new-inspection-form"

export default function NovaVistoriaPage() {
  return (
    <>
      <AppHeader title="Nova Vistoria" subtitle="Preencha os dados iniciais" showBack />
      <main>
        <NewInspectionForm />
      </main>
    </>
  )
}
