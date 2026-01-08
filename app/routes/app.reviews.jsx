import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { 
  Star, 
  X, 
  MessageSquare, 
  ChevronRight, 
  Edit2, 
  Send,
  User,
  CheckCircle,
  TrendingUp,
  Inbox
} from "lucide-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// --- LOADER ---
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop.replace(/\/$/, "");
  
  const reviews = await db.review.findMany({ 
    where: { shop }, 
    orderBy: { createdAt: "desc" } 
  });

  // --- 1. Global Metrics Calculation ---
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) 
    : "0.0";

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const reviewsThisMonth = reviews.filter(r => new Date(r.createdAt) >= firstDayOfMonth).length;
  const reviewsLastMonth = reviews.filter(r => {
    const d = new Date(r.createdAt);
    return d >= firstDayOfLastMonth && d < firstDayOfMonth;
  }).length;

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const reviewsGrowth = calculateGrowth(reviewsThisMonth, reviewsLastMonth);
  // Example growth for total reviews (simplified)
  const totalGrowth = 12.5; 

  // --- 2. Group Reviews by Product ---
  const grouped = reviews.reduce((acc, review) => {
    const key = review.productName || "Unknown Product";
    if (!acc[key]) {
      acc[key] = { 
        productName: key, 
        productImage: review.productImage, 
        reviews: [], 
        totalRating: 0 
      };
    }
    acc[key].reviews.push(review);
    acc[key].totalRating += review.rating;
    return acc;
  }, {});

  const products = Object.values(grouped).map(p => ({
    ...p,
    avgRating: (p.totalRating / p.reviews.length).toFixed(1),
    reviewCount: p.reviews.length,
    latestDate: p.reviews[0].createdAt
  }));

  return { 
    products, 
    stats: {
      totalReviews,
      avgRating,
      reviewsThisMonth,
      reviewsGrowth,
      totalGrowth
    }
  };
};

// --- ACTION ---
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const reviewId = formData.get("reviewId");
  const reply = formData.get("reply");
  
  await db.review.update({ 
    where: { id: reviewId }, 
    data: { reply, replyDate: new Date() } 
  });
  return { ok: true };
};

// --- MAIN COMPONENT ---
export default function ReviewsManagement() {
  const { products, stats } = useLoaderData();
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div style={styles.container}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0' }}>Reviews Management</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Monitor and manage your customer feedback.</p>
      </header>

      {/* --- TOP METRICS CARDS --- */}
      <div style={styles.statsGrid}>
        <StatCard 
          title="Total Reviews" 
          value={stats.totalReviews.toLocaleString()} 
          icon={<Inbox size={20} color="#3b82f6" />} 
          subtitle={`${stats.totalGrowth > 0 ? '+' : ''}${stats.totalGrowth}% vs last month`}
          trend={stats.totalGrowth >= 0 ? "up" : "down"}
        />
        <StatCard 
          title="Average Rating" 
          value={stats.avgRating} 
          isRating={true}
          icon={<Star size={20} color="#f59e0b" fill="#f59e0b" />} 
          subtitle="Based on all reviews"
        />
        <StatCard 
          title="Reviews This Month" 
          value={stats.reviewsThisMonth.toLocaleString()} 
          icon={<TrendingUp size={20} color="#10b981" />} 
          subtitle={`${stats.reviewsGrowth >= 0 ? '+' : ''}${stats.reviewsGrowth}% vs last month`}
          trend={stats.reviewsGrowth >= 0 ? "up" : "down"}
        />
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Product Breakdown</h2>
      
      <div style={styles.tableCard}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr style={{ textAlign: 'left' }}>
              <th style={styles.th}>PRODUCT NAME</th>
              <th style={styles.th}>AVG RATING</th>
              <th style={styles.th}>TOTAL REVIEWS</th>
              <th style={styles.th}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.productName} style={styles.tr}>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.imgPlaceholder}>
                      {p.productImage ? <img src={p.productImage} style={{ width: '100%', borderRadius: '6px' }} alt="" /> : <MessageSquare size={18} />}
                    </div>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{p.productName}</span>
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                    <span style={{ fontWeight: '700', color: '#1e293b' }}>{p.avgRating}</span>
                  </div>
                </td>
                <td style={styles.td}>{p.reviewCount} Reviews</td>
                <td style={styles.td}>
                  <button onClick={() => setSelectedProduct(p)} style={styles.viewBtn}>
                    View All <ChevronRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedProduct && <ProductReviewsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ title, value, icon, subtitle, trend, isRating }) {
  return (
    <div style={styles.statCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>{title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{value}</h3>
            {isRating && (
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={14} fill={i <= Math.round(value) ? "#f59e0b" : "none"} stroke="#f59e0b" />
                ))}
              </div>
            )}
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
            <span style={{ color: trend === 'up' ? '#10b981' : (trend === 'down' ? '#ef4444' : '#94a3b8'), fontWeight: '700' }}>
              {subtitle.split(' vs')[0]}
            </span> {subtitle.includes('vs') ? ' vs last month' : ''}
          </p>
        </div>
        <div style={styles.statIconBox}>{icon}</div>
      </div>
    </div>
  );
}

function ProductReviewsModal({ product, onClose }) {
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>{product.productName}</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Individual Customer History</p>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={20}/></button>
        </div>
        
        <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '12px' }}>
          {product.reviews.map((rev) => (
            <ReviewItem key={rev.id} review={rev} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ review }) {
  const fetcher = useFetcher();
  const [isEditing, setIsEditing] = useState(!review.reply);
  const [replyText, setReplyText] = useState(review.reply || "");

  const handleSave = () => {
    fetcher.submit({ reviewId: review.id, reply: replyText }, { method: "POST" });
    setIsEditing(false);
  };

  return (
    <div style={styles.itemCard}>
      {/* Customer Bubble */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={styles.avatar}><User size={16} color="#64748b"/></div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '14px' }}>{review.author || "Customer"}</span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'flex', gap: '2px', margin: '4px 0' }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < review.rating ? "#f59e0b" : "none"} stroke="#f59e0b" />)}
          </div>
          <div style={styles.customerBubble}>{review.comment}</div>
        </div>
      </div>

      {/* Store Bubble */}
      <div style={{ display: 'flex', gap: '12px', flexDirection: 'row-reverse' }}>
        <div style={{ ...styles.avatar, backgroundColor: '#008060' }}><CheckCircle size={16} color="#fff"/></div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row-reverse', marginBottom: '6px' }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: '#008060' }}>Store Response</span>
            {!isEditing && review.reply && (
              <button onClick={() => setIsEditing(true)} style={styles.editBtn}>
                <Edit2 size={12}/> Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div style={{ position: 'relative' }}>
              <textarea 
                style={styles.textarea} 
                value={replyText} 
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
              />
              <button style={styles.sendBtn} onClick={handleSave} disabled={fetcher.state === "submitting"}>
                <Send size={14} />
              </button>
            </div>
          ) : (
            <div style={styles.storeBubble}>{review.reply || "No reply yet."}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  container: { padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' },
  statCard: { backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  statIconBox: { padding: '10px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tableCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  th: { padding: '16px 20px', fontSize: '12px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#475569' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  imgPlaceholder: { width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  viewBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: '0.2s' },
  itemCard: { padding: '24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', marginBottom: '20px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  customerBubble: { backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: '0 16px 16px 16px', fontSize: '14px', color: '#334155', display: 'inline-block', textAlign: 'left', maxWidth: '85%', lineHeight: '1.4' },
  storeBubble: { backgroundColor: '#e6f3f0', padding: '12px 16px', borderRadius: '16px 0 16px 16px', fontSize: '14px', color: '#004d3a', display: 'inline-block', textAlign: 'left', maxWidth: '85%', lineHeight: '1.4' },
  textarea: { width: '100%', padding: '12px 45px 12px 16px', borderRadius: '16px', border: '1px solid #008060', fontSize: '14px', outline: 'none', resize: 'none', height: '80px', fontFamily: 'inherit' },
  sendBtn: { position: 'absolute', right: '10px', bottom: '10px', backgroundColor: '#008060', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  editBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#f8fafc', padding: '32px', borderRadius: '24px', width: '650px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  closeBtn: { padding: '8px', borderRadius: '50%', border: 'none', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
};