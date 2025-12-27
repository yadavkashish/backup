import { useLoaderData, useFetcher } from "react-router";
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

/* ---------------- ACTION ---------------- */
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const reviewId = formData.get("reviewId");
  const reply = formData.get("reply");

  try {
    await db.review.update({
      where: { id: reviewId },
      data: { reply },
    });
    return { ok: true };
  } catch (err) {
    console.error("Reply Error:", err);
    return { ok: false, error: "Failed to save reply" };
  }
};

/* ---------------- PAGE ---------------- */
export default function AdminDashboard() {
  const { reviews } = useLoaderData();
  const fetcher = useFetcher();
  const [openProduct, setOpenProduct] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [tempReply, setTempReply] = useState("");

  const totalReviews = reviews.length;
  const avgRating = totalReviews === 0 
    ? "0.0" 
    : (reviews.reduce((a, r) => a + r.rating, 0) / totalReviews).toFixed(1);

  const currentMonth = new Date().getMonth();
  const reviewsThisMonth = reviews.filter(
    (r) => new Date(r.createdAt).getMonth() === currentMonth
  ).length;

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

  const handleSaveReply = (reviewId) => {
    fetcher.submit(
      { reviewId, reply: tempReply },
      { method: "POST" }
    );
    setReplyingTo(null);
    setTempReply("");
  };

  return (
    <div style={styles.container}>
      {/* ---------- HEADER ---------- */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Reviews Dashboard</h1>
          <p style={styles.subtitle}>Overview of your store's customer feedback and ratings.</p>
        </div>
      </header>

      {/* ---------- STATS ---------- */}
      <div style={styles.statsRow}>
        <StatCard label="Total Reviews" value={totalReviews} accent="#3b82f6" />
        <StatCard label="Average Rating" value={`${avgRating} / 5.0`} accent="#f59e0b" />
        <StatCard label="This Month" value={`+${reviewsThisMonth}`} accent="#10b981" />
      </div>

      {/* ---------- MAIN CARD ---------- */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Product Breakdown</h2>
          <span style={styles.badge}>{products.length} Products</span>
        </div>

        {products.length === 0 ? (
          <div style={styles.emptyState}>No reviews found yet.</div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span style={{ flex: 2 }}>Product</span>
              <span style={{ flex: 1, textAlign: 'center' }}>Rating</span>
              <span style={{ flex: 1, textAlign: 'right' }}>Action</span>
            </div>

            {products.map((p) => {
              const avg = p.reviews.reduce((a, r) => a + r.rating, 0) / p.reviews.length;
              const isOpen = openProduct === p.productId;

              return (
                <div key={p.productId} style={styles.rowWrapper}>
                  <div style={styles.productRow}>
                    <div style={{ flex: 2 }}>
                      <div style={styles.productName}>{p.productName}</div>
                      <div style={styles.productSub}>{p.reviews.length} total reviews</div>
                    </div>

                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={styles.ratingText}>
                        <span style={{ color: "#f59e0b" }}>★</span> {avg.toFixed(1)}
                      </div>
                    </div>

                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <button
                        style={isOpen ? styles.viewBtnActive : styles.viewBtn}
                        onClick={() => setOpenProduct(isOpen ? null : p.productId)}
                      >
                        {isOpen ? "Close" : "View Reviews"}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={styles.reviewList}>
                      {p.reviews.map((r) => (
                        <div key={r.id} style={styles.reviewItem}>
                          <div style={styles.reviewHeader}>
                            <span style={styles.author}>{r.author}</span>
                            <span style={styles.date}>{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div style={styles.starRow}>
                             {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                          </div>
                          <p style={styles.comment}>{r.comment}</p>

                          <div style={styles.replySection}>
                            {replyingTo === r.id ? (
                              <div style={styles.replyInputWrapper}>
                                <textarea
                                  style={styles.replyTextarea}
                                  value={tempReply}
                                  onChange={(e) => setTempReply(e.target.value)}
                                  placeholder="Write a public reply..."
                                />
                                <div style={styles.replyActions}>
                                  <button style={styles.saveBtn} onClick={() => handleSaveReply(r.id)}>
                                    {fetcher.state === "submitting" ? "Saving..." : "Save Reply"}
                                  </button>
                                  <button style={styles.cancelBtn} onClick={() => setReplyingTo(null)}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {r.reply ? (
                                  <div style={styles.existingReply}>
                                    <div style={styles.replyLabel}>Store Response:</div>
                                    <p style={styles.replyContent}>{r.reply}</p>
                                    <button 
                                      style={styles.editReplyBtn} 
                                      onClick={() => { setReplyingTo(r.id); setTempReply(r.reply); }}
                                    >Edit Reply</button>
                                  </div>
                                ) : (
                                  <button style={styles.replyBtn} onClick={() => { setReplyingTo(r.id); setTempReply(""); }}>
                                    Reply to review
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statAccent, backgroundColor: accent }} />
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

/* ---------------- LIGHT THEME STYLES ---------------- */
const styles = {
  container: {
    padding: "40px 80px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: "#f8fafc", // Light background
    color: "#0f172a", // Dark text
    minHeight: "100vh",
  },
  header: { marginBottom: "40px" },
  title: { fontSize: "32px", fontWeight: "800", margin: "0 0 8px 0", letterSpacing: "-0.5px", color: "#1e293b" },
  subtitle: { color: "#64748b", fontSize: "16px", margin: 0 },
  statsRow: { display: "flex", gap: "24px", marginBottom: "48px" },
  statCard: {
    position: "relative",
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    flex: 1,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },
  statAccent: { position: "absolute", top: 0, left: 0, width: "4px", height: "100%" },
  statLabel: { color: "#64748b", fontSize: "14px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
  statValue: { fontSize: "32px", fontWeight: "700", marginTop: "8px", color: "#0f172a" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  cardHeader: {
    padding: "24px 32px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: "20px", fontWeight: "600", margin: 0, color: "#1e293b" },
  badge: { backgroundColor: "#f1f5f9", color: "#475569", padding: "4px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: "600" },
  table: { width: "100%" },
  tableHeader: {
    display: "flex",
    padding: "16px 32px",
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px",
    borderBottom: "1px solid #f1f5f9",
  },
  rowWrapper: { borderBottom: "1px solid #f1f5f9" },
  productRow: { display: "flex", padding: "24px 32px", alignItems: "center" },
  productName: { fontSize: "16px", fontWeight: "600", color: "#1e293b" },
  productSub: { fontSize: "13px", color: "#94a3b8", marginTop: "4px" },
  ratingText: { fontSize: "16px", fontWeight: "600", color: "#1e293b" },
  viewBtn: {
    backgroundColor: "transparent",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  viewBtnActive: {
    backgroundColor: "#1e293b",
    color: "#ffffff",
    border: "1px solid #1e293b",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  reviewList: { backgroundColor: "#f8fafc", padding: "0 32px 24px 32px" },
  reviewItem: { padding: "20px 0", borderBottom: "1px solid #e2e8f0" },
  reviewHeader: { display: "flex", justifyContent: "space-between", marginBottom: "4px" },
  author: { fontWeight: "600", color: "#1e293b", fontSize: "14px" },
  date: { fontSize: "12px", color: "#94a3b8" },
  starRow: { color: "#f59e0b", fontSize: "12px", marginBottom: "8px" },
  comment: { fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: "0 0 16px 0" },
  emptyState: { padding: "48px", textAlign: "center", color: "#94a3b8" },
  
  replySection: { marginTop: "12px" },
  replyBtn: {
    backgroundColor: "transparent",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600"
  },
  existingReply: {
    padding: "12px 16px",
    backgroundColor: "#f1f5f9",
    borderRadius: "8px",
    borderLeft: "3px solid #3b82f6"
  },
  replyLabel: { fontSize: "11px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase", marginBottom: "4px" },
  replyContent: { fontSize: "14px", color: "#334155", margin: "0 0 8px 0", fontStyle: "italic" },
  editReplyBtn: { background: "none", border: "none", color: "#94a3b8", fontSize: "12px", cursor: "pointer", padding: 0, textDecoration: "underline" },
  replyInputWrapper: { display: "flex", flexDirection: "column", gap: "10px" },
  replyTextarea: {
    width: "100%",
    minHeight: "80px",
    backgroundColor: "#ffffff",
    color: "#1e293b",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "14px",
    outline: "none"
  },
  replyActions: { display: "flex", gap: "10px" },
  saveBtn: { backgroundColor: "#2563eb", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" },
  cancelBtn: { backgroundColor: "transparent", color: "#64748b", border: "none", cursor: "pointer", fontSize: "14px" }
};