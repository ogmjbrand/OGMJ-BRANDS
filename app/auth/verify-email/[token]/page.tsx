import { redirect } from 'next/navigation'

interface AuthVerifyEmailRedirectProps {
  params: { token: string }
}

export default function AuthVerifyEmailRedirect({ params }: AuthVerifyEmailRedirectProps) {
  redirect(`/verify-email/${params.token}`)
}
