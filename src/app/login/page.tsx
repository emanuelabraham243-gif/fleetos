import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            FleetOS
          </span>
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Access your fleet command center.
          </p>
        </div>
        <LoginForm next={next && next.startsWith("/") ? next : "/"} />
      </div>
    </div>
  );
}
