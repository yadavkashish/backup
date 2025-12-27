import { useLoaderData } from "react-router";
import { Star, CheckCircle, ShoppingBag, MessageCircle, TrendingUp } from "lucide-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

/* ---------------- LOADER (Server Side) ---------------- */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop.replace(/\/$/, "");

  const reviews = await db.review.findMany({
    where: { 
      shop: shop, 
      status: "PUBLISHED" 
    },
    orderBy: { createdAt: "desc" },
  });

  return { reviews };
};

/* ---------------- PAGE COMPONENT ---------------- */
export default function HomePage() {
  const { reviews } = useLoaderData();

  const avg = reviews.length > 0
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div style={styles.container}>
      <div style={styles.mainWrapper}>
        
        {/* HEADER / STATS CARD */}
        <div style={styles.statsCard}>
          <div style={styles.statsContent}>
            <div>
              <h1 style={styles.title}>Customer Insights</h1>
              <p style={styles.subtitle}>Real-time overview of your store's public feedback.</p>
            </div>
            
            <div style={styles.ratingBox}>
              <div style={styles.ratingScore}>{avg}</div>
              <div style={styles.ratingMeta}>
                <div style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={18}
                      fill={i <= Math.round(avg) ? "#f59e0b" : "none"}
                      color={i <= Math.round(avg) ? "#f59e0b" : "#cbd5e1"}
                    />
                  ))}
                </div>
                <div style={styles.totalLabel}>
                    <TrendingUp size={12} style={{marginRight: 4}} />
                    {reviews.length} Total Reviews
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS LIST */}
        <div style={styles.listContainer}>
          <h3 style={styles.sectionTitle}>Recent Activity</h3>
          {reviews.length === 0 ? (
            <div style={styles.emptyCard}>No published reviews found.</div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} style={styles.reviewCard}>
                <div style={styles.reviewMain}>
                  <div style={styles.authorSection}>
                    <div style={styles.avatar}>{r.author ? r.author.charAt(0) : "A"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.authorHeader}>
                        <span style={styles.authorName}>{r.author || "Anonymous"}</span>
                        <span style={styles.verifiedBadge}>
                          <CheckCircle size={10} /> Verified
                        </span>
                      </div>
                      <div style={styles.productLink}>
                        <ShoppingBag size={12} /> {r.productName || "Product"}
                      </div>
                    </div>
                    <span style={styles.dateText}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={styles.starRowSmall}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        fill={i <= r.rating ? "#f59e0b" : "none"} 
                        color={i <= r.rating ? "#f59e0b" : "#e2e8f0"} 
                      />
                    ))}
                  </div>

                  <p style={styles.commentText}>{r.comment}</p>

                  {/* ADMIN REPLY SECTION */}
                  {r.reply && (
                    <div style={styles.replyBox}>
                      <div style={styles.replyHeader}>
                        <MessageCircle size={14} />
                        <span>Store Response</span>
                      </div>
                      <p style={styles.replyContent}>{r.reply}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- LIGHT THEME STYLES ---------------- */
const styles = {
  container: {
    fontFamily: "'Inter', -apple-system, sans-serif",
    backgroundColor: "#f8fafc", // Slate 50
    color: "#0f172a", // Slate 900
    minHeight: "100vh",
    padding: "60px 20px",
  },
  mainWrapper: {
    maxWidth: "850px",
    margin: "0 auto",
  },
  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.03)",
    marginBottom: "48px",
    border: "1px solid #e2e8f0", 
  },
  statsContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "24px",
  },
  title: { fontSize: "30px", fontWeight: "800", margin: "0 0 8px 0", letterSpacing: "-0.5px", color: "#1e293b" },
  subtitle: { color: "#64748b", fontSize: "16px", margin: 0 },
  ratingBox: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    backgroundColor: "#f1f5f9", // Slate 100
    padding: "20px 28px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
  },
  ratingScore: { fontSize: "48px", fontWeight: "800", color: "#0f172a" },
  ratingMeta: { display: "flex", flexDirection: "column", gap: "6px" },
  starsRow: { display: "flex", gap: "3px" },
  totalLabel: { 
    fontSize: "13px", 
    color: "#64748b", 
    fontWeight: "600", 
    display: "flex", 
    alignItems: "center" 
  },
  sectionTitle: { fontSize: "12px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" },
  listContainer: { display: "flex", flexDirection: "column", gap: "20px" },
  emptyCard: { textAlign: "center", padding: "60px", color: "#94a3b8", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px dashed #e2e8f0" },
  reviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    transition: "transform 0.2s ease",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
  },
  reviewMain: { padding: "28px" },
  authorSection: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" },
  avatar: {
    width: "44px", height: "44px", borderRadius: "12px",
    backgroundColor: "#3b82f6", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "700", fontSize: "18px",
  },
  authorHeader: { display: "flex", alignItems: "center", gap: "10px" },
  authorName: { fontWeight: "700", fontSize: "16px", color: "#1e293b" },
  verifiedBadge: {
    display: "flex", alignItems: "center", gap: "4px",
    fontSize: "10px", fontWeight: "700", color: "#059669",
    backgroundColor: "#ecfdf5", padding: "2px 8px", borderRadius: "6px",
    textTransform: "uppercase",
  },
  productLink: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", marginTop: "4px" },
  dateText: { fontSize: "13px", color: "#94a3b8", marginLeft: "auto" },
  starRowSmall: { display: "flex", gap: "3px", marginBottom: "14px" },
  commentText: { fontSize: "15px", lineHeight: "1.7", color: "#475569", margin: "0 0 20px 0" },
  replyBox: { 
    backgroundColor: "#f8fafc", 
    borderLeft: "4px solid #3b82f6", 
    borderRadius: "8px", 
    padding: "16px 20px", 
    marginTop: "10px",
    border: "1px solid #e2e8f0",
    borderLeftWidth: "4px"
  },
  replyHeader: { 
    display: "flex", 
    alignItems: "center", 
    gap: "8px", 
    fontSize: "11px", 
    fontWeight: "800", 
    color: "#2563eb", 
    textTransform: "uppercase", 
    letterSpacing: "0.5px",
    marginBottom: "8px" 
  },
  replyContent: { fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.6", fontStyle: "italic" },
};