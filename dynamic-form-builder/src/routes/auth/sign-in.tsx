import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Button, Form, Input, message } from 'antd'
import {signIn} from "#/services/sign-in.ts";
import {ApiError} from "#/lib/axios.ts";

export const Route = createFileRoute('/auth/sign-in')({
  component: SignInPage,
})

interface SignInValues {
  email: string
  password: string
}

function SignInPage() {
  const navigate = useNavigate()

  const signInMutation = useMutation({
    mutationFn: signIn,
    onSuccess: () => navigate({ to: '/forms' }),
    onError: (err) =>
      message.error(err instanceof ApiError ? err.message : 'Something went wrong.'),
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">Sign in</h1>
        <p className="mb-6 text-sm text-gray-500">Welcome back. Enter your details.</p>

        <Form
          layout="vertical"
          onFinish={(values: SignInValues) => signInMutation.mutate(values)}
          disabled={signInMutation.isPending}
          requiredMark={false}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input autoComplete="email" placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password autoComplete="current-password" placeholder="••••••••" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={signInMutation.isPending}
            className="mt-2"
          >
            Sign in
          </Button>
        </Form>
      </div>
    </div>
  )
}