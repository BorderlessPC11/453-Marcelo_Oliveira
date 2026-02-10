import { Dashboard } from "@/components/dashboard"
import { AppHeader } from "@/components/app-header"

export default function HomePage() {
  return (
    <>
      <AppHeader title="Vistorias" subtitle="Gestao de vistorias tecnicas" />
      <main>
        <Dashboard />
      </main>
    </>
  )
}
