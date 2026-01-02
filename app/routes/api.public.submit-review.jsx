import db from "../db.server";

/* -------------------------------------------------
   OPTIONS (CORS PREFLIGHT)
-------------------------------------------------- */
export async function loader({ request }) {
  // Define standard CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // 1. Handle Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 2. Handle the actual GET request (fetching reviews)
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const shop = url.searchParams.get("shop");

  if (!productId || !shop) {
    return new Response(JSON.stringify({ error: "Missing params" }), { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  try {
    const reviews = await db.review.findMany({
      where: { productId, shop: shop.replace(/\/$/, "") },
      orderBy: { createdAt: "desc" },
    });

    return new Response(JSON.stringify(reviews), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response("Internal Error", { status: 500, headers: corsHeaders });
  }
}

/* -------------------------------------------------
   SUBMIT REVIEW
-------------------------------------------------- */
export async function action({ request }) {
  let body;

  try {
    body = await request.json();
  } catch (err) {
    console.error("❌ Invalid JSON", err);
    return new Response("Invalid JSON", { status: 400 });
  }

  const {
    shop,
    productId,
    productName,
    rating,
    comment,
    author,
  } = body || {};

  /* ---------- VALIDATION ---------- */
  if (!shop || !productId || !rating || !comment) {
    console.error("❌ Missing fields", body);
    return new Response("Missing fields", { status: 400 });
  }

  try {
    await db.review.create({
      data: {
        shop: shop.replace(/\/$/, ""),
        productId,
        productName: productName || "Unknown product", // ✅ fallback
        rating: Number(rating),
        comment,
        author: author?.trim() || "Anonymous",
        status: "PUBLISHED", // ✅ instant publish
      },
    });

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("❌ DB ERROR", err);
    return new Response("Database error", { status: 500 });
  }
}
