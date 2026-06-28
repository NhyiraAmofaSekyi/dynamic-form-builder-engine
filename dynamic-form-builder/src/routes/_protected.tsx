import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import Layout from '#/components/layout.tsx'
import { isAuthenticated } from '#/lib/auth'

export const Route = createFileRoute('/_protected')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  // The read happens here, inside useEffect — which only runs in the browser,
  // never during SSR. That's why getToken/isAuthenticated don't need a guard:
  // they're never called server-side.
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: '/auth/sign-in' })
    }
  }, [navigate])

  return (

    <Layout>
      <Outlet />
    </Layout>
  )
}