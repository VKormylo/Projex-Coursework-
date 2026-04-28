import { Link } from 'react-router-dom'

type Props = {
  prefix: string
  linkText: string
  to: string
}

export default function AuthFooterLink({ prefix, linkText, to }: Props) {
  return (
    <p className="text-center text-sm leading-5 text-[#45556c]">
      {prefix}{' '}
      <Link
        to={to}
        className="font-medium text-[#155dfc] hover:underline focus:underline focus:outline-none"
      >
        {linkText}
      </Link>
    </p>
  )
}
