import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { Star, CheckCircle, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

/* ---------------- LOADER ---------------- */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const reviews = await db.review.findMany({
    where: { shop: session.shop, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });

  return { reviews };
};

/* ---------------- PAGE ---------------- */
export default function HomePage() {
  const { reviews } = useLoaderData();

  const avg =
    (
      reviews.reduce((a, r) => a + r.rating, 0) /
      (reviews.length || 1)
    ).toFixed(1);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* HEADER */}
        <div style={styles.header}>
          <h2 style={styles.title}>Customer Reviews</h2>

          <div style={styles.flexRow}>
            <div style={styles.ratingBlock}>
              <div style={styles.ratingBig}>{avg}</div>
              <div style={styles.starsWrapper}>
                {[1,2,3,4,5].map(i => (
                  <Star
                    key={i}
                    size={20}
                    fill={i <= Math.round(avg) ? "currentColor" : "none"}
                  />
                ))}
              </div>
            </div>

           
          </div>
        </div>

        {/* REVIEWS */}
        {reviews.map(r => (
          <div key={r.id} style={styles.reviewItem}>
            <div style={styles.avatar}>{r.author.charAt(0)}</div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong>{r.author}</strong>
                  <span style={styles.verifiedBadge}>
                    <CheckCircle size={12}/> Verified
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div style={{ display: "flex", gap: 2, color: "#facc15" }}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={14} fill={i <= r.rating ? "currentColor" : "none"} />
                ))}
              </div>

              <p style={{ marginTop: 8 }}>{r.comment}</p>

              <div style={{ fontSize: 12, color: "#6b7280", display: "flex", gap: 4 }}>
                <ShoppingBag size={12}/> {r.productName}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  container: {
    fontFamily: "sans-serif",
    color: "#1e293b",
    padding: "24px",
    backgroundColor: "#f3f4f6",
    minHeight: "100vh",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #f3f4f6",
    maxWidth: "896px",
    margin: "0 auto",
    overflow: "hidden",
  },

  header: {
    padding: "32px",
    borderBottom: "1px solid #f3f4f6",
  },

  title: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "24px",
  },

  flexRow: {
    display: "flex",
    gap: "32px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  ratingBlock: {
    textAlign: "center",
    minWidth: "140px",
  },

  ratingBig: {
    fontSize: "48px",
    fontWeight: "700",
  },

  starsWrapper: {
    display: "flex",
    gap: "4px",
    justifyContent: "center",
    color: "#facc15",
  },

  buttonPrimary: {
    backgroundColor: "#0f172a",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
  },

  reviewItem: {
    padding: "24px 32px",
    borderBottom: "1px solid #f3f4f6",
    display: "flex",
    gap: "16px",
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  verifiedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#16a34a",
    backgroundColor: "#f0fdf4",
    padding: "2px 8px",
    borderRadius: "9999px",
  },
};
