import { signOut } from "@/auth";
import { Button } from "@stky/ui";

export function SignOutForm() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/dashboard/staff-login" });
      }}
    >
      <Button type="submit" variant="ghost" size="sm">
        Sign out
      </Button>
    </form>
  );
}
