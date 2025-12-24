import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useState } from "react";

/* ---------------- LOADER ---------------- */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop.replace(/\/$/, "");

  const reviews = await db.review.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });

  return { reviews };
};

/* ---------------- PAGE ---------------- */
export default function AdminDashboard() {
  const { reviews } = useLoaderData();
  const [openProduct, setOpenProduct] = useState(null);

  /* ---------- GLOBAL STATS ---------- */
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews === 0
      ? "0.0"
      : (
          reviews.reduce((a, r) => a + r.rating, 0) / totalReviews
        ).toFixed(1);

  const currentMonth = new Date().getMonth();
  const reviewsThisMonth = reviews.filter(
    (r) => new Date(r.createdAt).getMonth() === currentMonth
  ).length;

  /* ---------- GROUP BY PRODUCT ---------- */
  const productsMap = reviews.reduce((acc, r) => {
    if (!acc[r.productId]) {
      acc[r.productId] = {
        productId: r.productId,
        productName: r.productName || "Unnamed product",
        reviews: [],
      };
    }
    acc[r.productId].reviews.push(r);
    return acc;
  }, {});

  const products = Object.values(productsMap);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Reviews Dashboard</h1>

      {/* ---------- STATS ---------- */}
      <div style={styles.statsRow}>
        <StatCard label="Total Reviews" value={totalReviews} />
        <StatCard label="Average Rating" value={`${avgRating} ★`} />
        <StatCard label="Reviews This Month" value={reviewsThisMonth} />
      </div>

      {/* ---------- PRODUCTS ---------- */}
      <div style={styles.card}>
        <h2 style={{ marginBottom: 16 }}>Products</h2>

        {products.length === 0 && (
          <p style={styles.muted}>No reviews yet</p>
        )}

        {products.map((p) => {
          const avg =
            p.reviews.reduce((a, r) => a + r.rating, 0) /
            p.reviews.length;

          return (
            <div key={p.productId} style={styles.productRow}>
              <div>
                <strong>{p.productName}</strong>
                <div style={styles.muted}>
                  {p.reviews.length} review
                  {p.reviews.length !== 1 ? "s" : ""}
                </div>
              </div>

              <div style={{ color: "#facc15" }}>
                {"★".repeat(Math.round(avg))}
                {"☆".repeat(5 - Math.round(avg))}{" "}
                {avg.toFixed(1)}
              </div>

              <button
                style={styles.viewBtn}
                onClick={() =>
                  setOpenProduct(
                    openProduct === p.productId
                      ? null
                      : p.productId
                  )
                }
              >
                {openProduct === p.productId ? "Hide" : "View"}
              </button>

              {/* ---------- EXPANDED REVIEWS ---------- */}
              {openProduct === p.productId && (
                <div style={styles.reviewList}>
                  {p.reviews.map((r) => (
                    <div key={r.id} style={styles.reviewItem}>
                      <strong>{r.author}</strong>
                      <div style={{ color: "#facc15" }}>
                        {"★".repeat(r.rating)}
                        {"☆".repeat(5 - r.rating)}
                      </div>
                      <p style={{ marginTop: 4 }}>{r.comment}</p>
                      <span style={styles.muted}>
                        {new Date(r.createdAt).toDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  container: {
    padding: 32,
    fontFamily: "Arial, sans-serif",
    background: "#f9fafb",
    minHeight: "100vh",
  },
  title: {
    fontSize: 28,
    marginBottom: 24,
  },
  statsRow: {
    display: "flex",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: "#fff",
    padding: 20,
    borderRadius: 8,
    flex: 1,
    border: "1px solid #e5e7eb",
  },
  statLabel: {
    color: "#6b7280",
    fontSize: 14,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 6,
  },
  card: {
    background: "#fff",
    padding: 24,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
  },
  productRow: {
    borderBottom: "1px solid #e5e7eb",
    padding: "16px 0",
    display: "grid",
    gridTemplateColumns: "2fr 1fr 80px",
    gap: 16,
    alignItems: "center",
  },
  viewBtn: {
    background: "#0f766e",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
  },
  reviewList: {
    gridColumn: "1 / -1",
    background: "#f9fafb",
    padding: 16,
    borderRadius: 6,
    marginTop: 12,
  },
  reviewItem: {
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 12,
    marginBottom: 12,
  },
  muted: {
    fontSize: 12,
    color: "#6b7280",
  },
};
