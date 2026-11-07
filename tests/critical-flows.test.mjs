import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");

function loadTs(file, mocks) {
  const source = readFileSync(path.join(root, file), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const compiledModule = { exports: {} };
  const requireMock = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    return nativeRequire(name);
  };
  new Function("require", "module", "exports", code)(requireMock, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

const nextServer = {
  NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) },
};

test("free run is reserved before the provider call and a second request is rejected", async () => {
  let freeRuns = 0;
  let providerCalls = 0;
  const db = {
    from: () => ({
      select: () => ({
        eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "voice-1", provider_voice_id: "provider-1", status: "active" }, error: null }) }) }),
      }),
    }),
  };
  const billing = {
    cacheKey: () => "hash",
    findCachedJob: async () => null,
    getPlanInfo: async () => null,
    isPaidPlan: () => false,
    checkAndReserveFree: async () => {
      if (freeRuns) throw new billing.QuotaError("free_used", "Already used");
      freeRuns++;
    },
    recordGeneration: async () => {},
    QuotaError: class QuotaError extends Error {
      constructor(reason, message) { super(message); this.reason = reason; }
    },
  };
  const { POST } = loadTs("src/app/api/tts/route.ts", {
    "next/server": nextServer,
    "@/lib/identity": { resolveIdentity: async () => ({ userId: "anon:123", authed: false }) },
    "@/lib/supabase": { getSupabaseAdmin: () => db },
    "@/lib/elevenlabs": {
      maxCharsPerRequest: () => 10000,
      synthesize: async () => { assert.equal(freeRuns, 1); providerCalls++; return Buffer.from("audio"); },
    },
    "@/lib/storage": { audioKey: () => "audio.mp3", putAudio: async () => "https://cdn.example/audio.mp3" },
    "@/lib/billing": billing,
    "@/lib/emails": { sendFreeGenerationDone: async () => {} },
  });
  const request = () => new Request("http://localhost/api/tts", { method: "POST", body: JSON.stringify({ voiceId: "voice-1", text: "hello" }) });
  const [first, second] = await Promise.all([POST(request()), POST(request())]);
  assert.deepEqual([first.status, second.status].sort(), [200, 402]);
  assert.equal(providerCalls, 1);
});

test("free quota wrapper rejects a second reservation and overlong text", async () => {
  let reservations = 0;
  const billing = loadTs("src/lib/billing.ts", {
    "./supabase": { getSupabaseAdmin: () => ({ rpc: async (name, args) => {
      assert.equal(name, "reserve_free_generation");
      assert.equal(args.p_user_id, "anon:123");
      return { data: reservations++ === 0, error: null };
    } }) },
    "./constants": { FREE_CHARS: 150 },
  });
  const identity = { userId: "anon:123", authed: false };
  await billing.checkAndReserveFree(identity, "hello");
  await assert.rejects(billing.checkAndReserveFree(identity, "again"), (error) => error.reason === "free_used");
  await assert.rejects(billing.checkAndReserveFree(identity, "x".repeat(151)), (error) => error.reason === "chars_exceeded");
  assert.equal(reservations, 2);
});

test("provider failure restores a prepaid balance", async () => {
  let reserved = false;
  let restored = false;
  const db = {
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "voice-1", provider_voice_id: "provider-1", status: "active" }, error: null }) }) }) }) }),
  };
  const { POST } = loadTs("src/app/api/tts/route.ts", {
    "next/server": nextServer,
    "@/lib/identity": { resolveIdentity: async () => ({ userId: "00000000-0000-0000-0000-000000000001", authed: true }) },
    "@/lib/supabase": { getSupabaseAdmin: () => db },
    "@/lib/elevenlabs": { maxCharsPerRequest: () => 10000, synthesize: async () => { assert.ok(reserved); throw new Error("provider down"); } },
    "@/lib/storage": { audioKey: () => "audio.mp3", putAudio: async () => { throw new Error("unexpected upload"); } },
    "@/lib/billing": {
      cacheKey: () => "hash", findCachedJob: async () => null,
      getPlanInfo: async () => ({ plan: "starter", creditsLeft: 100 }), isPaidPlan: () => true,
      chargeCredits: async () => { reserved = true; return 95; },
      restoreCredits: async () => { restored = true; },
      recordGeneration: async () => { throw new Error("unexpected audit"); },
      QuotaError: class QuotaError extends Error {},
    },
    "@/lib/emails": { sendFreeGenerationDone: async () => {} },
  });
  const response = await POST(new Request("http://localhost/api/tts", { method: "POST", body: JSON.stringify({ voiceId: "voice-1", text: "hello" }) }));
  assert.equal(response.status, 500);
  assert.ok(restored);
});

test("payment grant uses one database RPC and retries dedupe without a second email", async () => {
  let balance = 0;
  let emails = 0;
  const txns = new Set();
  const db = {
    rpc: async (name, args) => {
      assert.equal(name, "grant_plan");
      if (txns.has(args.p_txn_id)) return { data: [{ applied: false, balance, user_email: "a@example.com" }], error: null };
      txns.add(args.p_txn_id);
      balance += args.p_chars;
      return { data: [{ applied: true, balance, user_email: "a@example.com" }], error: null };
    },
  };
  const { grantPlan } = loadTs("src/lib/payments.ts", {
    "@/lib/supabase": { getSupabaseAdmin: () => db },
    "@/lib/constants": { PLANS: [{ id: "starter", name: "Starter", chars: 20000 }] },
    "@/lib/emails": { sendPaymentSuccess: async () => { emails++; } },
  });
  const payment = { provider: "creem", txnId: "txn-1", userId: "00000000-0000-0000-0000-000000000001", planId: "starter", amount: 9.9 };
  const first = await grantPlan(payment);
  const retry = await grantPlan(payment);
  assert.equal(first.creditsLeft, 20000);
  assert.equal(retry.deduped, true);
  assert.equal(balance, 20000);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(emails, 1);
});

test("a database failure is surfaced instead of silently losing the usage record", async () => {
  const jobIds = [];
  const billing = loadTs("src/lib/billing.ts", {
    "./supabase": { getSupabaseAdmin: () => ({ rpc: async (_name, args) => { jobIds.push(args.p_job_id); return { error: new Error("database unavailable") }; } }) },
    "./constants": { FREE_CHARS: 150 },
  });
  await assert.rejects(
    billing.recordGeneration({ identity: { userId: "anon:123", authed: false }, voiceRowId: "voice-1", textHash: "hash", lang: "en", chars: 5, audioUrl: "https://cdn.example/audio.mp3", apiCalled: true, charged: true, bucket: "free" }),
    /database unavailable/
  );
  assert.equal(jobIds.length, 2);
  assert.equal(jobIds[0], jobIds[1]);
});

test("legacy replay endpoint refuses to grant credits twice", async () => {
  const previous = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-probe";
  try {
    const { POST } = loadTs("src/app/api/health/orders/replay/route.ts", {
      "next/server": { ...nextServer, connection: async () => {} },
    });
    const response = await POST(new Request("http://localhost/api/health/orders/replay", {
      method: "POST",
      headers: { "x-probe-token": "test-probe" },
    }));
    assert.equal(response.status, 409);
    assert.equal(response.body.error, "automatic_replay_disabled");
  } finally {
    if (previous === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous;
  }
});
