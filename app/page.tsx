import { Dashboard } from "@/components/dashboard"
import { AppHeader } from "@/components/app-header"

export default function HomePage() {
  return (
    <>
      <AppHeader title="Vistorias" subtitle="Gestão de vistorias técnicas" />
      <main>
        <Dashboard />
      </main>
    </>
  )
}
