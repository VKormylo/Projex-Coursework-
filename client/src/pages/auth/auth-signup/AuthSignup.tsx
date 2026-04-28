import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { authService } from "~/services/auth-service";
import { useAuthContext } from "~/context/authContext";
import { UserSignupSchema, type UserSignup } from "~/schemas/auth";
import { ResponseError } from "~/exceptions/response-error";
import type { AppRole } from "~/types/auth.types";

import AuthCardHeader from "~/components/auth-card-header/AuthCardHeader";
import AuthFooterLink from "~/components/auth-footer-link/AuthFooterLink";
import Button from "~/components/button/Button";
import FormInput from "~/components/form-input/FormInput";
import RadioGroup from "~/components/radio-group/RadioGroup";
import { LockIcon, MailIcon, UserIcon } from "~/components/svg/Svg";

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "Project Manager", label: "Project Manager" },
  { value: "Developer", label: "Developer" },
];

export default function AuthSignup() {
  const navigate = useNavigate();
  const { signIn } = useAuthContext();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserSignup>({
    resolver: zodResolver(UserSignupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "Developer",
    },
  });

  const {
    mutate: signup,
    error,
    isPending,
  } = useMutation({
    mutationFn: authService.signup,
    onSuccess: (data) => {
      signIn(data.token, data.userId, false);
      navigate("/", { replace: true });
    },
  });

  const serverMessage = error instanceof ResponseError ? error.message : null;

  return (
    <>
      <AuthCardHeader
        title="Реєстрація"
        description="Створіть обліковий запис для початку роботи"
      />
      <form
        onSubmit={handleSubmit((values) => signup(values))}
        className="flex flex-col gap-4 px-6 pb-6"
        noValidate
      >
        <div className="flex flex-col gap-4">
          <FormInput
            register={register}
            name="fullName"
            label={"Повне ім'я"}
            autoComplete="name"
            placeholder="Іван Петренко"
            icon={<UserIcon />}
            error={errors.fullName}
          />
          <FormInput
            register={register}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="your.email@company.com"
            icon={<MailIcon />}
            error={errors.email}
          />
          <FormInput
            register={register}
            name="password"
            label="Пароль"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            icon={<LockIcon />}
            error={errors.password}
          />
          <FormInput
            register={register}
            name="confirmPassword"
            label="Підтвердити пароль"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            icon={<LockIcon />}
            error={errors.confirmPassword}
          />
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <RadioGroup
                name={field.name}
                legend="Роль"
                options={ROLE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.role?.message}
              />
            )}
          />
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
            {isPending ? "Зачекайте…" : "Зареєструватися"}
          </Button>
          <AuthFooterLink
            prefix="Вже маєте акаунт?"
            linkText="Увійти"
            to="/auth/login"
          />
        </div>
      </form>
    </>
  );
}
