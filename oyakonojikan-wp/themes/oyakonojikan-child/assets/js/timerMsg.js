document.addEventListener('DOMContentLoaded', function () {
	// 現在の日付を取得
	var currentDate = new Date();

	// 表示させたい期間を設定
	var startDate = new Date('2024-12-23T18:42:00');
	var endDate = new Date('2025-01-06T10:00:00');

	// テキストを表示する要素を取得
	var cartMsgElement = document.getElementById('cart_msg');

	// 日付が範囲内にあるかどうかをチェック
	if (currentDate >= startDate && currentDate <= endDate) {
		cartMsgElement.innerHTML = `
<div class="cart_msg">
	<a href="https://oyakonojikanlabo.jp/about-business-new-year-holidays-24-25/">
		<picture>
			<source srcset="https://oyakonojikanlabo.jp/wp-content/themes/oyakonojikan-child/assets/img/banner/new-year-25_banner.avif" type="image/avif">
			<source srcset="https://oyakonojikanlabo.jp/wp-content/themes/oyakonojikan-child/assets/img/banner/new-year-25_banner.webp" type="image/webp">
			<img src="https://oyakonojikanlabo.jp/wp-content/themes/oyakonojikan-child/assets/img/banner/new-year-25_banner.png" alt="夏季休業のお知らせ" width="1000" height="140">
		</picture>
	</a>
</div>
<style>
	.cart_msg {
		display: flex;
		align-items: center;
		margin-bottom: 40px;
		margin-top: calc(-98px + 40px);

		a {
			display: inline-block;

			img {
				width: 100%;
				max-width: 793px;
				height: auto;
				box-shadow: 0px 10px 10px -10px #545B63;
			}
		}

	}
</style>
        `;
	} else {
		cartMsgElement.innerHTML = ''; // 期間外の場合は何も表示しない
	}
});