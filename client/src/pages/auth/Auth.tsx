import { Outlet } from 'react-router-dom'

import AuthCard from '~/components/auth-card/AuthCard'
import AuthLayout from '~/components/auth-layout/AuthLayout'

export default function Auth() {
  return (
    <AuthLayout>
      <AuthCard>
        <Outlet />
      </AuthCard>
    </AuthLayout>
  )
}
