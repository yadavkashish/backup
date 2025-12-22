(async () => {
  const root = document.getElementById("app-reviews-root");
  if (!root) return;

  const productId = root.dataset.productId;
  const shop = root.dataset.shop;

  const res = await fetch(
    "https://YOUR_DEPLOYED_APP_URL/api/public/reviews" +
    `?productId=${productId}&shop=${shop}`
  );

  const reviews = await res.json();

  root.innerHTML = `
    <h3>Customer Reviews</h3>
    ${
      reviews.length === 0
        ? "<p>No reviews yet</p>"
        : reviews.map(r => `
            <div>
              <strong>${r.author}</strong>
              <div>${"★".repeat(r.rating)}</div>
              <p>${r.comment}</p>
            </div>
          `).join("")
    }
  `;
})();
