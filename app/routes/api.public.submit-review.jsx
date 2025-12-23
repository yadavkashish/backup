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

  return new Response("Not Found", { status: 404 });
}

export async function action({ request }) {
  try {
    const body = await request.json();

    if (!body.shop || !body.productId) {
      return new Response("Missing data", { status: 400 });
    }

    await db.review.create({
      data: {
        shop: body.shop.replace(/\/$/, ""),
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
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("SUBMIT ERROR:", err);
    return new Response("Server error", { status: 500 });
  }
}
