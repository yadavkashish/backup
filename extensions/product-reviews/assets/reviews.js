(async function () {
  const root = document.getElementById("app-reviews-root");
  if (!root) return;

  const productId = root.dataset.productId;
  const shop = root.dataset.shop;

  const res = await fetch(
    `https://YOUR_APP_URL/api/public/reviews?productId=${productId}&shop=${shop}`
  );

  const reviews = await res.json();

  root.innerHTML = `
    <div style="border-top:1px solid #e5e7eb;padding-top:24px">
      <h3 style="font-size:20px;font-weight:700;margin-bottom:12px">
        Customer Reviews
      </h3>

      ${
        reviews.length === 0
          ? "<p>No reviews yet</p>"
          : reviews.map(r => `
              <div style="margin-bottom:16px">
                <strong>${r.author}</strong>
                <div>${"★".repeat(r.rating)}</div>
                <p>${r.comment}</p>
              </div>
            `).join("")
      }
    </div>
  `;
})();
