import ResetPasswordClient from "./ResetPasswordClient";

export const dynamic = "force-dynamic";

// searchParams in Next.js 15 is async — token extraction moved to the
// client component via useSearchParams() to avoid the async-prop pitfall.
export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
