(async () => {
  const root = document.getElementById("app-reviews-root");
  if (!root) return;

  const productId = root.dataset.productId;
  const shop = root.dataset.shop.replace(/\/$/, "");

  const API = "https://judgme.onrender.com";

  // 1️⃣ Load reviews
 const res = await fetch(
    `${API}/api/public/reviews?productId=${productId}&shop=${shop}`
  );
  const reviews = await res.json();

  root.innerHTML = `
    <h3>Customer Reviews</h3>

    ${
      reviews.length === 0
        ? "<p>No reviews yet</p>"
        : reviews
            .map(
              (r) => `
          <div>
            <strong>${r.author}</strong>
            <div>${"★".repeat(r.rating)}</div>
            <p>${r.comment}</p>
          </div>
        `
            )
            .join("")
    }

    <hr />

    <h4>Write a review</h4>
    <select id="rating">
      <option value="5">★★★★★</option>
      <option value="4">★★★★</option>
      <option value="3">★★★</option>
      <option value="2">★★</option>
      <option value="1">★</option>
    </select>

    <input id="author" placeholder="Your name" />
    <textarea id="comment" placeholder="Your review"></textarea>
    <button id="submitReview">Submit</button>
    <p id="msg"></p>
  `;

  document.getElementById("submitReview").onclick = async () => {
    const rating = document.getElementById("rating").value;
    const author = document.getElementById("author").value;
    const comment = document.getElementById("comment").value;

    await fetch(`${API}/api/public/submit-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop,
        productId,
        rating,
        author,
        comment,
      }),
    });

    document.getElementById("msg").innerText =
      "Thanks! Your review will appear after approval.";
  };
})();