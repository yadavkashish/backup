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

/* ---------------- ACTION (Handle Replies) ---------------- */
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

  /* ---------- GLOBAL STATS ---------- */
  const totalReviews = reviews.length;
  const avgRating = totalReviews === 0 
    ? "0.0" 
    : (reviews.reduce((a, r) => a + r.rating, 0) / totalReviews).toFixed(1);

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
                        <span style={{ color: "#facc15" }}>★</span> {avg.toFixed(1)}
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

                  {/* ---------- EXPANDED REVIEWS ---------- */}
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

                          {/* ---------- REPLY SECTION ---------- */}
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

/* ---------------- COMPONENTS ---------------- */

function StatCard({ label, value, accent }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statAccent, backgroundColor: accent }} />
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  container: {
    padding: "40px 80px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    minHeight: "100vh",
  },
  header: { marginBottom: "40px" },
  title: { fontSize: "32px", fontWeight: "800", margin: "0 0 8px 0", letterSpacing: "-0.5px" },
  subtitle: { color: "#94a3b8", fontSize: "16px", margin: 0 },
  statsRow: { display: "flex", gap: "24px", marginBottom: "48px" },
  statCard: {
    position: "relative",
    backgroundColor: "#1e293b",
    padding: "24px",
    borderRadius: "12px",
    flex: 1,
    border: "1px solid #334155",
    overflow: "hidden",
  },
  statAccent: { position: "absolute", top: 0, left: 0, width: "4px", height: "100%" },
  statLabel: { color: "#94a3b8", fontSize: "14px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" },
  statValue: { fontSize: "32px", fontWeight: "700", marginTop: "8px", color: "#fff" },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: "16px",
    border: "1px solid #334155",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
  },
  cardHeader: {
    padding: "24px 32px",
    borderBottom: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: "20px", fontWeight: "600", margin: 0 },
  badge: { backgroundColor: "#334155", color: "#cbd5e1", padding: "4px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: "500" },
  table: { width: "100%" },
  tableHeader: {
    display: "flex",
    padding: "16px 32px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px",
    borderBottom: "1px solid #334155",
  },
  rowWrapper: { borderBottom: "1px solid #334155" },
  productRow: { display: "flex", padding: "24px 32px", alignItems: "center" },
  productName: { fontSize: "16px", fontWeight: "600", color: "#f1f5f9" },
  productSub: { fontSize: "13px", color: "#64748b", marginTop: "4px" },
  ratingText: { fontSize: "16px", fontWeight: "600" },
  viewBtn: {
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "1px solid #475569",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  viewBtnActive: {
    backgroundColor: "#f1f5f9",
    color: "#0f172a",
    border: "1px solid #f1f5f9",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  reviewList: { backgroundColor: "#0f172a", padding: "0 32px 24px 32px" },
  reviewItem: { padding: "20px 0", borderBottom: "1px solid #1e293b" },
  reviewHeader: { display: "flex", justifyContent: "space-between", marginBottom: "4px" },
  author: { fontWeight: "600", color: "#f1f5f9", fontSize: "14px" },
  date: { fontSize: "12px", color: "#475569" },
  starRow: { color: "#facc15", fontSize: "12px", marginBottom: "8px" },
  comment: { fontSize: "14px", color: "#94a3b8", lineHeight: "1.6", margin: "0 0 16px 0" },
  emptyState: { padding: "48px", textAlign: "center", color: "#64748b" },
  
  /* Reply Styles */
  replySection: { marginTop: "12px" },
  replyBtn: {
    backgroundColor: "transparent",
    color: "#3b82f6",
    border: "1px solid #3b82f6",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600"
  },
  existingReply: {
    padding: "12px 16px",
    backgroundColor: "#1e293b",
    borderRadius: "8px",
    borderLeft: "3px solid #3b82f6"
  },
  replyLabel: { fontSize: "11px", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase", marginBottom: "4px" },
  replyContent: { fontSize: "14px", color: "#cbd5e1", margin: "0 0 8px 0", fontStyle: "italic" },
  editReplyBtn: { background: "none", border: "none", color: "#64748b", fontSize: "12px", cursor: "pointer", padding: 0, textDecoration: "underline" },
  replyInputWrapper: { display: "flex", flexDirection: "column", gap: "10px" },
  replyTextarea: {
    width: "100%",
    minHeight: "80px",
    backgroundColor: "#1e293b",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "14px",
    outline: "none"
  },
  replyActions: { display: "flex", gap: "10px" },
  saveBtn: { backgroundColor: "#3b82f6", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" },
  cancelBtn: { backgroundColor: "transparent", color: "#94a3b8", border: "none", cursor: "pointer", fontSize: "14px" }
};