import { createFileRoute } from '@tanstack/react-router'
import { CrmPage } from '@/components/CrmPage'

export const Route = createFileRoute('/_authenticated/crm')({
  component: CrmPage,
})
