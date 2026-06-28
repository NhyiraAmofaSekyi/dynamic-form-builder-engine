import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/responses/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protected/responses/"!</div>
}
