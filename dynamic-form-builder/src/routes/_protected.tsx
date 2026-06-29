import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import Layout from '#/components/layout.tsx'
import { isAuthenticated } from '#/lib/auth'

export const Route = createFileRoute('/_protected')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

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