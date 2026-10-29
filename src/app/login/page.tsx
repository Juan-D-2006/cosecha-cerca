import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { getI18n } from "@/i18n/server";

export default async function LoginPage() {
  const { dict } = await getI18n();
  return (
    <AuthShell dict={dict}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
