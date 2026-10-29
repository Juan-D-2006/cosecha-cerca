import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { getI18n } from "@/i18n/server";

export default async function RegisterPage() {
  const { dict } = await getI18n();
  return (
    <AuthShell dict={dict}>
      <RegisterForm />
    </AuthShell>
  );
}
