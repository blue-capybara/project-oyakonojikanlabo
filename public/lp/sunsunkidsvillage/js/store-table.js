const apiUrl = "https://store-data.oyakonojikanlabo.jp/wp-json/store-db/v1/stores?product=sunsun";

const PREFECTURE_ORDER = {
	北海道: 1,
	青森県: 2,
	岩手県: 3,
	宮城県: 4,
	秋田県: 5,
	山形県: 6,
	福島県: 7,
	茨城県: 8,
	栃木県: 9,
	群馬県: 10,
	埼玉県: 11,
	千葉県: 12,
	東京都: 13,
	神奈川県: 14,
	新潟県: 15,
	富山県: 16,
	石川県: 17,
	福井県: 18,
	山梨県: 19,
	長野県: 20,
	岐阜県: 21,
	静岡県: 22,
	愛知県: 23,
	三重県: 24,
	滋賀県: 25,
	京都府: 26,
	大阪府: 27,
	兵庫県: 28,
	奈良県: 29,
	和歌山県: 30,
	鳥取県: 31,
	島根県: 32,
	岡山県: 33,
	広島県: 34,
	山口県: 35,
	徳島県: 36,
	香川県: 37,
	愛媛県: 38,
	高知県: 39,
	福岡県: 40,
	佐賀県: 41,
	長崎県: 42,
	熊本県: 43,
	大分県: 44,
	宮崎県: 45,
	鹿児島県: 46,
	沖縄県: 47
};

function extractMunicipality(address) {
	const text = String(address || "").trim();
	if (!text) return "";

	const match = text.match(/^(.+?(?:市|区|町|村|郡.+?(?:町|村)))/);
	if (match && match[1]) return match[1];

	return "";
}

function escapeHtml(value) {
	return String(value || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function normalizeMunicipalityCode(value) {
	const digits = String(value || "").replace(/\D/g, "");
	if (digits.length < 5) return "";
	return digits.slice(0, 5);
}

function resolvePrefOrder(pref, municipalityCode) {
	if (municipalityCode) {
		const fromCode = Number(municipalityCode.slice(0, 2));
		if (Number.isFinite(fromCode) && fromCode > 0) {
			return fromCode;
		}
	}

	const fromName = PREFECTURE_ORDER[pref];
	if (fromName) return fromName;
	return 99;
}

function compareStores(a, b) {
	if (a.prefOrder !== b.prefOrder) {
		return a.prefOrder - b.prefOrder;
	}

	if (a.pref !== b.pref) {
		return a.pref.localeCompare(b.pref, "ja");
	}

	const aHasCode = a.municipalityCode !== "";
	const bHasCode = b.municipalityCode !== "";

	if (aHasCode && bHasCode && a.municipalityCode !== b.municipalityCode) {
		return Number(a.municipalityCode) - Number(b.municipalityCode);
	}

	if (aHasCode !== bHasCode) {
		return aHasCode ? -1 : 1;
	}

	if (a.city !== b.city) {
		return a.city.localeCompare(b.city, "ja");
	}

	return a.name.localeCompare(b.name, "ja");
}

fetch(apiUrl)
	.then(res => {
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}`);
		}
		return res.json();
	})
	.then(items => {
		const stores = Array.isArray(items) ? items : [];
		const normalizedStores = stores.map(item => {
			const name = item && item.store_name ? String(item.store_name) : "";
			const pref = item && item.prefecture ? String(item.prefecture) : "未設定";
			const city = extractMunicipality(item && item.address ? item.address : "");
			const municipalityCode = normalizeMunicipalityCode(
				item && item.municipality_code ? item.municipality_code : ""
			);

			return {
				name,
				pref,
				city,
				municipalityCode,
				prefOrder: resolvePrefOrder(pref, municipalityCode)
			};
		});

		normalizedStores.sort(compareStores);

		const groups = new Map();
		normalizedStores.forEach(store => {
			if (!groups.has(store.pref)) groups.set(store.pref, []);
			groups.get(store.pref).push(store);
		});

		const container = document.getElementById("store-list");
		if (!container) return;
		container.innerHTML = "";

		groups.forEach((prefStores, pref) => {
			const details = document.createElement("details");
			details.open = false; // 最初は閉じる（好みで true）

			const summary = document.createElement("summary");
			summary.textContent = `${pref}（${prefStores.length}）`;
			details.appendChild(summary);

			prefStores.forEach(store => {
				const div = document.createElement("div");
				div.className = "store-item";
				div.innerHTML = `
          <div class="store-name">${escapeHtml(store.name)}</div>
          <div class="store-address">${escapeHtml(pref)} ${escapeHtml(store.city)}</div>
        `;
				details.appendChild(div);
			});

			container.appendChild(details);
		});
	})
	.catch(error => {
		// 既存レイアウトを壊さないため、失敗時は何も描画しない。
		console.error("store-table: API fetch failed", error);
	});
