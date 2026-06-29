import { Link } from '@tanstack/react-router'
import { ClipboardX } from 'lucide-react'
import { Button } from 'antd'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-lagoon-400/10">
        <ClipboardX className="h-8 w-8 text-lagoon-500" strokeWidth={1.5} />
      </div>

      <h1 className="text-2xl font-bold text-sea-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-sea-ink/60">
        The page you're looking for doesn't exist or may have been moved.
      </p>

      <Link to="/forms" className="mt-6">
        <Button type="primary">Back to forms</Button>
      </Link>
    </div>
  )
}