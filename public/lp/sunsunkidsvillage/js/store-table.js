const csvUrl =
	"https://docs.google.com/spreadsheets/d/1P8GdpyiS8siaf33Nq66s_vmlQgCIj6g71w5wqhGzcFM/gviz/tq?tqx=out:csv&sheet=Sheet1";

fetch(csvUrl)
	.then(res => res.text())
	.then(csv => {
		const rows = csv.trim().split("\n").map(r =>
			r.split(",").map(c => c.replace(/^"|"$/g, ""))
		);

		// ヘッダー除外
		const data = rows.slice(1);

		// 都道府県ごとにグループ化
		const groups = {};
		data.forEach(([name, pref, city]) => {
			if (!groups[pref]) groups[pref] = [];
			groups[pref].push({ name, city });
		});

		const container = document.getElementById("store-list");

		Object.entries(groups).forEach(([pref, stores]) => {
			const details = document.createElement("details");
			details.open = false; // 最初は閉じる（好みで true）

			const summary = document.createElement("summary");
			summary.textContent = `${pref}（${stores.length}）`;
			details.appendChild(summary);

			stores.forEach(store => {
				const div = document.createElement("div");
				div.className = "store-item";
				div.innerHTML = `
          <div class="store-name">${store.name}</div>
          <div class="store-address">${pref} ${store.city}</div>
        `;
				details.appendChild(div);
			});

			container.appendChild(details);
		});
	});
