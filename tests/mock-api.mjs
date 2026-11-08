import http from "node:http";

const PORT = Number(process.env.MOCK_API_PORT || 5055);

function createVariantGlb() {
  const positions = new Float32Array([
    -0.325, 0, -0.3, 0.325, 0, -0.3, 0.325, 1.1, -0.3, -0.325, 1.1, -0.3,
    -0.325, 0, 0.3, 0.325, 0, 0.3, 0.325, 1.1, 0.3, -0.325, 1.1, 0.3,
  ]);
  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3, 5, 4, 7, 5, 7, 6, 4, 0, 3, 4, 3, 7,
    1, 5, 6, 1, 6, 2, 3, 2, 6, 3, 6, 7, 4, 5, 1, 4, 1, 0,
  ]);
  const positionBytes = Buffer.from(positions.buffer);
  const indexBytes = Buffer.from(indices.buffer);
  const padding = Buffer.alloc((4 - ((positionBytes.length + indexBytes.length) % 4)) % 4);
  const binary = Buffer.concat([positionBytes, indexBytes, padding]);
  const variantNames = ["ERGO-GREY", "ERGO-BLUE", "ERGO-TERRACOTTA"];
  const materialNames = ["grey", "blue", "terracotta"];
  const colors = [
    [0.45, 0.48, 0.5, 1],
    [0.16, 0.32, 0.55, 1],
    [0.72, 0.27, 0.12, 1],
  ];
  const document = {
    asset: { version: "2.0", generator: "interior_web mock API" },
    extensionsUsed: ["KHR_materials_variants"],
    extensions: {
      KHR_materials_variants: {
        variants: variantNames.map((name) => ({ name })),
      },
    },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "Mock chair" }],
    meshes: [{ primitives: [{
      attributes: { POSITION: 0 },
      indices: 1,
      material: 0,
      extensions: {
        KHR_materials_variants: {
          mappings: variantNames.map((_, index) => ({ material: index, variants: [index] })),
        },
      },
    }] }],
    materials: materialNames.map((name, index) => ({
      name,
      pbrMetallicRoughness: {
        baseColorFactor: colors[index],
        roughnessFactor: 0.9,
      },
    })),
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positionBytes.length, target: 34962 },
      { buffer: 0, byteOffset: positionBytes.length, byteLength: indexBytes.length, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: "VEC3", min: [-0.325, 0, -0.3], max: [0.325, 1.1, 0.3] },
      { bufferView: 1, componentType: 5123, count: indices.length, type: "SCALAR", min: [0], max: [7] },
    ],
  };
  let json = Buffer.from(JSON.stringify(document));
  json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
  const total = 12 + 8 + json.length + 8 + binary.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(json.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(binary.length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, json, binaryHeader, binary]);
}

const mockChairGlb = createVariantGlb();

const demoAccount = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    email: "demo-customer@example.com",
    full_name: "Demo Customer",
    status: "active",
    is_platform_admin: false,
    created_at: "2026-01-02T03:04:05Z",
  },
  memberships: [],
};

function errorEnvelope(code, message, requestId, details) {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(requestId ? { request_id: requestId } : {}),
    },
  };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sessionToken(req) {
  const cookies = (req.headers.cookie || "").split(";");
  for (const cookie of cookies) {
    const [name, ...value] = cookie.trim().split("=");
    if (name === "interior_session") return value.join("=");
  }
  return undefined;
}

const categories = [
  { slug: "desks", name: "Desks" },
  { slug: "chairs", name: "Chairs" },
  { slug: "tables", name: "Tables" },
];

const allProducts = [
  {
    id: "prod-1",
    slug: "aero-standing-desk",
    name: "Aero Standing Desk",
    description: "Motorized height-adjustable desk with bamboo top.",
    category: { slug: "desks", name: "Desks" },
    company: { slug: "woodcraft", name: "WoodCraft" },
    price: { amount_minor: 1500000, currency: "ETB" },
    dimensions: { width_mm: 1400, depth_mm: 700, height_mm: 1050 },
    primary_image_url: "/v1/media/img-desk",
  },
  {
    id: "prod-2",
    slug: "ergo-task-chair",
    name: "Ergo Task Chair",
    description: "High-performance mesh chair with lumbar support.",
    category: { slug: "chairs", name: "Chairs" },
    company: { slug: "ergoseat", name: "ErgoSeat" },
    price: { amount_minor: 850000, currency: "ETB" },
    dimensions: { width_mm: 650, depth_mm: 600, height_mm: 1100 },
    primary_image_url: "/v1/media/img-chair",
  },
  {
    id: "prod-3",
    slug: "zenith-dining-table",
    name: "Zenith Dining Table",
    description: "Solid oak dining table seating eight people.",
    category: { slug: "tables", name: "Tables" },
    company: { slug: "woodcraft", name: "WoodCraft" },
    price: { amount_minor: 2200000, currency: "ETB" },
    dimensions: { width_mm: 2000, depth_mm: 900, height_mm: 760 },
    primary_image_url: null,
  },
];

const page2Products = [
  {
    id: "prod-4",
    slug: "plush-lounge-chair",
    name: "Plush Lounge Chair",
    description: "Deep-seated armchair in textured bouclé.",
    category: { slug: "chairs", name: "Chairs" },
    company: { slug: "ergoseat", name: "ErgoSeat" },
    price: { amount_minor: 1200000, currency: "ETB" },
    dimensions: { width_mm: 850, depth_mm: 800, height_mm: 900 },
    primary_image_url: null,
  },
];

const roomTemplates = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    slug: "home-office-3x4",
    name: "Home office 3×4 m",
    description: "A compact home office with one door and a window.",
    room: { width_mm: 3000, depth_mm: 4000, height_mm: 2700 },
    features: {
      wall_color: "#F2EFE9",
      floor: "oak",
      openings: [
        { type: "door", wall: "south", offset_mm: 300, width_mm: 900, height_mm: 2100, sill_mm: 0 },
        { type: "window", wall: "north", offset_mm: 900, width_mm: 1200, height_mm: 1300, sill_mm: 900 },
      ],
    },
    sort_order: 10,
    updated_at: "2026-10-01T00:00:00Z",
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    slug: "living-room-5x6",
    name: "Living room 5×6 m",
    description: "An open living room with two windows.",
    room: { width_mm: 5000, depth_mm: 6000, height_mm: 2800 },
    features: { wall_color: "#FFFFFF", floor: "oak", openings: [] },
    sort_order: 20,
    updated_at: "2026-10-01T00:00:00Z",
  },
];

function designSummary(design) {
  return {
    id: design.id,
    name: design.name,
    template_id: design.template_id,
    room: design.room,
    item_count: design.item_count,
    created_at: design.created_at,
    updated_at: design.updated_at,
  };
}

function designDetail(design) {
  return {
    ...designSummary(design),
    features: design.features,
    items: design.items,
    estimate: design.estimate,
  };
}

function seededDesigns() {
  const owner = demoAccount.user.email;
  const main = {
    owner,
    id: "55555555-5555-4555-8555-555555555555",
    name: "My living room",
    template_id: roomTemplates[1].id,
    room: roomTemplates[1].room,
    item_count: 2,
    created_at: "2026-10-20T10:00:00Z",
    updated_at: "2026-11-04T10:00:00Z",
    features: roomTemplates[1].features,
    revision: 1,
    items: [{
      id: "66666666-6666-4666-8666-666666666666",
      position: { x_mm: 1600, y_mm: 0, z_mm: 1800 },
      rotation_deg: 30,
      available: true,
      product: {
        id: "77777777-7777-4777-8777-777777777777",
        slug: "ergo-task-chair",
        name: "Ergo Task Chair",
        company_slug: "ergoseat",
        company_name: "ErgoSeat",
        variant_id: "88888888-8888-4888-8888-888888888888",
        sku: "ERGO-GREY",
        options: { Colour: "Grey" },
        price: { amount_minor: 850000, currency: "ETB" },
        dimensions: { width_mm: 650, depth_mm: 600, height_mm: 1100 },
        primary_image_url: "/v1/media/img-chair",
        model_url: "/v1/media/chair.glb",
      },
      updated_at: "2026-11-04T10:00:00Z",
    }, {
      id: "67676767-6767-4676-8676-676767676767",
      position: { x_mm: 3300, y_mm: 0, z_mm: 2200 },
      rotation_deg: 0,
      available: false,
      product: {
        id: "78787878-7878-4787-8787-787878787878",
        slug: "broken-side-table",
        name: "Broken Side Table",
        company_slug: "ergoseat",
        company_name: "ErgoSeat",
        variant_id: null,
        sku: null,
        options: {},
        price: { amount_minor: 320000, currency: "ETB" },
        dimensions: { width_mm: 500, depth_mm: 500, height_mm: 550 },
        primary_image_url: null,
        model_url: "/v1/media/broken.glb",
      },
      updated_at: "2026-11-04T10:00:00Z",
    }],
    estimate: {
      note: "Estimate at current catalog prices for available items; not a quote.",
      item_count: 2,
      unavailable_count: 1,
      totals: [{ company_slug: "ergoseat", company_name: "ErgoSeat", currency: "ETB", amount_minor: 850000, items: 1 }],
    },
  };
  const extras = Array.from({ length: 20 }, (_, index) => ({
    owner,
    id: `90000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    name: `Planning room ${index + 1}`,
    template_id: roomTemplates[0].id,
    room: roomTemplates[0].room,
    item_count: 0,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: `2026-10-${String(30 - index).padStart(2, "0")}T00:00:00Z`,
    features: roomTemplates[0].features,
    revision: 1,
    items: [],
    estimate: { note: "Estimate at current catalog prices for available items; not a quote.", item_count: 0, unavailable_count: 0, totals: [] },
  }));
  return [main, ...extras];
}

const quoteStatuses = ["pending", "reviewing", "quoted", "accepted", "rejected", "cancelled", "declined"];
const finalQuoteStatuses = ["accepted", "rejected", "cancelled", "declined"];

// A quote request in exactly Go's detail shape (lines and charges always
// present). Totals match the lines, as the frontend normalizer checks.
function mockQuoteRequest({ id, status = "pending", revision = 0, expired = false, validUntil = null, submittedAt = "2026-11-01T09:00:00Z" }) {
  const quoted = revision > 0;
  const final = finalQuoteStatuses.includes(status);
  return {
    id, submission_id: `88${id.slice(2)}`, design_id: "55555555-5555-4555-8555-555555555555",
    status, revision, final,
    company: { id: "82000000-0000-4000-8000-000000000001", slug: "ergoseat", name: "ErgoSeat" },
    customer: { name: demoAccount.user.full_name, email: demoAccount.user.email, phone: "+251 911 000000", delivery_address: "Bole, Addis Ababa", note: "Please deliver after 5pm." },
    currency: "ETB", list_total_minor: 1820000, quoted_total_minor: quoted ? 1860000 : null,
    valid_until: quoted ? validUntil : null, expired: quoted && expired,
    company_note: quoted ? "Price includes assembly." : "", line_count: 2,
    lines: [
      { id: `86${id.slice(2)}`, product_id: "77777777-7777-4777-8777-777777777777", variant_id: "88888888-8888-4888-8888-888888888888", product_name: "Ergo Task Chair", product_slug: "ergo-task-chair", sku: "ERGO-GREY", options: { Colour: "Grey" }, dimensions: { width_mm: 650, depth_mm: 600, height_mm: 1100 }, quantity: 2, list_unit_price_minor: 850000, quoted_unit_price_minor: quoted ? 800000 : null, note: quoted ? "Two in stock." : "" },
      { id: `87${id.slice(2)}`, product_id: null, variant_id: null, product_name: "Ergo Footrest", product_slug: "ergo-footrest", sku: null, options: {}, dimensions: { width_mm: 450, depth_mm: 350, height_mm: 120 }, quantity: 1, list_unit_price_minor: 120000, quoted_unit_price_minor: quoted ? 110000 : null, note: "" },
    ],
    charges: quoted ? [{ label: "Delivery to Bole", amount_minor: 150000 }] : [],
    submitted_at: submittedAt, quoted_at: quoted ? "2026-11-03T10:00:00Z" : null, decided_at: final ? "2026-11-04T10:00:00Z" : null,
  };
}

// Read-only fixtures for list/detail views. Tests that accept, reject or
// cancel create their own request through the test-only route below.
function seededQuoteRequests() {
  return [
    mockQuoteRequest({ id: "85000000-0000-4000-8000-000000000001", status: "pending", submittedAt: "2026-11-05T09:00:00Z" }),
    mockQuoteRequest({ id: "85000000-0000-4000-8000-000000000002", status: "quoted", revision: 2, validUntil: "2099-12-31", submittedAt: "2026-11-04T09:00:00Z" }),
    mockQuoteRequest({ id: "85000000-0000-4000-8000-000000000003", status: "quoted", revision: 1, validUntil: "2026-01-10", expired: true, submittedAt: "2026-11-03T09:00:00Z" }),
    mockQuoteRequest({ id: "85000000-0000-4000-8000-000000000004", status: "accepted", revision: 1, validUntil: "2099-12-31", submittedAt: "2026-11-02T09:00:00Z" }),
  ];
}

// Go list rows never include lines or charges.
function quoteSummary(request) {
  const summary = { ...request };
  delete summary.lines;
  delete summary.charges;
  return summary;
}

export function createMockServer() {
  const accounts = new Map([[demoAccount.user.email, demoAccount]]);
  const sessions = new Map();
  let nextSession = 1;
  let nextDesign = 1;
  let nextQuote = 1;
  const designs = seededDesigns();
  const quoteRequests = seededQuoteRequests();
  const designCursor = "  design+page==  ";

  function issueSession(res, account, mode = "normal") {
    const token = `mock-session-${nextSession++}`;
    sessions.set(token, { account, mode });
    res.setHeader(
      "Set-Cookie",
      `interior_session=${token}; Path=/; HttpOnly; SameSite=Lax`,
    );
  }

  function requireRevision(req, res, design) {
    const raw = req.headers["if-match"];
    if (!raw) {
      res.writeHead(428);
      res.end(JSON.stringify(errorEnvelope("precondition_required", "If-Match design revision is required", "mock-design-428")));
      return false;
    }
    const match = /^"design-([1-9][0-9]*)"$/.exec(raw);
    if (!match) {
      res.writeHead(400);
      res.end(JSON.stringify(errorEnvelope("validation_failed", "validation failed", "mock-design-etag-400", { "If-Match": "is invalid" })));
      return false;
    }
    if (Number(match[1]) !== design.revision) {
      res.setHeader("ETag", `"design-${design.revision}"`);
      res.writeHead(409);
      res.end(JSON.stringify(errorEnvelope("stale_revision", "the design changed in another editor", "mock-design-stale")));
      return false;
    }
    return true;
  }

  function advanceRevision(res, design) {
    design.revision += 1;
    design.updated_at = new Date().toISOString();
    res.setHeader("ETag", `"design-${design.revision}"`);
  }

  function refreshEstimate(design) {
    const available = design.items.filter((item) => item.available);
    const totals = new Map();
    for (const item of available) {
      const key = `${item.product.company_slug}:${item.product.price.currency}`;
      const current = totals.get(key) ?? {
        company_slug: item.product.company_slug,
        company_name: item.product.company_name,
        currency: item.product.price.currency,
        amount_minor: 0,
        items: 0,
      };
      current.amount_minor += item.product.price.amount_minor;
      current.items += 1;
      totals.set(key, current);
    }
    design.item_count = design.items.length;
    design.estimate = {
      note: "Estimate at current catalog prices for available items; not a quote.",
      item_count: design.items.length,
      unavailable_count: design.items.length - available.length,
      totals: [...totals.values()],
    };
  }

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("x-request-id", "mock-req-" + Math.random().toString(36).substring(2, 8));

    if (url.pathname === "/health" || url.pathname === "/v1/health") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "API is running" }));
      return;
    }

    if (url.pathname === "/v1/auth/me" && req.method === "GET") {
      const session = sessions.get(sessionToken(req));
      if (!session) {
        res.writeHead(401);
        res.end(
          JSON.stringify(
            errorEnvelope("unauthenticated", "authentication required", "mock-auth-401"),
          ),
        );
        return;
      }
      if (session.mode === "account-error") {
        res.writeHead(500);
        res.end(
          JSON.stringify(
            errorEnvelope("internal_error", "account lookup failed", "mock-auth-me-500"),
          ),
        );
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify(session.account));
      return;
    }

    if (url.pathname === "/v1/auth/login" && req.method === "POST") {
      const body = await readJson(req);
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (email === "rate-limit@example.com") {
        res.writeHead(429);
        res.end(
          JSON.stringify(
            errorEnvelope("rate_limited", "too many attempts", "mock-auth-429"),
          ),
        );
        return;
      }
      if (email === "trigger-error@example.com") {
        res.writeHead(500);
        res.end(
          JSON.stringify(
            errorEnvelope("internal_error", "login failed", "mock-auth-login-500"),
          ),
        );
        return;
      }
      const isAccountError = email === "account-error@example.com";
      const account = isAccountError
        ? {
            ...demoAccount,
            user: {
              ...demoAccount.user,
              email,
              full_name: "Account Error",
            },
          }
        : accounts.get(email);
      const validPassword =
        body.password === "customer password 1" ||
        (isAccountError && body.password === "password 123");
      if (!account || !validPassword) {
        res.writeHead(401);
        res.end(
          JSON.stringify(
            errorEnvelope("invalid_credentials", "invalid email or password", "mock-auth-login-401"),
          ),
        );
        return;
      }
      issueSession(res, account, isAccountError ? "account-error" : "normal");
      res.writeHead(200);
      res.end(JSON.stringify(account));
      return;
    }

    if (url.pathname === "/v1/auth/register" && req.method === "POST") {
      const body = await readJson(req);
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (accounts.has(email)) {
        res.writeHead(409);
        res.end(
          JSON.stringify(
            errorEnvelope("email_taken", "an account with this email already exists", "mock-auth-register-409"),
          ),
        );
        return;
      }
      const account = {
        user: {
          id: `44444444-4444-4444-8444-${String(nextSession).padStart(12, "0")}`,
          email,
          full_name: body.full_name,
          status: "active",
          is_platform_admin: false,
          created_at: "2026-11-04T07:00:00Z",
        },
        memberships: [],
      };
      accounts.set(email, account);
      issueSession(res, account);
      res.writeHead(201);
      res.end(JSON.stringify(account));
      return;
    }

    if (url.pathname === "/v1/auth/logout" && req.method === "POST") {
      const token = sessionToken(req);
      if (token) sessions.delete(token);
      res.setHeader(
        "Set-Cookie",
        "interior_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
      );
      res.writeHead(204);
      res.end();
      return;
    }

    if (url.pathname === "/v1/room-templates" && req.method === "GET") {
      res.writeHead(200);
      res.end(JSON.stringify({ templates: roomTemplates }));
      return;
    }

    if (url.pathname === "/v1/quote-requests/from-design" && req.method === "POST") {
      const session = sessions.get(sessionToken(req));
      if (!session) { res.writeHead(401); res.end(JSON.stringify(errorEnvelope("unauthenticated", "authentication required", "mock-quote-401"))); return; }
      const body = await readJson(req);
      const design = designs.find((entry) => entry.id === body.design_id && entry.owner === session.account.user.email);
      if (!design) { res.writeHead(404); res.end(JSON.stringify(errorEnvelope("not_found", "design not found", "mock-quote-404"))); return; }
      if (body.note === "trigger-rate") { res.writeHead(429); res.end(JSON.stringify(errorEnvelope("rate_limited", "too many attempts", "mock-quote-429"))); return; }
      if (body.note === "trigger-error") { res.writeHead(500); res.end(JSON.stringify(errorEnvelope("internal_error", "quote submission failed", "mock-quote-500"))); return; }
      const details = {};
      if (typeof body.contact_phone !== "string" || [...body.contact_phone.trim()].length > 40) details.contact_phone = "must be at most 40 characters";
      if (typeof body.delivery_address !== "string" || [...body.delivery_address.trim()].length > 500) details.delivery_address = "must be at most 500 characters";
      if (typeof body.note !== "string" || [...body.note.trim()].length > 2000) details.note = "must be at most 2000 characters";
      if (Object.keys(details).length) { res.writeHead(400); res.end(JSON.stringify(errorEnvelope("validation_failed", "validation failed", "mock-quote-400", details))); return; }
      const available = design.items.filter((item) => item.available);
      if (!available.length) { res.writeHead(400); res.end(JSON.stringify(errorEnvelope("nothing_available", "none of the design's items are currently available", "mock-quote-empty-400"))); return; }
      const submissionId = `81000000-0000-4000-8000-${String(nextQuote++).padStart(12, "0")}`;
      const groups = new Map();
      for (const item of available) {
        const key = `${item.product.company_slug}:${item.product.price.currency}`;
        const group = groups.get(key) ?? [];
        group.push(item); groups.set(key, group);
      }
      const submittedAt = new Date().toISOString();
      const requests = [...groups.values()].map((items) => {
        const first = items[0];
        const companyId = first.product.company_slug === "ergoseat" ? "82000000-0000-4000-8000-000000000001" : "82000000-0000-4000-8000-000000000002";
        const request = {
          id: `83000000-0000-4000-8000-${String(nextQuote++).padStart(12, "0")}`, submission_id: submissionId, design_id: design.id,
          status: "pending", revision: 0, final: false,
          company: { id: companyId, slug: first.product.company_slug, name: first.product.company_name },
          customer: { name: session.account.user.full_name, email: session.account.user.email, phone: body.contact_phone.trim(), delivery_address: body.delivery_address.trim(), note: body.note.trim() },
          currency: first.product.price.currency,
          list_total_minor: items.reduce((sum, item) => sum + item.product.price.amount_minor, 0), quoted_total_minor: null,
          valid_until: null, expired: false, company_note: "", line_count: items.length,
          lines: items.map((item, index) => ({ id: `84000000-0000-4000-8000-${String(nextQuote * 100 + index).padStart(12, "0")}`, product_id: item.product.id, variant_id: item.product.variant_id, product_name: item.product.name, product_slug: item.product.slug, sku: item.product.sku, options: item.product.options, dimensions: item.product.dimensions, quantity: 1, list_unit_price_minor: item.product.price.amount_minor, quoted_unit_price_minor: null, note: "" })),
          charges: [], submitted_at: submittedAt, quoted_at: null, decided_at: null,
        };
        quoteRequests.push(request);
        return request;
      });
      const skipped = design.items.filter((item) => !item.available).map((item) => ({ item_id: item.id, product_name: item.product.name }));
      res.writeHead(201); res.end(JSON.stringify({ submission_id: submissionId, requests, skipped })); return;
    }

    // Test-only route with no Go equivalent: each Playwright test creates its
    // own quote, so parallel desktop/mobile runs never act on the same one.
    if (url.pathname === "/__mock/quote-requests" && req.method === "POST") {
      const body = await readJson(req);
      const id = `85000000-0000-4000-8000-${String(900000 + nextQuote++).padStart(12, "0")}`;
      const request = mockQuoteRequest({ id, status: body.status ?? "quoted", revision: body.revision ?? 1, expired: Boolean(body.expired), validUntil: body.valid_until ?? "2099-12-31", submittedAt: new Date().toISOString() });
      quoteRequests.push(request);
      res.writeHead(201); res.end(JSON.stringify(request)); return;
    }
    // Test-only: the maker sends a new revision (as PUT .../quote does in Go).
    const reviseMatch = url.pathname.match(/^\/__mock\/quote-requests\/([^/]+)\/revise$/);
    if (reviseMatch && req.method === "POST") {
      const request = quoteRequests.find((entry) => entry.id === reviseMatch[1]);
      if (!request) { res.writeHead(404); res.end(JSON.stringify(errorEnvelope("not_found", "quote request not found", "mock-revise-404"))); return; }
      request.revision += 1; request.status = "quoted"; request.quoted_at = new Date().toISOString();
      res.writeHead(200); res.end(JSON.stringify(request)); return;
    }

    if (url.pathname === "/v1/quote-requests" && req.method === "GET") {
      const session = sessions.get(sessionToken(req));
      if (!session) { res.writeHead(401); res.end(JSON.stringify(errorEnvelope("unauthenticated", "authentication required", "mock-quotes-401"))); return; }
      const status = url.searchParams.get("status");
      const limit = Number(url.searchParams.get("limit") ?? 20);
      const cursor = url.searchParams.get("cursor");
      const offset = cursor === null ? 0 : Number(/^quote-page:(\d+)$/.exec(cursor)?.[1] ?? NaN);
      const details = {};
      if (status !== null && !quoteStatuses.includes(status)) details.status = "must be pending, reviewing, quoted, accepted, rejected, cancelled or declined";
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) details.limit = "must be between 1 and 100";
      if (!Number.isInteger(offset)) details.cursor = "is invalid; pass next_cursor from the previous page unchanged";
      if (Object.keys(details).length) { res.writeHead(400); res.end(JSON.stringify(errorEnvelope("validation_failed", "validation failed", "mock-quotes-400", details))); return; }
      const mine = quoteRequests
        .filter((entry) => entry.customer.email === session.account.user.email && (status === null || entry.status === status))
        .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at) || b.id.localeCompare(a.id));
      const page = mine.slice(offset, offset + limit);
      const next = offset + limit < mine.length ? `quote-page:${offset + limit}` : null;
      res.writeHead(200); res.end(JSON.stringify({ requests: page.map(quoteSummary), next_cursor: next })); return;
    }

    const quoteMatch = url.pathname.match(/^\/v1\/quote-requests\/([^/]+)(?:\/(accept|reject|cancel))?$/);
    if (quoteMatch && ((req.method === "GET" && !quoteMatch[2]) || (req.method === "POST" && quoteMatch[2]))) {
      const session = sessions.get(sessionToken(req));
      if (!session) { res.writeHead(401); res.end(JSON.stringify(errorEnvelope("unauthenticated", "authentication required", "mock-quote-detail-401"))); return; }
      const request = quoteRequests.find((entry) => entry.id === quoteMatch[1] && entry.customer.email === session.account.user.email);
      if (!request) { res.writeHead(404); res.end(JSON.stringify(errorEnvelope("not_found", "quote request not found", "mock-quote-detail-404"))); return; }
      const action = quoteMatch[2];
      if (!action) { res.writeHead(200); res.end(JSON.stringify(request)); return; }
      // Same order as Go: body check, then status, then revision, then expiry.
      let revision;
      if (action === "accept") {
        const body = await readJson(req).catch(() => ({}));
        if (!Number.isInteger(body.revision)) { res.writeHead(400); res.end(JSON.stringify(errorEnvelope("validation_failed", "validation failed", "mock-accept-400", { revision: "required: the revision you are accepting" }))); return; }
        revision = body.revision;
      }
      const allowed = { accept: ["quoted"], reject: ["quoted"], cancel: ["pending", "reviewing", "quoted"] }[action];
      if (!allowed.includes(request.status)) { res.writeHead(409); res.end(JSON.stringify(errorEnvelope("invalid_transition", "the request's status does not allow this action", "mock-quote-409"))); return; }
      if (action === "accept" && revision !== request.revision) { res.writeHead(409); res.end(JSON.stringify(errorEnvelope("stale_revision", "the quote was revised; review the latest revision before accepting", "mock-quote-stale"))); return; }
      if (action === "accept" && request.expired) { res.writeHead(409); res.end(JSON.stringify(errorEnvelope("quote_expired", "this quote is past its valid-until date", "mock-quote-expired"))); return; }
      request.status = { accept: "accepted", reject: "rejected", cancel: "cancelled" }[action];
      request.final = true; request.decided_at = new Date().toISOString();
      res.writeHead(200); res.end(JSON.stringify(request)); return;
    }

    if (url.pathname === "/v1/designs" && req.method === "GET") {
      const session = sessions.get(sessionToken(req));
      if (!session) {
        res.writeHead(401);
        res.end(JSON.stringify(errorEnvelope("unauthenticated", "authentication required", "mock-designs-401")));
        return;
      }
      const mine = designs.filter((design) => design.owner === session.account.user.email);
      const cursor = url.searchParams.get("cursor");
      if (cursor !== null && cursor !== designCursor) {
        res.writeHead(400);
        res.end(JSON.stringify(errorEnvelope("validation_failed", "validation failed", "mock-designs-400", { cursor: "is invalid" })));
        return;
      }
      const page = cursor === designCursor ? mine.slice(20) : mine.slice(0, 20);
      res.writeHead(200);
      res.end(JSON.stringify({ designs: page.map(designSummary), next_cursor: cursor === null && mine.length > 20 ? designCursor : null }));
      return;
    }

    if (url.pathname === "/v1/designs" && req.method === "POST") {
      const session = sessions.get(sessionToken(req));
      if (!session) {
        res.writeHead(401);
        res.end(JSON.stringify(errorEnvelope("unauthenticated", "authentication required", "mock-design-create-401")));
        return;
      }
      const body = await readJson(req);
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const template = roomTemplates.find((entry) => entry.slug === body.template);
      const custom = Number.isInteger(body.width_mm) && Number.isInteger(body.depth_mm) && Number.isInteger(body.height_mm);
      if (!name || (!template && !custom)) {
        res.writeHead(400);
        res.end(JSON.stringify(errorEnvelope("validation_failed", "validation failed", "mock-design-create-400", { ...(name ? {} : { name: "must be 1 to 100 characters" }), ...(!template && !custom ? { template: "choose a template or custom dimensions" } : {}) })));
        return;
      }
      const id = `70000000-0000-4000-8000-${String(nextDesign++).padStart(12, "0")}`;
      const now = new Date().toISOString();
      const design = {
        owner: session.account.user.email,
        id,
        name,
        template_id: template?.id ?? null,
        room: template?.room ?? { width_mm: body.width_mm, depth_mm: body.depth_mm, height_mm: body.height_mm },
        item_count: 0,
        created_at: now,
        updated_at: now,
        features: template?.features ?? { wall_color: body.features?.wall_color ?? "", floor: body.features?.floor ?? "", openings: [] },
        revision: 1,
        items: [],
        estimate: { note: "Estimate at current catalog prices for available items; not a quote.", item_count: 0, unavailable_count: 0, totals: [] },
      };
      designs.unshift(design);
      res.setHeader("ETag", '"design-1"');
      res.writeHead(201);
      res.end(JSON.stringify(designDetail(design)));
      return;
    }

    const designMatch = url.pathname.match(/^\/v1\/designs\/([^/]+)$/);
    if (designMatch && req.method === "GET") {
      const session = sessions.get(sessionToken(req));
      if (!session) {
        res.writeHead(401);
        res.end(JSON.stringify(errorEnvelope("unauthenticated", "authentication required", "mock-design-detail-401")));
        return;
      }
      if (designMatch[1] === "99999999-9999-4999-8999-999999999999") {
        res.writeHead(500);
        res.end(JSON.stringify(errorEnvelope("internal_error", "design lookup failed", "mock-design-detail-500")));
        return;
      }
      const design = designs.find((entry) => entry.id === designMatch[1] && entry.owner === session.account.user.email);
      if (!design) {
        res.writeHead(404);
        res.end(JSON.stringify(errorEnvelope("not_found", "design not found", "mock-design-404")));
        return;
      }
      res.setHeader("ETag", `"design-${design.revision}"`);
      res.writeHead(200);
      res.end(JSON.stringify(designDetail(design)));
      return;
    }

    if (designMatch && req.method === "PATCH") {
      const session = sessions.get(sessionToken(req));
      if (!session) { res.writeHead(401); res.end(JSON.stringify(errorEnvelope("unauthenticated", "authentication required", "mock-design-update-401"))); return; }
      const design = designs.find((entry) => entry.id === designMatch[1] && entry.owner === session.account.user.email);
      if (!design) { res.writeHead(404); res.end(JSON.stringify(errorEnvelope("not_found", "design not found", "mock-design-404"))); return; }
      if (!requireRevision(req, res, design)) return;
      const body = await readJson(req);
      const nextRoom = { width_mm: body.width_mm ?? design.room.width_mm, depth_mm: body.depth_mm ?? design.room.depth_mm, height_mm: body.height_mm ?? design.room.height_mm };
      if (nextRoom.width_mm < 1000 || nextRoom.depth_mm < 1000 || nextRoom.height_mm < 2000) { res.writeHead(400); res.end(JSON.stringify(errorEnvelope("validation_failed", "validation failed", "mock-design-update-400", { width_mm: "is outside limits" }))); return; }
      if (design.items.some((item) => item.position.x_mm > nextRoom.width_mm || item.position.z_mm > nextRoom.depth_mm || item.position.y_mm > nextRoom.height_mm)) { res.writeHead(409); res.end(JSON.stringify(errorEnvelope("items_outside_room", "items are outside room", "mock-design-resize-409"))); return; }
      if (typeof body.name === "string") design.name = body.name.trim();
      design.room = nextRoom;
      if (body.features) design.features = body.features;
      advanceRevision(res, design);
      res.writeHead(200); res.end(JSON.stringify(designDetail(design))); return;
    }

    if (designMatch && req.method === "DELETE") {
      const session = sessions.get(sessionToken(req));
      if (!session) { res.writeHead(401); res.end(JSON.stringify(errorEnvelope("unauthenticated", "authentication required", "mock-design-delete-401"))); return; }
      const index = designs.findIndex((entry) => entry.id === designMatch[1] && entry.owner === session.account.user.email);
      if (index < 0) { res.writeHead(404); res.end(JSON.stringify(errorEnvelope("not_found", "design not found", "mock-design-404"))); return; }
      if (!requireRevision(req, res, designs[index])) return;
      // Like Go: a deleted design has no next revision, so no ETag.
      designs.splice(index, 1); res.writeHead(204); res.end(); return;
    }

    const itemsMatch = url.pathname.match(/^\/v1\/designs\/([^/]+)\/items(?:\/([^/]+))?$/);
    if (itemsMatch && ["POST", "PATCH", "DELETE"].includes(req.method)) {
      const session = sessions.get(sessionToken(req));
      if (!session) { res.writeHead(401); res.end(JSON.stringify(errorEnvelope("unauthenticated", "authentication required", "mock-design-item-401"))); return; }
      const design = designs.find((entry) => entry.id === itemsMatch[1] && entry.owner === session.account.user.email);
      if (!design) { res.writeHead(404); res.end(JSON.stringify(errorEnvelope("not_found", "design not found", "mock-design-404"))); return; }
      if (!requireRevision(req, res, design)) return;
      if (req.method === "POST" && !itemsMatch[2]) {
        const body = await readJson(req);
        const product = allProducts.find((entry) => entry.id === body.product_id);
        if (!product) { res.writeHead(400); res.end(JSON.stringify(errorEnvelope("validation_failed", "validation failed", "mock-item-400", { product_id: "is unavailable" }))); return; }
        const chairVariants = [
          { id: "88888888-8888-4888-8888-888888888888", sku: "ERGO-GREY", available: true, options: { Colour: "Grey" }, price: { amount_minor: 850000, currency: "ETB" } },
          { id: "89898989-8989-4898-8989-898989898989", sku: "ERGO-BLUE", available: true, options: { Colour: "Blue" }, price: { amount_minor: 920000, currency: "ETB" } },
          { id: "90909090-9090-4909-8909-909090909090", sku: "ERGO-TERRACOTTA", available: false, options: { Colour: "Terracotta" }, price: { amount_minor: 980000, currency: "ETB" } },
        ];
        const variant = product.slug === "ergo-task-chair" ? chairVariants.find((entry) => entry.id === body.variant_id) : undefined;
        if (product.slug === "ergo-task-chair" && (!variant || !variant.available)) { res.writeHead(400); res.end(JSON.stringify(errorEnvelope("validation_failed", "validation failed", "mock-item-variant-400", { variant_id: "choose an available variant" }))); return; }
        const productId = product.slug === "ergo-task-chair" ? "77777777-7777-4777-8777-777777777777" : "79797979-7979-4797-8797-797979797979";
        const item = { id: `71000000-0000-4000-8000-${String(nextDesign++).padStart(12, "0")}`, position: { x_mm: body.x_mm, y_mm: body.y_mm ?? 0, z_mm: body.z_mm }, rotation_deg: body.rotation_deg ?? 0, available: true, product: { id: productId, slug: product.slug, name: product.name, company_slug: product.company.slug, company_name: product.company.name, variant_id: variant?.id ?? null, sku: variant?.sku ?? null, options: variant?.options ?? {}, price: variant?.price ?? product.price, dimensions: product.dimensions, primary_image_url: product.primary_image_url, model_url: product.slug === "ergo-task-chair" ? "/v1/media/chair.glb" : null }, updated_at: new Date().toISOString() };
        design.items.push(item); refreshEstimate(design); advanceRevision(res, design); res.writeHead(201); res.end(JSON.stringify(item)); return;
      }
      const index = design.items.findIndex((entry) => entry.id === itemsMatch[2]);
      if (index < 0) { res.writeHead(404); res.end(JSON.stringify(errorEnvelope("not_found", "design item not found", "mock-item-404"))); return; }
      if (req.method === "PATCH") {
        const body = await readJson(req); const item = design.items[index];
        item.position = { x_mm: body.x_mm ?? item.position.x_mm, y_mm: body.y_mm ?? item.position.y_mm, z_mm: body.z_mm ?? item.position.z_mm };
        item.rotation_deg = body.rotation_deg ?? item.rotation_deg;
        if (body.variant_id) { const variants = [{ id: "88888888-8888-4888-8888-888888888888", sku: "ERGO-GREY", options: { Colour: "Grey" }, price: { amount_minor: 850000, currency: "ETB" } }, { id: "89898989-8989-4898-8989-898989898989", sku: "ERGO-BLUE", options: { Colour: "Blue" }, price: { amount_minor: 920000, currency: "ETB" } }]; const variant = variants.find((entry) => entry.id === body.variant_id); if (!variant) { res.writeHead(400); res.end(JSON.stringify(errorEnvelope("validation_failed", "validation failed", "mock-item-variant-400", { variant_id: "choose an available variant" }))); return; } item.product.variant_id = variant.id; item.product.sku = variant.sku; item.product.options = variant.options; item.product.price = variant.price; }
        item.updated_at = new Date().toISOString(); refreshEstimate(design); advanceRevision(res, design); res.writeHead(200); res.end(JSON.stringify(item)); return;
      }
      design.items.splice(index, 1); refreshEstimate(design); advanceRevision(res, design); res.writeHead(204); res.end(); return;
    }

    if (url.pathname === "/v1/catalog/categories") {
      res.writeHead(200);
      res.end(JSON.stringify({ categories }));
      return;
    }

    if (url.pathname === "/v1/media/chair.glb") {
      res.setHeader("Content-Type", "model/gltf-binary");
      res.setHeader("Content-Length", String(mockChairGlb.length));
      res.writeHead(200);
      res.end(mockChairGlb);
      return;
    }

    if (url.pathname === "/v1/media/broken.glb") {
      res.setHeader("Content-Type", "model/gltf-binary");
      res.writeHead(200);
      res.end(Buffer.from("not a glb"));
      return;
    }

    if (url.pathname.startsWith("/v1/media/")) {
      res.setHeader("Content-Type", "image/svg+xml");
      res.writeHead(200);
      res.end(
        `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#354535"/></svg>`,
      );
      return;
    }

    const detailMatch = url.pathname.match(
      /^\/v1\/catalog\/products\/([^/]+)\/([^/]+)$/,
    );
    if (detailMatch) {
      const companySlug = decodeURIComponent(detailMatch[1]);
      const productSlug = decodeURIComponent(detailMatch[2]);

      if (productSlug === "trigger-error") {
        res.writeHead(500);
        res.end(
          JSON.stringify({
            error: {
              code: "internal_error",
              message: "Simulated internal server error",
              request_id: "mock-err-500",
            },
          }),
        );
        return;
      }

      if (companySlug === "ergoseat" && productSlug === "ergo-task-chair") {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            id: "prod-2",
            slug: "ergo-task-chair",
            name: "Ergo Task Chair",
            description: "High-performance mesh chair with lumbar support.",
            category: { slug: "chairs", name: "Chairs" },
            company: { slug: "ergoseat", name: "ErgoSeat" },
            price: { amount_minor: 850000, currency: "ETB" },
            dimensions: { width_mm: 650, depth_mm: 600, height_mm: 1100 },
            weight_g: 14500,
            published_at: "2026-10-15T09:30:00Z",
            primary_image_url: "/v1/media/img-chair",
            images: [
              {
                id: "img-chair-1",
                kind: "image",
                url: "/v1/media/img-chair",
                content_type: "image/webp",
                size_bytes: 102400,
                width: 1200,
                height: 1200,
                alt_text: "Ergo Task Chair Front",
                position: 0,
                is_primary: true,
              },
              {
                id: "img-chair-2",
                kind: "image",
                url: "/v1/media/img-chair-side",
                content_type: "image/webp",
                size_bytes: 98304,
                width: 1200,
                height: 1200,
                alt_text: "Ergo Task Chair Side Profile",
                position: 1,
                is_primary: false,
              },
            ],
            model: {
              id: "mod-chair",
              kind: "model",
              url: "/v1/media/chair.glb",
              content_type: "model/gltf-binary",
              size_bytes: 2048,
              position: 0,
              materials: ["grey", "blue", "terracotta"],
              variants: ["ERGO-GREY", "ERGO-BLUE", "ERGO-TERRACOTTA"],
            },
            options: [
              {
                id: "opt-color",
                name: "Colour",
                position: 1,
                values: [
                  {
                    id: "val-grey",
                    name: "Grey",
                    position: 1,
                    swatch_hex: "#808080",
                    material_key: "grey",
                  },
                  {
                    id: "val-blue",
                    name: "Blue",
                    position: 2,
                    swatch_hex: "#0000FF",
                    material_key: "blue",
                  },
                  {
                    id: "val-terracotta",
                    name: "Terracotta",
                    position: 3,
                    swatch_hex: "#D97706",
                    material_key: "terracotta",
                  },
                ],
              },
            ],
            variants: [
              {
                id: "88888888-8888-4888-8888-888888888888",
                sku: "ERGO-GREY",
                price: { amount_minor: 850000, currency: "ETB" },
                available: true,
                position: 1,
                options: { Colour: "Grey" },
                value_ids: ["val-grey"],
              },
              {
                id: "89898989-8989-4898-8989-898989898989",
                sku: "ERGO-BLUE",
                price: { amount_minor: 920000, currency: "ETB" },
                available: true,
                position: 2,
                options: { Colour: "Blue" },
                value_ids: ["val-blue"],
              },
              {
                id: "90909090-9090-4909-8909-909090909090",
                sku: "ERGO-TERRACOTTA",
                price: { amount_minor: 980000, currency: "ETB" },
                available: false,
                position: 3,
                options: { Colour: "Terracotta" },
                value_ids: ["val-terracotta"],
              },
            ],
          }),
        );
        return;
      }

      if (companySlug === "ergoseat" && productSlug === "broken-preview") {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            id: "prod-broken",
            slug: "broken-preview",
            name: "Broken Preview Chair",
            description: "A product with a deliberately broken preview fixture.",
            category: { slug: "chairs", name: "Chairs" },
            company: { slug: "ergoseat", name: "ErgoSeat" },
            price: { amount_minor: 850000, currency: "ETB" },
            dimensions: { width_mm: 650, depth_mm: 600, height_mm: 1100 },
            weight_g: null,
            published_at: "2026-10-15T09:30:00Z",
            primary_image_url: "/v1/media/img-chair",
            images: [{
              id: "img-broken", kind: "image", url: "/v1/media/img-chair",
              content_type: "image/webp", size_bytes: 1024, width: 1200, height: 1200,
              alt_text: "Broken preview chair", position: 0, is_primary: true,
            }],
            model: {
              id: "mod-broken", kind: "model", url: "/v1/media/broken.glb",
              content_type: "model/gltf-binary", size_bytes: 9, position: 0,
              materials: [], variants: [],
            },
            options: [], variants: [],
          }),
        );
        return;
      }

      if (companySlug === "woodcraft" && productSlug === "zenith-dining-table") {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            id: "prod-3",
            slug: "zenith-dining-table",
            name: "Zenith Dining Table",
            description: "Solid oak dining table seating eight people.",
            category: { slug: "tables", name: "Tables" },
            company: { slug: "woodcraft", name: "WoodCraft" },
            price: { amount_minor: 2200000, currency: "ETB" },
            dimensions: { width_mm: 2000, depth_mm: 900, height_mm: 760 },
            weight_g: 45000,
            published_at: "2026-10-10T08:00:00Z",
            primary_image_url: null,
            images: [],
            model: null,
            options: [],
            variants: [],
          }),
        );
        return;
      }

      res.writeHead(404);
      res.end(
        JSON.stringify({
          error: { code: "not_found", message: "Product not found" },
        }),
      );
      return;
    }

    if (url.pathname === "/v1/catalog/products") {
      const q = url.searchParams.get("q")?.toLowerCase();
      const category = url.searchParams.get("category");
      const cursor = url.searchParams.get("cursor");

      // Simulated invalid cursor error
      if (cursor === "invalid-cursor") {
        res.writeHead(400);
        res.end(
          JSON.stringify({
            error: {
              code: "validation_failed",
              message: "check the highlighted fields",
              details: { cursor: "is invalid" },
              request_id: "mock-err-400",
            },
          }),
        );
        return;
      }

      // Simulated 500 error trigger
      if (q === "trigger-error") {
        res.writeHead(500);
        res.end(
          JSON.stringify({
            error: {
              code: "internal_error",
              message: "Simulated internal server error",
              request_id: "mock-err-500",
            },
          }),
        );
        return;
      }

      // Page 2 cursor response
      if (cursor === "page-2-cursor") {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            products: page2Products,
            next_cursor: null,
          }),
        );
        return;
      }

      // Filter products
      let filtered = [...allProducts];

      if (category) {
        filtered = filtered.filter((p) => p.category.slug === category);
      }

      if (q) {
        filtered = filtered.filter(
          (p) => p.name.toLowerCase().includes(q),
        );
      }

      const nextCursor =
        !cursor && !q && !category && filtered.length >= 3
          ? "page-2-cursor"
          : null;

      res.writeHead(200);
      res.end(
        JSON.stringify({
          products: filtered,
          next_cursor: nextCursor,
        }),
      );
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: { code: "not_found", message: "Not found" } }));
  });
}

// Start standalone if executed directly
if (process.argv[1]?.endsWith("mock-api.mjs")) {
  const server = createMockServer();
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`Mock Go API listening on http://127.0.0.1:${PORT}`);
  });
}
