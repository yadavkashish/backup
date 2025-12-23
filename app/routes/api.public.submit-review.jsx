import db from "../db.server";

export const action = async ({ request }) => {
  // ✅ Handle CORS preflight
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

  // ❌ Reject non-POST safely
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response("Invalid JSON body", { status: 400 });
  }

  await db.review.create({
    data: {
      shop: body.shop,
      productId: body.productId,
      rating: Number(body.rating),
      comment: body.comment,
      author: body.author || "Anonymous",
      status: "PENDING",
    },
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
