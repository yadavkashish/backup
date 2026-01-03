import { useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useState } from "react";

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
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const reviewId = formData.get("reviewId");
  const reply = formData.get("reply");
  await db.review.update({ where: { id: reviewId }, data: { reply } });
  return { ok: true };
};

export default function ReviewsManagement() {
  const { reviews } = useLoaderData();
  const [selectedReview, setSelectedReview] = useState(null);

  return (
    <div style={{ padding: "40px" }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Manage Reviews</h1>
        <input type="text" placeholder="Search Form Name" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
      </header>
      
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th style={tableStyles.th}>FORM NAME</th>
              <th style={tableStyles.th}>RATING</th>
              <th style={tableStyles.th}>REVIEW</th>
              <th style={tableStyles.th}>DATE</th>
              <th style={tableStyles.th}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={tableStyles.td}>{r.productName}</td>
                <td style={tableStyles.td}><span style={{ color: '#f59e0b' }}>{"★".repeat(r.rating)}</span></td>
                <td style={tableStyles.td}>{r.comment.substring(0, 30)}...</td>
                <td style={tableStyles.td}>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td style={tableStyles.td}>
                   <button onClick={() => setSelectedReview(r)} style={{ cursor: 'pointer', background: 'none', border: '1px solid #e2e8f0', padding: '5px 10px', borderRadius: '4px' }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReview && <Modal review={selectedReview} onClose={() => setSelectedReview(null)} />}
    </div>
  );
}

function Modal({ review, onClose }) {
  const fetcher = useFetcher();
  const [reply, setReply] = useState(review.reply || "");

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Review for {review.productName}</h3>
        <p>{review.comment}</p>
        <textarea style={{ width: '100%', height: '100px', marginTop: '10px' }} value={reply} onChange={(e) => setReply(e.target.value)} />
        <button onClick={() => fetcher.submit({ reviewId: review.id, reply }, { method: "POST" })} style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}>
          {fetcher.state === "submitting" ? "Saving..." : "Save Reply"}
        </button>
      </div>
    </div>
  );
}

const tableStyles = {
  th: { padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#64748b' },
  td: { padding: '16px 20px', fontSize: '14px' }
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', padding: '30px', borderRadius: '12px', width: '400px' }
};