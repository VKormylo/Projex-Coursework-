import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { authService } from "~/services/auth-service";
import { useAuthContext } from "~/context/authContext";
import { UserLoginSchema, type UserLogin } from "~/schemas/auth";
import { ResponseError } from "~/exceptions/response-error";

import AuthCardHeader from "~/components/auth-card-header/AuthCardHeader";
import AuthFooterLink from "~/components/auth-footer-link/AuthFooterLink";
import Button from "~/components/button/Button";
import Checkbox from "~/components/checkbox/Checkbox";
import FormInput from "~/components/form-input/FormInput";
import { LockIcon, MailIcon } from "~/components/svg/Svg";

export default function AuthLogin() {
  const navigate = useNavigate();
  const { signIn } = useAuthContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<UserLogin>({
    resolver: zodResolver(UserLoginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const {
    mutate: login,
    error,
    isPending,
  } = useMutation({
    mutationFn: (data: UserLogin) =>
      authService.login({ email: data.email, password: data.password }),
    onSuccess: (data) => {
      const rememberMe = getValues("rememberMe");
      signIn(data.token, data.userId, rememberMe);
      navigate("/", { replace: true });
    },
  });

  const serverMessage = error instanceof ResponseError ? error.message : null;

  return (
    <>
      <AuthCardHeader
        title="Вхід в систему"
        description="Введіть свої дані для входу в систему управління проєктами"
      />
      <form
        onSubmit={handleSubmit((values) => login(values))}
        className="flex flex-col gap-4 px-6 pb-6"
        noValidate
      >
        <div className="flex flex-col gap-4">
          <FormInput
            register={register}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="Електронна адреса"
            icon={<MailIcon />}
            error={errors.email}
          />
          <FormInput
            register={register}
            name="password"
            label="Пароль"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            icon={<LockIcon />}
            error={errors.password}
          />
          <div className="flex items-center justify-between gap-4">
            <Checkbox
              label="Запам'ятати мене"
              defaultChecked
              {...register("rememberMe")}
            />
          </div>
        </div>

        {serverMessage ? (
          <p
            className="text-center text-sm font-medium text-red-600"
            role="alert"
          >
            {serverMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-4 pt-1">
          <Button stretch disabled={isPending}>
            {isPending ? "Зачекайте…" : "Увійти"}
          </Button>
          <AuthFooterLink
            prefix="Ще не маєте акаунту?"
            linkText="Зареєструватися"
            to="/auth/signup"
          />
        </div>
      </form>
    </>
  );
}
