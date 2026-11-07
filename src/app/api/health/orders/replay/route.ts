/**
 * Historical repair endpoint. Automatic replay is disabled: an existing order
 * does not prove that its credits were missing, so deleting it and granting
 * again could double-credit the customer. Use the read-only orders probe and
 * reconcile any pre-migration incident against the payment provider manually.
 */
import { NextResponse, connection } from "next/server";

export async function POST(req: Request) {
  await connection();

  const required = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const given = req.headers.get("x-probe-token")?.trim() ?? "";
  if (!required || given !== required) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.json(
    { ok: false, error: "automatic_replay_disabled", message: "Reconcile the transaction against the payment provider before adjusting credits." },
    { status: 409 }
  );
}
