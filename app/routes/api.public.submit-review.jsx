import db from "../db.server";

export const action = async ({ request }) => {
  const body = await request.json();

  await db.review.create({
    data: {
      shop: body.shop,
      productId: body.productId,
      rating: body.rating,
      comment: body.comment,
      author: body.author || "Anonymous",
      status: "PENDING"
    }
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    }
  });
};
