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

export function createMockServer() {
  const accounts = new Map([[demoAccount.user.email, demoAccount]]);
  const sessions = new Map();
  let nextSession = 1;

  function issueSession(res, account, mode = "normal") {
    const token = `mock-session-${nextSession++}`;
    sessions.set(token, { account, mode });
    res.setHeader(
      "Set-Cookie",
      `interior_session=${token}; Path=/; HttpOnly; SameSite=Lax`,
    );
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
                id: "var-grey",
                sku: "ERGO-GREY",
                price: { amount_minor: 850000, currency: "ETB" },
                available: true,
                position: 1,
                options: { Colour: "Grey" },
                value_ids: ["val-grey"],
              },
              {
                id: "var-blue",
                sku: "ERGO-BLUE",
                price: { amount_minor: 920000, currency: "ETB" },
                available: true,
                position: 2,
                options: { Colour: "Blue" },
                value_ids: ["val-blue"],
              },
              {
                id: "var-terracotta",
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
