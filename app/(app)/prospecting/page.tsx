import { PageHeader } from "@/components/layout/page-header"
import { ProspectingForm } from "./prospecting-client"

export default function ProspectingPage() {
  return (
    <div>
      <PageHeader
        title="Prospecção"
        description="Buscar empresas no Google Maps e importar como leads"
      />
      <ProspectingForm />
    </div>
  )
}
