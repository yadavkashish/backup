import db from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const shop = url.searchParams.get("shop")?.replace(/\/$/, "");

  if (!productId || !shop) {
    return new Response("Missing params", { status: 400 });
  }

  const reviews = await db.review.findMany({
    where: {
      productId,
      shop,
      status: "PUBLISHED",
    },
    orderBy: { createdAt: "desc" },
  });

  return new Response(JSON.stringify(reviews), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
