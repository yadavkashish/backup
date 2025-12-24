(async () => {
  const root = document.getElementById("app-reviews-root");
  if (!root) return;

  const productId = root.dataset.productId;
  const productName = root.dataset.productName;
  const shop = root.dataset.shop.replace(/\/$/, "");
  const API = "https://judgme.onrender.com";

  // 1️⃣ Load reviews
  const res = await fetch(
    `${API}/api/public/reviews?productId=${productId}&shop=${shop}`
  );
  const reviews = await res.json();

  root.innerHTML = `
    <div style="max-width:640px;margin-top:32px;font-family:Arial,sans-serif">
      <h3 style="font-size:22px;margin-bottom:4px">Customer Reviews</h3>
      <p style="color:#6b7280;margin-bottom:16px">
        Reviews for <strong>${productName}</strong>
      </p>

      ${
        reviews.length === 0
          ? `<p style="color:#6b7280">No reviews yet</p>`
          : reviews
              .map(
                r => `
                <div style="border-bottom:1px solid #e5e7eb;padding:12px 0">
                  <strong>${r.author}</strong>
                  <div style="color:#facc15;font-size:14px">
                    ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}
                  </div>
                  <p style="margin-top:4px">${r.comment}</p>
                </div>
              `
              )
              .join("")
      }

      <div style="margin-top:28px;padding-top:20px;border-top:2px solid #e5e7eb">
        <h4 style="font-size:18px;margin-bottom:12px">Write a review</h4>

        <div id="stars" style="font-size:26px;color:#d1d5db;cursor:pointer">
          ${[1,2,3,4,5].map(i => `<span data-v="${i}">★</span>`).join("")}
        </div>

        <input
          id="author"
          placeholder="Your name"
          style="width:100%;margin-top:12px;padding:10px;border:1px solid #d1d5db;border-radius:6px"
        />

        <textarea
          id="comment"
          placeholder="Write your review..."
          style="width:100%;margin-top:12px;padding:10px;height:90px;border:1px solid #d1d5db;border-radius:6px"
        ></textarea>

        <button
          id="submitReview"
          style="margin-top:14px;background:#111827;color:white;padding:10px 18px;border:none;border-radius:6px;cursor:pointer"
        >
          Submit Review
        </button>

        <p id="msg" style="margin-top:8px;color:#16a34a"></p>
      </div>
    </div>
  `;

  let rating = 5;
  const stars = root.querySelectorAll("#stars span");

  const paintStars = () => {
    stars.forEach(s => {
      s.style.color = s.dataset.v <= rating ? "#facc15" : "#d1d5db";
    });
  };

  stars.forEach(star => {
    star.onclick = () => {
      rating = Number(star.dataset.v);
      paintStars();
    };
  });

  paintStars();

  document.getElementById("submitReview").onclick = async () => {
    const author = document.getElementById("author").value;
    const comment = document.getElementById("comment").value;

    if (!comment) {
      alert("Please write a review");
      return;
    }

    const resp = await fetch(`${API}/api/public/submit-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop,
        productId,
        productName,
        rating,
        author,
        comment,
      }),
    });

    if (resp.ok) {
      document.getElementById("msg").innerText =
        "Thanks! Your review is now live 🎉";
      document.getElementById("comment").value = "";
    } else {
      alert("Failed to submit review");
    }
  };
})();
