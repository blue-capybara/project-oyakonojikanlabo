<?php

/**
 * Plugin Name: Google Sheets Display (No-Composer Edition)
 * Description: Google スプレッドシートをサーバー側で取得し、ショートコード/GraphQLで出力（Composer不要・PHP7対応）。
 * Version: 1.2.0
 * Author: CapybaraWebWorks
 * License: GPLv2
 */

if (!defined('ABSPATH')) {
	exit;
}

/** APIキー解決： shortcode > 定数 > 環境変数 > 設定画面 */
function gsd_resolve_api_key($from_sc = '')
{
	$from_sc = trim((string)$from_sc);
	if ($from_sc !== '') return $from_sc;
	if (defined('GSD_GOOGLE_API_KEY') && GSD_GOOGLE_API_KEY) return GSD_GOOGLE_API_KEY;
	$env = getenv('GSD_GOOGLE_API_KEY');
	if (!empty($env)) return $env;
	$opt = get_option('gsd_api_key', '');
	return is_string($opt) ? $opt : '';
}

/** Sheets API v4 直叩き（values.get） */
function gsd_fetch_sheet_values($spreadsheet_id, $range, $api_key)
{
	if (empty($spreadsheet_id) || empty($range)) {
		return new WP_Error('gsd_missing_params', 'spreadsheet_id と range は必須です。');
	}
	if (empty($api_key)) {
		return new WP_Error('gsd_missing_api_key', 'Google APIキーが未設定です。設定画面/定数/環境変数/ショートコードのいずれかで指定してください。');
	}

	// APIエンドポイント
	$url = add_query_arg(
		array(
			'key' => $api_key,
		),
		sprintf(
			'https://sheets.googleapis.com/v4/spreadsheets/%s/values/%s',
			rawurlencode($spreadsheet_id),
			rawurlencode($range)
		)
	);

	$resp = wp_remote_get($url, array(
		'timeout' => 15,
		'headers' => array('Accept' => 'application/json'),
	));
	if (is_wp_error($resp)) {
		return new WP_Error('gsd_http_error', 'HTTPエラー: ' . $resp->get_error_message());
	}

	$code = wp_remote_retrieve_response_code($resp);
	$body = wp_remote_retrieve_body($resp);
	if ($code < 200 || $code >= 300) {
		// エラーメッセージ抽出（可能なら）
		$msg = $body;
		$json = json_decode($body, true);
		if (isset($json['error']['message'])) $msg = $json['error']['message'];
		return new WP_Error('gsd_api_error', 'Google Sheets API エラー: ' . $msg);
	}

	$json = json_decode($body, true);
	$values = isset($json['values']) && is_array($json['values']) ? $json['values'] : array();
	return $values;
}

/** 表HTML化 */
function gsd_build_table_html(array $rows, $header_row = 0, $table_class = 'gsd-table widefat striped')
{
	if (empty($rows)) return '<div class="gsd-empty">データが見つかりませんでした。</div>';

	$header_row = max(0, intval($header_row));
	$thead = '';
	$tbody_rows = $rows;

	if ($header_row >= 1 && count($rows) >= $header_row) {
		$hdr_index = $header_row - 1;
		$header = array_map('wp_kses_post', array_map('esc_html', $rows[$hdr_index]));
		$thead = '<thead><tr>' . implode('', array_map(function ($c) {
			return "<th>{$c}</th>";
		}, $header)) . '</tr></thead>';
		unset($tbody_rows[$hdr_index]);
		$tbody_rows = array_values($tbody_rows);
	}

	$tbody = '';
	foreach ($tbody_rows as $r) {
		$cells = '';
		foreach ($r as $c) $cells .= '<td>' . wp_kses_post(esc_html($c)) . '</td>';
		$tbody .= '<tr>' . $cells . '</tr>';
	}

	$class_attr = esc_attr($table_class ?: 'gsd-table');
	return "<table class=\"{$class_attr}\">{$thead}<tbody>{$tbody}</tbody></table>";
}

/** ショートコード */
function gsd_sc_google_sheets($atts)
{
	$atts = shortcode_atts(array(
		'spreadsheet_id' => '',
		'range'          => '',
		'api_key'        => '',
		'cache_ttl'      => '300',
		'header_row'     => '1',
		'table_class'    => 'widefat striped',
	), $atts, 'google_sheets');

	$spreadsheet_id = trim($atts['spreadsheet_id']);
	$range          = trim($atts['range']);
	$api_key        = gsd_resolve_api_key($atts['api_key']);
	$cache_ttl      = max(0, intval($atts['cache_ttl']));
	$header_row     = intval($atts['header_row']);
	$table_class    = $atts['table_class'];

	if (!$spreadsheet_id || !$range) {
		return '<div class="gsd-error">必須パラメータ（spreadsheet_id / range）が不足しています。</div>';
	}

	$buster   = (int) get_option('gsd_cache_buster', 1);
	$cache_key = 'gsd_' . md5($spreadsheet_id . '|' . $range . '|' . $api_key);
	$values = $cache_ttl ? get_transient($cache_key) : false;

	if ($values === false) {
		$data = gsd_fetch_sheet_values($spreadsheet_id, $range, $api_key);
		if (is_wp_error($data)) return '<div class="gsd-error">' . esc_html($data->get_error_message()) . '</div>';
		$values = $data;
		if ($cache_ttl) set_transient($cache_key, $values, $cache_ttl);
	}

	return gsd_build_table_html($values, $header_row, $table_class);
}
add_shortcode('google_sheets', 'gsd_sc_google_sheets');

/** WPGraphQL（入っていれば有効化） */
add_action('init', function () {
	if (!function_exists('register_graphql_object_type') || !function_exists('register_graphql_field')) return;

	register_graphql_object_type('GSDataset', array(
		'description' => 'Google Sheets dataset',
		'fields'      => array(
			'rows' => array('type' => 'String'),
			'html' => array('type' => 'String'),
		),
	));

	register_graphql_field('RootQuery', 'googleSheetsData', array(
		'type'        => 'GSDataset',
		'description' => 'Fetch Google Sheets data (server-side)',
		'args'        => array(
			'spreadsheetId' => array('type' => 'String'),
			'range'         => array('type' => 'String'),
			'cacheTtl'      => array('type' => 'Int'),
			'headerRow'     => array('type' => 'Int'),
			'apiKey'        => array('type' => 'String'),
		),
		'resolve'     => function ($root, $args) {
			$spreadsheet_id = isset($args['spreadsheetId']) ? trim($args['spreadsheetId']) : '';
			$range          = isset($args['range']) ? trim($args['range']) : '';
			$cache_ttl      = isset($args['cacheTtl']) ? max(0, intval($args['cacheTtl'])) : 300;
			$header_row     = isset($args['headerRow']) ? intval($args['headerRow']) : 1;
			$api_key        = gsd_resolve_api_key(isset($args['apiKey']) ? trim($args['apiKey']) : '');

			if (!$spreadsheet_id || !$range) {
				return array(
					'rows' => json_encode(array('error' => 'missing spreadsheetId or range')),
					'html' => '<div class="gsd-error">必須パラメータが不足しています。</div>',
				);
			}

			$buster   = (int) get_option('gsd_cache_buster', 1);
			$cache_key = 'gsd_' . md5($spreadsheet_id . '|' . $range . '|' . $api_key);
			$values = $cache_ttl ? get_transient($cache_key) : false;

			if ($values === false) {
				$data = gsd_fetch_sheet_values($spreadsheet_id, $range, $api_key);
				if (is_wp_error($data)) {
					$msg = esc_html($data->get_error_message());
					return array('rows' => json_encode(array('error' => $msg)), 'html' => '<div class="gsd-error">' . $msg . '</div>');
				}
				$values = $data;
				if ($cache_ttl) set_transient($cache_key, $values, $cache_ttl);
			}

			return array(
				'rows' => wp_json_encode($values),
				'html' => gsd_build_table_html($values, $header_row, 'widefat striped'),
			);
		},
	));
});

function gsd_delete_all_transients_like_gsd()
{
	global $wpdb;
	// optionsテーブルに保存されるケース用の掃除（オブジェクトキャッシュ利用時は効かないが害はない）
	$like1 = $wpdb->esc_like('_transient_gsd_') . '%';
	$like2 = $wpdb->esc_like('_transient_timeout_gsd_') . '%';
	$wpdb->query(
		$wpdb->prepare(
			"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
			$like1,
			$like2
		)
	);
}

/** 設定画面（APIキー保存） */
add_action('admin_menu', function () {
	add_options_page('Google Sheets Display', 'Google Sheets Display', 'manage_options', 'gsd-settings', 'gsd_render_settings_page');
});
add_action('admin_init', function () {
	register_setting('gsd_settings_group', 'gsd_api_key', array(
		'type' => 'string',
		'sanitize_callback' => function ($v) {
			return trim((string)$v);
		},
		'default' => '',
		'show_in_rest' => false,
	));
	add_settings_section('gsd_main', '基本設定', '__return_false', 'gsd-settings');
	add_settings_field('gsd_api_key_field', 'Google API キー', function () {
		$stored = get_option('gsd_api_key', '');
		$masked = $stored ? str_repeat('•', max(8, strlen($stored))) : '';
		echo '<input type="password" name="gsd_api_key" value="" class="regular-text" autocomplete="off" placeholder="ここに入力/更新" />';
		if ($stored) {
			echo '<p class="description">現在のキー: <code>' . esc_html($masked) . '</code>（入力すると上書き保存）</p>';
		} else {
			echo '<p class="description">未設定です。ここに保存するか、<code>wp-config.php</code> に <code>define("GSD_GOOGLE_API_KEY","...");</code> を記述してください。</p>';
		}
	}, 'gsd-settings', 'gsd_main');
	if (get_option('gsd_cache_buster', false) === false) {
		add_option('gsd_cache_buster', 1, '', false); // autoloadしない
	}
});
function gsd_render_settings_page()
{
	if (!current_user_can('manage_options')) {
		return;
	}
	// ▼ 追加：キャッシュクリアのPOST処理
	if (isset($_POST['gsd_clear_cache']) && check_admin_referer('gsd_clear_cache_action', 'gsd_clear_cache_nonce')) {
		// 世代インクリメント（これで全キャッシュ即無効化）
		$buster = (int) get_option('gsd_cache_buster', 1);
		update_option('gsd_cache_buster', $buster + 1, false);

		// ついでにDB上の古いtransientキーも掃除（任意）
		gsd_delete_all_transients_like_gsd();

		echo '<div class="notice notice-success is-dismissible"><p>キャッシュをクリアしました。</p></div>';
	}
?>
	<div class="wrap">
		<h1>Google Sheets Display 設定</h1>

		<form method="post" action="options.php">
			<?php
			settings_fields('gsd_settings_group');
			do_settings_sections('gsd-settings');
			submit_button('保存');
			?>
		</form>

		<hr>
		<h2>APIキーの優先順位</h2>
		<ol>
			<li>ショートコード属性 <code>api_key</code></li>
			<li><code>wp-config.php</code> の定数 <code>GSD_GOOGLE_API_KEY</code></li>
			<li>この設定画面の保存値</li>
			<li>環境変数 <code>GSD_GOOGLE_API_KEY</code></li>
		</ol>
		<p class="description">※ シートは「リンクを知っている全員が閲覧可」か、少なくともAPIキーで読み取り可能な共有設定にしてください。</p>

		<!-- ▼ ここから追加：ショートコードのサンプル＆パラメータ一覧 ▼ -->
		<hr>
		<h2>ショートコードのサンプル</h2>
		<p>下記を投稿や固定ページに貼り付け、<code>spreadsheet_id</code> と <code>range</code> を実データに置き換えてください。</p>
		<pre style="background:#f6f7f7;border:1px solid #ccd0d4;padding:12px;overflow:auto;white-space:pre-wrap;">[google_sheets spreadsheet_id="1e6Wf_4VnIsoeAigY-XS50zHNvWXvnFPw9I9xLDg7ZUE" range="シート1!A:B" header_row="1" cache_ttl="2592000" table_class="widefat striped"]</pre>

		<h3>パラメータ一覧</h3>
		<table class="widefat striped" style="max-width:900px;">
			<thead>
				<tr>
					<th style="width:180px;">パラメータ</th>
					<th style="width:60px;">必須</th>
					<th>説明</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>spreadsheet_id</code></td>
					<td>◯</td>
					<td>GoogleスプレッドシートのID。URLの <code>/d/</code> と <code>/edit</code> の間の文字列。</td>
				</tr>
				<tr>
					<td><code>range</code></td>
					<td>◯</td>
					<td>取得する範囲。例：<code>Sheet1!A1:D10</code>（シート名 + セル範囲）。</td>
				</tr>
				<tr>
					<td><code>header_row</code></td>
					<td>任意</td>
					<td>ヘッダー行番号。<code>1</code>で1行目をヘッダー（&lt;th&gt;）に、<code>0</code>で全て&lt;td&gt;。既定：<code>1</code></td>
				</tr>
				<tr>
					<td><code>cache_ttl</code></td>
					<td>任意</td>
					<td>キャッシュ保持時間（秒）。<code>0</code>でキャッシュ無効。既定：<code>300</code></td>
				</tr>
				<tr>
					<td><code>table_class</code></td>
					<td>任意</td>
					<td>出力テーブルに付与するCSSクラス。例：<code>widefat striped</code></td>
				</tr>
				<tr>
					<td><code>api_key</code></td>
					<td>任意</td>
					<td>APIキー。未指定でも、優先順位に従い（ショートコード &gt; <code>wp-config.php</code>定数 &gt; 設定画面保存値 &gt; 環境変数）で解決します。</td>
				</tr>
			</tbody>
		</table>

		<p class="description" style="margin-top:8px;">
			推奨：本番では <code>cache_ttl</code> を長め（例：3600）に設定し、API呼び出し頻度を抑制してください。
		</p>
		<!-- ▲ ここまで追加 ▲ -->
		<!-- ▼ ここから追加：キャッシュクリアボタン ▼ -->
		<hr>
		<h2>キャッシュ操作</h2>
		<p>現在のキャッシュ世代: <code><?php echo (int) get_option('gsd_cache_buster', 1); ?></code></p>
		<form method="post" action="">
			<?php wp_nonce_field('gsd_clear_cache_action', 'gsd_clear_cache_nonce'); ?>
			<input type="hidden" name="gsd_clear_cache" value="1">
			<?php submit_button('キャッシュをクリアする', 'secondary'); ?>
		</form>
		<p class="description">※ クリックすると次回アクセス時から最新データを取得します（保存済みトランジェントも可能な範囲で削除）。</p>
		<!-- ▲ ここまで追加 ▲ -->
	</div>
<?php
}
