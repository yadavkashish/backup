import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { Star, Eye, EyeOff } from "lucide-react";

/* ---------------- LOADER ---------------- */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const reviews = await db.review.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });

  return { reviews };
};

/* ---------------- ACTION ---------------- */
export const action = async ({ request }) => {
  const formData = await request.formData();

  const id = formData.get("id");
  const status = formData.get("status");

  await db.review.update({
    where: { id },
    data: { status },
  });

  return null;
};

/* ---------------- PAGE ---------------- */
export default function AdminDashboardPage() {
  const { reviews } = useLoaderData();
  const submit = useSubmit();
  const nav = useNavigation();

  const updateStatus = (id, status) => {
    const fd = new FormData();
    fd.append("id", id);
    fd.append("status", status);
    submit(fd, { method: "post" });
  };

  const pending = reviews.filter((r) => r.status === "PENDING").length;
  const total = reviews.length;

  return (
    <div style={styles.container}>
      <div style={{ maxWidth: 896, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: "700", marginBottom: 20 }}>
          Admin Dashboard
        </h1>

        {/* STATS */}
        <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Reviews</div>
            <div style={styles.statValue}>{total}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Pending Approval</div>
            <div style={{ ...styles.statValue, color: "#d97706" }}>
              {pending}
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Rating</th>
                <th style={styles.th}>Review</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ display: "flex", color: "#facc15" }}>
                      {r.rating} <Star size={14} fill="currentColor" />
                    </div>
                  </td>

                  <td style={styles.td}>
                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                    <div style={{ fontSize: 14, color: "#6b7280" }}>
                      {r.comment}
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      Product: {r.productName}
                    </div>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          r.status === "PUBLISHED"
                            ? "#dcfce7"
                            : "#fef9c3",
                        color:
                          r.status === "PUBLISHED"
                            ? "#166534"
                            : "#854d0e",
                      }}
                    >
                      {r.status}
                    </span>
                  </td>

                  <td style={{ ...styles.td, textAlign: "right" }}>
                    {r.status !== "PUBLISHED" && (
                      <button
                        onClick={() => updateStatus(r.id, "PUBLISHED")}
                        style={styles.iconBtn}
                        title="Publish"
                        disabled={nav.state === "submitting"}
                      >
                        <Eye size={18} />
                      </button>
                    )}

                    {r.status !== "HIDDEN" && (
                      <button
                        onClick={() => updateStatus(r.id, "HIDDEN")}
                        style={styles.iconBtnMuted}
                        title="Hide"
                        disabled={nav.state === "submitting"}
                      >
                        <EyeOff size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES (UNCHANGED THEME) ---------------- */
const styles = {
  container: {
    fontFamily: "sans-serif",
    color: "#1e293b",
    padding: 24,
    backgroundColor: "#f3f4f6",
    minHeight: "100vh",
  },
  statCard: {
    background: "#fff",
    padding: 20,
    borderRadius: 8,
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
  },
  tableWrapper: {
    background: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: 16,
    fontSize: 14,
    textAlign: "left",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  },
  tr: {
    borderBottom: "1px solid #f3f4f6",
  },
  td: {
    padding: 16,
    verticalAlign: "top",
  },
  iconBtn: {
    border: "none",
    background: "none",
    cursor: "pointer",
    color: "#16a34a",
    marginRight: 8,
  },
  iconBtnMuted: {
    border: "none",
    background: "none",
    cursor: "pointer",
    color: "#6b7280",
  },
};
