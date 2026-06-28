import { createFileRoute } from '@tanstack/react-router'

import {Builder} from "#/components/create-form.tsx";


export const Route = createFileRoute('/test/create')({
  component: Builder,
})
