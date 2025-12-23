import { useLoaderData, useSubmit } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const shop = session.shop.replace(/\/$/, "");

  const reviews = await db.review.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });

  return { reviews };
};

export const action = async ({ request }) => {
  const fd = await request.formData();

  await db.review.update({
    where: { id: fd.get("id") },
    data: { status: fd.get("status") },
  });

  return null;
};

export default function AdminDashboard() {
  const { reviews } = useLoaderData();
  const submit = useSubmit();

  return (
    <div style={{ padding: 30 }}>
      <h2>Review Moderation</h2>

      {reviews.length === 0 && <p>No reviews yet</p>}

      {reviews.map((r) => (
        <div key={r.id} style={{ marginBottom: 12 }}>
          ⭐ {r.rating} — {r.comment}
          <div>Status: {r.status}</div>

          {r.status !== "PUBLISHED" && (
            <button
              onClick={() => {
                const fd = new FormData();
                fd.append("id", r.id);
                fd.append("status", "PUBLISHED");
                submit(fd, { method: "post" });
              }}
            >
              Publish
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
