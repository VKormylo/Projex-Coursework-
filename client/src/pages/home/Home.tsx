import { useAuthContext } from '~/context/authContext'
import Button from '~/components/button/Button'

export default function Home() {
  const { user, signOut } = useAuthContext()

  return (
    <div className="p-10">
      <div className="mx-auto max-w-lg rounded-xl border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-[#0f172b]">
          Вітаємо{user ? `, ${user.fullName}` : ''}!
        </h1>
        <p className="mt-2 text-sm text-[#717182]">
          Ви авторизовані в системі Projex. Цей екран — тимчасова заглушка для
          наступних етапів.
        </p>
        {user ? (
          <div className="mt-4 space-y-1 text-sm text-[#45556c]">
            <p>Email: {user.email}</p>
            <p>
              Ролі:{' '}
              {user.roles.length > 0
                ? user.roles.map((r) => r.name).join(', ')
                : '—'}
            </p>
          </div>
        ) : null}
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outlined" onClick={signOut}>
            Вийти
          </Button>
        </div>
      </div>
    </div>
  )
}
