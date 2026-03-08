document.addEventListener("DOMContentLoaded", () => {
	const container = document.getElementById("product-list");
	if (!container) return;

	const collectionHandle = container.dataset.collection || "";
	const limit = parseInt(container.dataset.limit) || 10;
	const sort = container.dataset.sort || "BEST_SELLING";

	// GET形式のURLを構築
	const url = `/wp-content/plugins/shopify-products/inc/shopify-proxy.php?collection=${encodeURIComponent(collectionHandle)}&limit=${limit}&sort=${encodeURIComponent(sort)}`;

	fetch(url)
		.then(res => res.json())
		.then(data => {
			// ✅ ネストを正確に追う
			const products = data?.data?.collectionByHandle?.products?.edges || [];

			if (products.length === 0) {
				console.warn("商品が見つかりませんでした。");
			}

			products.forEach(({ node }) => {
				const title = node.title;
				const handle = node.handle;
				const imageEdge = node.images?.edges?.[0];
				const imageSrc = imageEdge?.node?.url || "";
				const imageAlt = imageEdge?.node?.altText || title;
				const productUrl = `https://shop.oyakonojikanlabo.jp/products/${handle}`;

				const html = `
  <div class="product">
    <a href="${productUrl}" target="_blank">
      <img src="${imageSrc}" alt="${imageAlt}">
      <h3>${title}</h3>
    </a>
  </div>`;

				container.insertAdjacentHTML('beforeend', html);
			});
		})
		.catch(err => {
			console.error("Shopify商品取得エラー:", err);
		});
});
