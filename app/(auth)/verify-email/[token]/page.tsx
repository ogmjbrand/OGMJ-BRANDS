export default function VerifyEmailPage({ params }: { params: { token: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Verify Email</h1>
        <p>Token: {params.token}</p>
      </div>
    </div>
  )
}
