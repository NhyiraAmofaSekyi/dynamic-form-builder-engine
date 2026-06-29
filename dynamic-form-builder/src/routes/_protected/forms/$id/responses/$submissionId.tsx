import { createFileRoute, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Spin, Alert } from 'antd'
import {getSubmission, getVersion} from "#/services/form.ts";
import {SubmittedForm} from "#/components/submitted-form.tsx";

export const Route = createFileRoute(
  '/_protected/forms/$id/responses/$submissionId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id, submissionId } = useParams({ from: Route.id })

  // 1) the submission — gives us the answers + the pinned formVersionId
  const submission = useQuery({
    queryKey: ['submission', id, submissionId],
    queryFn: () => getSubmission(id, submissionId),
  })

  // 2) the version it was made against (NOT the current version)
  const versionId = submission.data?.formVersionId
  const version = useQuery({
    queryKey: ['version', id, versionId],
    enabled: !!versionId,
    queryFn: () => getVersion(id, versionId!),
  })

  if (submission.isLoading || version.isLoading) return <Spin />
  if (submission.error || version.error)
    return <Alert type="error" title="Could not load this response" showIcon />
  if (!submission.data || !version.data) return null

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <SubmittedForm
        version={version.data}
        answers={submission.data.data}
      />
    </div>
  )
}