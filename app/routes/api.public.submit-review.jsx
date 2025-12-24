import db from "../db.server";

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  return new Response("Not found", { status: 404 });
}

export async function action({ request }) {
  let body;

  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { shop, productId, productName, rating, comment, author } = body || {};

  if (!shop || !productId || !rating || !comment) {
    return new Response("Missing fields", { status: 400 });
  }

  try {
    await db.review.create({
      data: {
        shop: shop.replace(/\/$/, ""),
        productId,
        productName: productName || null,
        rating: Number(rating),
        comment,
        author: author || "Anonymous",
        status: "PUBLISHED",
      },
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("❌ DB ERROR", err);
    return new Response("Database error", { status: 500 });
  }
}
