import { redirect } from 'next/navigation'

// Legacy route — consolidated into /login
export default function AuthLoginRedirect() {
  redirect('/login')
}
