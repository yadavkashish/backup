// app/routes/api.public.reviews.jsx
import db from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const shop = url.searchParams.get("shop")?.replace(/\/$/, "");

  if (!productId || !shop) {
    return new Response("Missing params", { status: 400 });
  }

  const reviews = await db.review.findMany({
    where: {
      productId: String(productId),
      shop: shop,
      status: "PUBLISHED",
    },
    // This is the critical part you are likely missing:
    select: {
      id: true,
      author: true,
      rating: true,
      comment: true,
      createdAt: true,
      reply: true,     // <--- MAKE SURE THIS IS HERE
      replyDate: true, // <--- Add this if you want to show when you replied
    },
    orderBy: { createdAt: "desc" },
  });

  return new Response(JSON.stringify(reviews), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Required for Shopify storefront access
    },
  });
}