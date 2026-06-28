import { createFileRoute } from '@tanstack/react-router'

import {Builder} from "#/components/builder.tsx";


export const Route = createFileRoute('/test/create')({
  component: Builder,
})
