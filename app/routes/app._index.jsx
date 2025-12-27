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
                      fill={i <= Math.round(avg) ? "#facc15" : "none"}
                      color={i <= Math.round(avg) ? "#facc15" : "#475569"}
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
                        fill={i <= r.rating ? "#facc15" : "none"} 
                        color={i <= r.rating ? "#facc15" : "#475569"} 
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

/* ---------------- STYLES ---------------- */
const styles = {
  container: {
    fontFamily: "'Inter', -apple-system, sans-serif",
    backgroundColor: "#0f172a", // Slate 900
    color: "#f8fafc", // Slate 50
    minHeight: "100vh",
    padding: "60px 20px",
  },
  mainWrapper: {
    maxWidth: "850px",
    margin: "0 auto",
  },
  statsCard: {
    backgroundColor: "#1e293b", // Slate 800
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
    marginBottom: "48px",
    border: "1px solid #334155", // Slate 700
  },
  statsContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "24px",
  },
  title: { fontSize: "30px", fontWeight: "800", margin: "0 0 8px 0", letterSpacing: "-0.5px" },
  subtitle: { color: "#94a3b8", fontSize: "16px", margin: 0 },
  ratingBox: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    backgroundColor: "#0f172a",
    padding: "20px 28px",
    borderRadius: "16px",
    border: "1px solid #334155",
  },
  ratingScore: { fontSize: "48px", fontWeight: "800", color: "#fff" },
  ratingMeta: { display: "flex", flexDirection: "column", gap: "6px" },
  starsRow: { display: "flex", gap: "3px" },
  totalLabel: { 
    fontSize: "13px", 
    color: "#64748b", 
    fontWeight: "600", 
    display: "flex", 
    alignItems: "center" 
  },
  sectionTitle: { fontSize: "14px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" },
  listContainer: { display: "flex", flexDirection: "column", gap: "20px" },
  emptyCard: { textAlign: "center", padding: "60px", color: "#64748b", backgroundColor: "#1e293b", borderRadius: "16px", border: "1px dashed #334155" },
  reviewCard: {
    backgroundColor: "#1e293b",
    borderRadius: "16px",
    border: "1px solid #334155",
    transition: "transform 0.2s ease",
  },
  reviewMain: { padding: "28px" },
  authorSection: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" },
  avatar: {
    width: "44px", height: "44px", borderRadius: "12px",
    backgroundColor: "#3b82f6", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "700", fontSize: "18px",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
  },
  authorHeader: { display: "flex", alignItems: "center", gap: "10px" },
  authorName: { fontWeight: "700", fontSize: "16px", color: "#f1f5f9" },
  verifiedBadge: {
    display: "flex", alignItems: "center", gap: "4px",
    fontSize: "10px", fontWeight: "700", color: "#10b981",
    backgroundColor: "rgba(16, 185, 129, 0.1)", padding: "2px 8px", borderRadius: "6px",
    textTransform: "uppercase",
  },
  productLink: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#94a3b8", marginTop: "4px" },
  dateText: { fontSize: "13px", color: "#475569", marginLeft: "auto" },
  starRowSmall: { display: "flex", gap: "3px", marginBottom: "14px" },
  commentText: { fontSize: "15px", lineHeight: "1.7", color: "#cbd5e1", margin: "0 0 20px 0" },
  replyBox: { 
    backgroundColor: "#0f172a", 
    borderLeft: "4px solid #3b82f6", 
    borderRadius: "8px", 
    padding: "16px 20px", 
    marginTop: "10px" 
  },
  replyHeader: { 
    display: "flex", 
    alignItems: "center", 
    gap: "8px", 
    fontSize: "11px", 
    fontWeight: "800", 
    color: "#3b82f6", 
    textTransform: "uppercase", 
    letterSpacing: "0.5px",
    marginBottom: "8px" 
  },
  replyContent: { fontSize: "14px", color: "#94a3b8", margin: 0, lineHeight: "1.6", fontStyle: "italic" },
};