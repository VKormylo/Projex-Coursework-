import { LogoIcon } from '~/components/svg/Svg'

type Props = {
  title: string
  description: string
}

export default function AuthCardHeader({ title, description }: Props) {
  return (
    <header className="px-6 pt-6">
      <div className="flex justify-center">
        <div className="flex items-center gap-2">
          <LogoIcon />
          <span className="text-2xl font-bold leading-8 text-[#0f172b]">
            Projex
          </span>
        </div>
      </div>
      <h1 className="mt-[22px] text-center text-2xl font-medium leading-8 text-[#0a0a0a]">
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-[360px] text-center text-base font-normal leading-6 text-[#717182]">
        {description}
      </p>
    </header>
  )
}
