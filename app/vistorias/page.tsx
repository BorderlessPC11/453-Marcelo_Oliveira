import { AppHeader } from "@/components/app-header"
import { InspectionList } from "@/components/inspection-list"
import { Button } from "@/components/ui/button"
import { ClipboardPlus } from "lucide-react"
import Link from "next/link"

export default function VistoriasPage() {
  return (
    <>
      <AppHeader
        title="Vistorias"
        subtitle="Todas as vistorias"
        showBack
        action={
          <Button asChild size="sm">
            <Link href="/vistorias/nova">
              <ClipboardPlus className="mr-1 h-4 w-4" />
              Nova
            </Link>
          </Button>
        }
      />
      <main>
        <InspectionList />
      </main>
    </>
  )
}
