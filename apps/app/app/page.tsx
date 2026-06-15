import Link from "next/link";
import { AppBrand } from "@/components/app-brand";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <AppBrand showText={false} size="lg" className="mb-6" />
      <h1 className="text-3xl font-bold mb-4">StickySites CRM</h1>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Internal platform for StickySites staff and client reporting.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Open Dashboard
      </Link>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link
          href="/privacy-policy"
          className="underline-offset-4 hover:underline hover:text-foreground"
        >
          Privacy Policy
        </Link>
      </p>
    </main>
  );
}
