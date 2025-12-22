// app/routes/api.public.reviews.ts
import db from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  const productId = url.searchParams.get("productId");
  const shop = url.searchParams.get("shop");

  const reviews = await db.review.findMany({
    where: {
      productId,
      shop,
      status: "PUBLISHED"
    },
    orderBy: { createdAt: "desc" }
  });

  return Response.json(reviews);
};
