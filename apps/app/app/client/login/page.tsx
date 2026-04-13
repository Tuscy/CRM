import { ClientLoginForm } from "./login-form";

export default function ClientLoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const qError = searchParams?.error;
  const verifyError =
    qError === "invalid"
      ? "This sign-in link is invalid or has expired. Request a new one."
      : qError === "missing"
        ? "Sign-in link is missing. Use the link from your email."
        : null;

  return <ClientLoginForm verifyError={verifyError} />;
}
