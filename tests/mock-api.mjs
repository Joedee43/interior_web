import http from "node:http";

const PORT = Number(process.env.MOCK_API_PORT || 5055);

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
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("x-request-id", "mock-req-" + Math.random().toString(36).substring(2, 8));

    if (url.pathname === "/health" || url.pathname === "/v1/health") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "API is running" }));
      return;
    }

    if (url.pathname === "/v1/catalog/categories") {
      res.writeHead(200);
      res.end(JSON.stringify({ categories }));
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
            primary_image_url: "/v1/media/img-chair",
            images: [
              {
                id: "img-chair-1",
                url: "/v1/media/img-chair",
                alt_text: "Ergo Task Chair Front",
                position: 1,
                is_primary: true,
              },
              {
                id: "img-chair-2",
                url: "/v1/media/img-chair-side",
                alt_text: "Ergo Task Chair Side Profile",
                position: 2,
                is_primary: false,
              },
            ],
            model: {
              id: "mod-chair",
              url: "/v1/media/chair.glb",
              size_bytes: 2048,
              materials: ["mesh", "plastic"],
              variants: ["grey", "blue"],
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
                  },
                  {
                    id: "val-blue",
                    name: "Blue",
                    position: 2,
                    swatch_hex: "#0000ff",
                  },
                  {
                    id: "val-terracotta",
                    name: "Terracotta",
                    position: 3,
                    swatch_hex: "#d97706",
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
