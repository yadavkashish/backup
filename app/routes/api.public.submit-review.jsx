import db from "../db.server";

export const action = async ({ request }) => {
  const body = await request.json();

  const shop = body.shop
    ?.replace(/^https?:\/\//, "")
    ?.replace(/\/$/, "");

  await db.review.create({
    data: {
      shop,
      productId: body.productId,
      rating: Number(body.rating),
      comment: body.comment,
      author: body.author || "Anonymous",
      status: "PENDING",
    },
  });

  return Response.json({ ok: true });
};
