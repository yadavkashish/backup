(async () => {
  const root = document.getElementById("app-reviews-root");
  if (!root) return;

  const productId = root.dataset.productId;
  const shop = root.dataset.shop;

  const API = "https://judgme.onrender.com";

  // 1️⃣ Load reviews
  const res = await fetch(
    `${API}/api/public/reviews?productId=${productId}&shop=${shop}`
  );
  const reviews = await res.json();

  // 2️⃣ Render UI
  root.innerHTML = `
    <div style="border-top:1px solid #e5e7eb;padding-top:24px;font-family:Arial">

      <h3 style="font-size:20px;font-weight:700">Customer Reviews</h3>

      <div id="reviews-list">
        ${
          reviews.length === 0
            ? "<p>No reviews yet</p>"
            : reviews.map(r => `
                <div style="margin-bottom:16px">
                  <strong>${r.author}</strong>
                  <div style="color:#facc15">${"★".repeat(r.rating)}</div>
                  <p>${r.comment}</p>
                </div>
              `).join("")
        }
      </div>

      <hr style="margin:24px 0"/>

      <h4>Write a review</h4>

      <select id="review-rating">
        <option value="5">★★★★★</option>
        <option value="4">★★★★</option>
        <option value="3">★★★</option>
        <option value="2">★★</option>
        <option value="1">★</option>
      </select>

      <input id="review-author" placeholder="Your name" style="display:block;margin:8px 0"/>
      <textarea id="review-comment" placeholder="Your review" style="display:block;width:100%;margin:8px 0"></textarea>

      <button id="submit-review" style="padding:10px 16px">
        Submit Review
      </button>

      <p id="review-msg" style="font-size:12px;color:green"></p>
    </div>
  `;

  // 3️⃣ Submit review
  document.getElementById("submit-review").onclick = async () => {
    const rating = document.getElementById("review-rating").value;
    const author = document.getElementById("review-author").value;
    const comment = document.getElementById("review-comment").value;

    if (!comment) return alert("Write a review");

    await fetch(`${API}/api/public/submit-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        shop,
        rating: Number(rating),
        author,
        comment
      })
    });

    document.getElementById("review-msg").innerText =
      "Thanks! Your review will appear after approval.";

    document.getElementById("review-comment").value = "";
  };
})();
