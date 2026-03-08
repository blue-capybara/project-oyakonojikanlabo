<?php
// Exit if accessed directly
if (!defined('ABSPATH')) exit;

// BEGIN ENQUEUE PARENT ACTION
// AUTO GENERATED - Do not modify or remove comment markers above or below:

if (!function_exists('chld_thm_cfg_locale_css')) :
	function chld_thm_cfg_locale_css($uri)
	{
		if (empty($uri) && is_rtl() && file_exists(get_template_directory() . '/rtl.css'))
			$uri = get_template_directory_uri() . '/rtl.css';
		return $uri;
	}
endif;
add_filter('locale_stylesheet_uri', 'chld_thm_cfg_locale_css');

if (!function_exists('chld_thm_cfg_parent_css')) :
	function chld_thm_cfg_parent_css()
	{
		wp_enqueue_style('chld_thm_cfg_parent', trailingslashit(get_template_directory_uri()) . 'style.css', array());
	}
endif;
add_action('wp_enqueue_scripts', 'chld_thm_cfg_parent_css', 10);

// END ENQUEUE PARENT ACTION

remove_action('wp_head', 'wp_generator'); // WordPressのバージョン
remove_action('wp_head', 'wp_shortlink_wp_head'); // 短縮URLのlink
remove_action('wp_head', 'wlwmanifest_link'); // ブログエディターのマニフェストファイル
remove_action('wp_head', 'rsd_link'); // 外部から編集するためのAPI
remove_action('wp_head', 'feed_links_extra', 3); // フィードへのリンク
remove_action('wp_head', 'print_emoji_detection_script', 7); // 絵文字に関するJavaScript
remove_action('wp_head', 'rel_canonical'); // カノニカル
remove_action('wp_print_styles', 'print_emoji_styles'); // 絵文字に関するCSS
remove_action('admin_print_scripts', 'print_emoji_detection_script'); // 絵文字に関するJavaScript
remove_action('admin_print_styles', 'print_emoji_styles'); // 絵文字に関するCSS

function change_stylesheet_link($html, $handle, $href)
{
	//管理画面では何も変更しない
	if (is_admin()) {
		return $html;
	}

	//ハンドル名で分岐
	if ($handle === 'my-bs-style') {
		$html = '<link rel="stylesheet" href="' . $href . '" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">' . "\n";
	} elseif ($handle === 'my-fa') {
		$html = '<link rel="stylesheet" href="' . $href . '" integrity="sha256-XoaMnoYC5TH6/+ihMEnospgm0J1PM/nioxbOUdnM8HY=" crossorigin="anonymous">' . "\n";
	} else {
		//上記以外の場合
		$html = '<link rel="stylesheet" href="' . $href . '">' . "\n";
	}
	return $html;
}
add_filter('style_loader_tag', 'change_stylesheet_link', 10, 3);


function change_script_tag($tag, $handle, $src)
{
	//管理画面では何も変更しない
	if (is_admin()) {
		return $tag;
	}

	//ハンドル名で分岐
	if ($handle === 'popper') {
		$tag = '<script src="' . $src . '" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>' . "\n";
	} elseif ($handle === 'bootstrap') {
		$tag = '<script src="' . $src . '" integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous"></script>' . "\n";
	} else {
		//上記以外の場合
		$tag = '<script src="' . $src . '"></script>' . "\n";
	}
	return $tag;
}
add_filter('script_loader_tag', 'change_script_tag', 10, 3);

function oyako_scripts()
{
	wp_enqueue_style('common_style', get_stylesheet_directory_uri() . '/assets/css/style.css', array(), date("YmdHi"), 'all');
	wp_enqueue_style('my-fa', 'https://cdn.jsdelivr.net/npm/fork-awesome@1.2.0/css/fork-awesome.min.css', array());
	wp_enqueue_style('typkit-a', 'https://use.typekit.net/pll7olw.css', array());
	wp_enqueue_script('typkit', get_stylesheet_directory_uri() . '/assets/js/typekit.js', array(), date("YmdHi"), true);
	wp_enqueue_script('toggle', get_stylesheet_directory_uri() . '/assets/js/toggle.js', array('jquery'), date("YmdHi"), true);
	wp_enqueue_script('timer', get_stylesheet_directory_uri() . '/assets/js/timerMsg.js', array(), date("YmdHi"), true);
	// wp_enqueue_script('readmore', get_stylesheet_directory_uri() . '/assets/js/readmore.js', array(), '1.0.0', true);
	if (is_single() || is_page()) {
		wp_enqueue_style('post_style', get_stylesheet_directory_uri() . '/assets/css/post.css', array(), date("YmdHi"), 'all');
	};
	if (is_page()) {
		wp_enqueue_style('page_style', get_stylesheet_directory_uri() . '/assets/css/page.css', array(), date("YmdHi"), 'all');
	};
	if (is_archive() || is_search()) {
		wp_enqueue_style('archive_style', get_stylesheet_directory_uri() . '/assets/css/category.css', array(), date("YmdHi"), 'all');
	};
	wp_enqueue_style('custom_style', get_stylesheet_directory_uri() . '/assets/css/customize.css', array(), date("YmdHi"), 'all');
}
add_action('wp_enqueue_scripts', 'oyako_scripts');


function keika_time($days)
{
	$today = date_i18n('U');
	$entry_day = get_the_time('U');
	$keika = date('U', ($today - $entry_day)) / 86400;
	if ($days > $keika) :
		echo '<div class="ribbon"><span>NEW</span></div>';
	endif;
}

function keika_num($limit)
{
	global $wp_query;
	$num = $wp_query->current_post;
	echo $num;
	if ($limit > $num) :
		echo '<div class="ribbon"><span>NEW</span></div>';
	endif;
}

function keika_awase($day, $limit)
{
	global $wp_query;
	$days = 3;
	$today = date_i18n('U');
	$entry_day = get_the_time('U');
	$keika = date('U', ($today - $entry_day)) / 86400;
	if ($days > $keika) :
		$limit = 3;
		$num = $wp_query->current_post;
		if ($limit > $num) :
			echo '<div class="ribbon"><span>NEW</span></div>';
		endif;
	endif;
}


add_filter('body_class', 'single_class_names');
function single_class_names($classes)
{
	if (is_single() || is_page()) {
		$classes[] = 'post';
		return $classes;
	} elseif (is_archive() || is_search()) {
		$classes[] = 'category';
		return $classes;
	} elseif (is_page()) {
		$classes[] = 'page';
		return $classes;
	} else {
		$classes[] = '';
		return $classes;
	}
}

// wp-captionのカスタマイズ
add_shortcode('caption', 'custom_caption_shortcode');

function custom_caption_shortcode($attr, $content = null)
{
	if (!isset($attr['caption'])) {
		if (preg_match('#((?:<a [^>]+>s*)?<img [^>]+>(?:s*</a>)?)(.*)#is', $content, $matches)) {
			$content = $matches[1];
			$attr['caption'] = trim($matches[2]);
		}
	}

	$output = apply_filters('img_caption_shortcode', '', $attr, $content);
	if ($output != '')
		return $output;

	extract(shortcode_atts(array(
		'id'    => '',
		'align' => 'alignnone',
		'width' => '',
		'caption' => ''
	), $attr, 'caption'));

	if (1 > (int) $width || empty($caption))
		return $content;

	if ($id) $id = 'id="' . esc_attr($id) . '" ';

	return '<figure ' . $id . 'class="wp-caption ' . esc_attr($align) . '">' . do_shortcode($content) . '<figcaption class="wp-caption-text">' . $caption . '</figcaption></figure>';
}

/* the_archive_title 余計な文字を削除 */
add_filter('get_the_archive_title', function ($title) {
	if (is_category()) {
		$title = single_cat_title('', false);
	} elseif (is_tag()) {
		$title = single_tag_title('', false);
	} elseif (is_tax()) {
		$title = single_term_title('', false);
	} elseif (is_post_type_archive()) {
		$title = post_type_archive_title('', false);
	} elseif (is_date()) {
		$title = get_the_time('Y年n月');
	} elseif (is_search()) {
		$title = '検索結果：' . esc_html(get_search_query(false));
	} elseif (is_404()) {
		$title = '「404」ページが見つかりません';
	} else {
	}
	return $title;
});

///////////////////////////////////
// ショートコードであわせて読みたいを出力
///////////////////////////////////

function related_func($atts)
{
	extract(shortcode_atts(array(
		'id' => '',
		'label' => '合わせて読みたい',
	), $atts));

	$ids = mb_split(",", $id);
	$outputTag = '';

	if ($id) :
		$outputTag .= '
        <div class="awasete">
        <h5 class="awasete__title">
        <span><i class="fas fa-link"></i>' . $label . '</span>
        </h5>
        <ul class="awasete__list">';

		foreach ($ids as $value) :
			if (ctype_digit($value)) :
				$link = get_permalink($value);
				$title = get_the_title($value);
				$date = get_the_time('Y.m.d', $value);
				if (get_post_thumbnail_id($value)) {
					$thmbnail_id = get_post_thumbnail_id($value);
					$thmbnail_img = wp_get_attachment_image_src($thmbnail_id, 'list-thumbnail');
					$thmbnail_url = $thmbnail_img[0];
				} else {
					$thmbnail_url = '/wp-content/themes/oyako-child/img/noimage.png';
				}
				$outputTag .= '
                <li class="awasete__list__item">
                    <a class="awasete__list__item__link flex flex--bet" href="' . $link . '" target="_blank">
                        <figure class="awasete__list__item__link__image">
                        <img src="' . $thmbnail_url . '">
                        </figure>
                        <div class="awasete__list__item__link__content">
                        <h6 class="awasete__list__item__link__content__title">' . $title . '</h6>
                        </div>
                    </a>
                </li>';
			else :
				$outputTag .= '<li class="awasete__list__item">記事IDの指定が正しくありません</li>';
			endif;
		endforeach;
		$outputTag .= '</ul></div>';
		return $outputTag;
	else :
		return '
        <div class="awasete">
        <h5 class="awasete__title">
        <span><i class="fas fa-link"></i>' . $label . '</span>
        </h5>
        <ul class="awasete__list">記事IDがありません</ul>
        </div>';
	endif;
}
add_shortcode('related', 'related_func');

// wp_nav_menuのliにclass追加
function add_additional_class_on_li($classes, $item, $args)
{
	if (isset($args->add_li_class)) {
		$classes['class'] = $args->add_li_class;
	}
	return $classes;
}
add_filter('nav_menu_css_class', 'add_additional_class_on_li', 1, 3);

// wp_nav_menuのaにclass追加
function add_additional_class_on_a($classes, $item, $args)
{
	if (isset($args->add_li_class)) {
		$classes['class'] = $args->add_a_class;
	}
	return $classes;
}
add_filter('nav_menu_link_attributes', 'add_additional_class_on_a', 1, 3);

register_nav_menus(array(
	'side'      => 'サイド',
	'side-sub'  => 'サイド下',
	'footer'    => 'フッター',
	'spfooter'  => 'スマホ下'
));

function set_widgets()
{
	register_sidebar(array(
		'name' => 'サイドバー上',
		'id' => 'sidebar',
		'before_widget' => '<div class="%2$s widget">',
		'after_widget' => '</div>',
		'before_title' => '<h2 class="widgetName">',
		'after_title' => '</h2>',
	));
	register_sidebar(array(
		'name' => 'サイドバー下',
		'id' => 'sidebar2',
		'before_widget' => '<div class="%2$s widget">',
		'after_widget' => '</div>',
		'before_title' => '<h2 class="widgetName">',
		'after_title' => '</h2>',
	));
}
add_action('widgets_init', 'set_widgets');


// オプションページ設定
/**
 * @param string $page_title ページのtitle属性値
 * @param string $menu_title 管理画面のメニューに表示するタイトル
 * @param string $capability メニューを操作できる権限（manage_options とか）
 * @param string $menu_slug オプションページのスラッグ。ユニークな値にすること。
 * @param string|null $icon_url メニューに表示するアイコンの URL
 * @param int $position メニューの位置
 */
add_action('init', function () {
	SCF::add_options_page(
		'トップバナー設定',
		'トップバナー設定',
		'manage_options',
		'topbanner-options',
		'dashicons-admin-settings',
		10
	);
	SCF::add_options_page(
		'プロダクトページ設定',
		'プロダクトページ設定',
		'manage_options',
		'page-product-options',
		'dashicons-admin-settings',
		10
	);
});

//Custom CSS Widget
add_action('admin_menu', 'custom_css_hooks');
add_action('save_post', 'save_custom_css');
add_action('wp_head', 'insert_custom_css');
function custom_css_hooks()
{
	add_meta_box('custom_css', 'Custom CSS', 'custom_css_input', 'post', 'normal', 'high');
	add_meta_box('custom_css', 'Custom CSS', 'custom_css_input', 'page', 'normal', 'high');
}
function custom_css_input()
{
	global $post;
	echo '<input type="hidden" name="custom_css_noncename" id="custom_css_noncename" value="' . wp_create_nonce('custom-css') . '" />';
	echo '<textarea name="custom_css" id="custom_css" rows="5" cols="30" style="width:100%;">' . get_post_meta($post->ID, '_custom_css', true) . '</textarea>';
}
function save_custom_css($post_id)
{
	if (isset($_POST['custom_css_noncename'])) {
		if (!wp_verify_nonce($_POST['custom_css_noncename'], 'custom-css')) return $post_id;
		if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return $post_id;
		$custom_css = $_POST['custom_css'];
		update_post_meta($post_id, '_custom_css', $custom_css);
	}
}
function insert_custom_css()
{
	if (is_page() || is_single()) {
		if (have_posts()) : while (have_posts()) : the_post();
				echo '<style type="text/css">' . get_post_meta(get_the_ID(), '_custom_css', true) . '</style>';
			endwhile;
		endif;
		rewind_posts();
	}
}

//Custom JS Widget
add_action('admin_menu', 'custom_js_hooks');
add_action('save_post', 'save_custom_js');
add_action('wp_head', 'insert_custom_js');
function custom_js_hooks()
{
	add_meta_box('custom_js', 'Custom JS', 'custom_js_input', 'post', 'normal', 'high');
	add_meta_box('custom_js', 'Custom JS', 'custom_js_input', 'page', 'normal', 'high');
}
function custom_js_input()
{
	global $post;
	echo '<input type="hidden" name="custom_js_noncename" id="custom_js_noncename" value="' . wp_create_nonce('custom-js') . '" />';
	echo '<textarea name="custom_js" id="custom_js" rows="5" cols="30" style="width:100%;">' . get_post_meta($post->ID, '_custom_js', true) . '</textarea>';
}
function save_custom_js($post_id)
{
	if (isset($_POST['custom_js_noncename'])) {
		if (!wp_verify_nonce($_POST['custom_js_noncename'], 'custom-js')) return $post_id;
		if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return $post_id;
		$custom_js = $_POST['custom_js'];
		update_post_meta($post_id, '_custom_js', $custom_js);
	}
}
function insert_custom_js()
{
	if (is_page() || is_single()) {
		if (have_posts()) : while (have_posts()) : the_post();
				echo '<script type="text/javascript">' . get_post_meta(get_the_ID(), '_custom_js', true) . '</script>';
			endwhile;
		endif;
		rewind_posts();
	}
}


function pagenation($pages = '', $range = 2)
{
	global $paged;
	if (empty($paged)) $paged = 1;

	global $wp_query;
	$pages = $wp_query->max_num_pages;
	if (!$pages) {
		$pages = 1;
	}

	if ($pages != 1) {
		if ($pages == $paged) {
			$next_page_num = $paged;
		} else {
			$next_page_num = $paged + 1;
		}

		if ($paged < $pages) {
			echo '<div class="more" id="nav-below"><a href="' . get_pagenum_link($next_page_num) . '" class="more__btn entry-more"><object type="image/svg+xml" data="' . get_stylesheet_directory_uri() . '/assets/img/more.svg" width="80" height="12">more</object></a></div>';
		}
	}
}
function custom_mime_types($mimes)
{
	$mimes['svg'] = 'image/svg+xml';
	return $mimes;
}
add_filter('upload_mimes', 'custom_mime_types');



// タグクラウドに表示しない件数条件
function custom_wp_generate_tag_cloud_data($tags_data)
{
	foreach ($tags_data as $key => $value) {
		if ($tags_data[$key]['real_count'] < 3 || $tags_data[$key]['real_count'] > 120) {
			unset($tags_data[$key]);
		}
	}
	return $tags_data;
}
add_filter('wp_generate_tag_cloud_data', 'custom_wp_generate_tag_cloud_data');

function func_show_popular_tags()
{
	$tags = get_tags();
	$args = array(
		'smallest'                  => 11, //文字サイズ(最小)
		'largest'                   => 18, //文字サイズ(最大)
		'unit'                      => 'px',
		'number'                    => 0,  //表示タグ数
		'format'                    => 'flat',
		'separator'                 => "<br>",
		'orderby'                   => 'name', //人気順(タグ使用数)順に取得する
		'order'                     => 'ASC',
		'topic_count_text_callback'  => 'default_topic_count_text',
		'topic_count_scale_callback' => 'default_topic_count_scale',
		'echo'                      => false,
		"show_count"                => true,
		'filter'    => 1
	);

	$tag_html = wp_tag_cloud($args); //wp_generate_tag_cloud($tags, $args);
	return $tag_html;
}
add_shortcode('show_popular_tags', 'func_show_popular_tags');

//ショートコードを使ったphpファイルの呼び出し方法
function Include_my_php($params = array())
{
	extract(shortcode_atts(array(
		'file' => 'default'
	), $params));
	ob_start();
	include(get_stylesheet_directory() . "/template-parts/tmp-$file.php");
	return ob_get_clean();
}
add_shortcode('myphp', 'Include_my_php');

// グレーにするショートコード
function bgGray($atts, $content = null)
{
	return '<div class="bggray">' . $content . '</div>';
}
add_shortcode('gray', 'bgGray');

//タグの日本語禁止
add_action('create_post_tag', 'post_taxonomy_auto_slug', 10);
function post_taxonomy_auto_slug($term_id)
{
	$tax = str_replace('create_', '', current_filter());
	$term = get_term($term_id, $tax);
	if (preg_match('/(%[0-9a-f]{2})+/', $term->slug)) {
		$args = array(
			'slug' => $term->taxonomy . '-' . $term->term_id
		);
		wp_update_term($term_id, $tax, $args);
	}
}
//投稿のタグをチェックボックスで選択できるようにする
function change_post_tag_to_checkbox()
{
	$args = get_taxonomy('post_tag');
	$args->hierarchical = true; //Gutenberg用
	$args->meta_box_cb = 'post_categories_meta_box'; //Classicエディタ用
	register_taxonomy('post_tag', 'post', $args);
}
add_action('init', 'change_post_tag_to_checkbox', 1);


/* スタイルシートに最終更新日時をバージョンに設定する */
function my_update_styles($styles)
{
	$mtime = filemtime(get_stylesheet_directory() . '/style.css');
	$styles->default_version = $mtime;
}
add_action('wp_default_styles', 'my_update_styles');

// 管理画面の投稿一覧をログイン中のユーザーの投稿のみに制限する(管理者以外)
function pre_get_author_posts($query)
{
	if (
		is_admin() && !current_user_can('administrator') && !current_user_can('liveadministrator') && !current_user_can('superuser') && $query->is_main_query()
		&& (!isset($_GET['author']) || $_GET['author'] == get_current_user_id())
	) {
		$query->set('author', get_current_user_id());
		unset($_GET['author']);
	}
}
add_action('pre_get_posts', 'pre_get_author_posts');
function count_author_posts($counts, $type = 'post', $perm = '')
{
	if (!is_admin() || current_user_can('administrator') || current_user_can('liveadministrator') || current_user_can('superuser')) {
		return $counts;
	}
	global $wpdb;
	if (!post_type_exists($type))
		return new stdClass;
	$cache_key = _count_posts_cache_key($type, $perm) . '_author'; // 2
	$counts = wp_cache_get($cache_key, 'counts');
	if (false !== $counts) {
		return $counts;
	}
	$query = "SELECT post_status, COUNT( * ) AS num_posts FROM {$wpdb->posts} WHERE post_type = %s";
	$query .= $wpdb->prepare(" AND ( post_author = %d )", get_current_user_id());
	$query .= ' GROUP BY post_status';

	$results = (array) $wpdb->get_results($wpdb->prepare($query, $type), ARRAY_A);
	$counts = array_fill_keys(get_post_stati(), 0);
	foreach ($results as $row) {
		$counts[$row['post_status']] = $row['num_posts'];
	}
	$counts = (object) $counts;
	wp_cache_set($cache_key, $counts, 'counts');
	return $counts;
}
add_filter('wp_count_posts', 'count_author_posts', 10, 3);


if (current_user_can('contributor') && !current_user_can('upload_files')) {
	add_action('admin_init', 'allow_contributor_uploads_post_media_plus');
}

function allow_contributor_uploads_post_media_plus()
{
	$contributor = get_role('contributor');
	$contributor->add_cap('upload_files');
}

// imgを囲んでいるpにstyle='padding:0を追加
function img_p_class_content_filter($content)
{
	$ptn = "/(<p[^>]*)(\>.*)(\<img.*)(<\/p>)/im";
	$content = preg_replace($ptn, "\$1 style='padding:0'\$2\$3\$4", $content);
	return $content;
}
add_filter('the_content', 'img_p_class_content_filter', 20);


//管理画面のカテゴリーにID表示
function add_category_columns($columns)
{
	$index = 1; // 追加位置

	return array_merge(
		array_slice($columns, 0, $index),
		array('id' => 'ID'),
		array_slice($columns, $index)
	);
}
add_filter('manage_edit-category_columns', 'add_category_columns');

function add_category_custom_fields($deprecated, $column_name, $term_id)
{
	if ($column_name == 'id') {
		echo $term_id;
	}
}
add_action('manage_category_custom_column', 'add_category_custom_fields', 10, 3);

function my_get_post_profile()
{
	$html = '';
	if (get_the_author_meta('description')) {
		$html .= '<div class="author-profile content-bottom-widgets">';
		$html .= '<div class="author-profile-avatar">' . get_avatar(get_the_author_meta('user_email'), '100') . '</div>';
		$html .= '<div class="author-profile-description">';
		$html .= '<h2 class="author-profile-name">' . esc_html(get_the_author_meta('display_name')) . '</h2>';
		$html .= '<p class="author-profile-bio">' . nl2br(get_the_author_meta('description')) . '</p>';
		$html .= '</div>';
		$html .= '</div>' . "\n";
	}
	return $html;
}

function my_shortcode_youtube($atts)
{
	extract(shortcode_atts(array(
		'id' => '',
	), $atts));

	$html = '';
	$html .= '<div class="youtube">';
	$html .= '  <iframe src="https://www.youtube.com/embed/' . $id . '?rel=0&amp;showinfo=0" width="560" height="315" frameborder="0" allowfullscreen="allowfullscreen"></iframe>';
	$html .= '</div>';

	return $html;
}
add_shortcode('yt', 'my_shortcode_youtube');

function custom_sender_info($value, $key, $insert_contact_data_id)
{
	//送信日時
	if ($key === 'send_datetime') {
		return date_i18n('Y/m/d l H:i:s');
	}

	//ブラウザ
	if ($key === 'user_agent') {
		return $_SERVER["HTTP_USER_AGENT"];
	}

	//IPアドレス
	if ($key === 'ip') {
		$ip = $_SERVER["REMOTE_ADDR"];
		return $ip;
	}

	//ホスト名
	if ($key === 'host') {
		$host = gethostbyaddr($_SERVER["REMOTE_ADDR"]);
		return $host;
	}

	return $value;
}
add_filter('mwform_custom_mail_tag_mw-wp-form-22510', 'custom_sender_info', 10, 3);

//パスワード保護記事を一覧から非表示にする
function password_post_exclude_archive_posts($query)
{
	if (is_singular() || is_admin()) {
		return;
	}
	$query->set('has_password', false);
}
add_action('pre_get_posts', 'password_post_exclude_archive_posts');

//連載のみ記事表示を無限にする
function my_pre_get_posts($query)
{
	if (is_admin() || !$query->is_main_query()) {
		return;
	} elseif ($query->is_tax('series_contents')) {
		$query->set('posts_per_page', -1);
		return;
	}
}
add_action('pre_get_posts', 'my_pre_get_posts');

// 記事一覧にテンプレート表示
function add_posts_columns($columns)
{
	$columns['template'] = 'テンプレート';
	return $columns;
}
function custom_posts_column($column_name, $post_id)
{
	if ($column_name == 'template') {
		$template = 'Default';
		$templates = get_page_templates();
		$template_slug = get_page_template_slug($post_id);
		foreach ($templates as $name => $file) {
			if ($file == $template_slug) {
				$template = $name;
			}
		}
		echo $template;
	}
}
add_filter('manage_posts_columns', 'add_posts_columns');
add_action('manage_posts_custom_column', 'custom_posts_column', 10, 2);

// 固定ページ一覧にテンプレート表示
function add_pages_columns($columns)
{
	$columns['template'] = 'テンプレート';
	return $columns;
}
function custom_pages_column($column_name, $post_id)
{
	if ($column_name == 'template') {
		$template = 'Default';
		$templates = get_page_templates();
		$template_slug = get_page_template_slug($post_id);
		foreach ($templates as $name => $file) {
			if ($file == $template_slug) {
				$template = $name;
			}
		}
		echo $template;
	}
}
add_filter('manage_pages_columns', 'add_pages_columns');
add_action('manage_pages_custom_column', 'custom_pages_column', 10, 2);


// head内にカスタム用のコードを追加する
function meta_headcustomtags()
{
	$headcustomtag = <<<EOM

<!--insertfunction-->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-9Q0M0VMS56"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-9Q0M0VMS56');
</script>

EOM;
	echo $headcustomtag;
}
add_action('wp_head', 'meta_headcustomtags', 99);



function remove_cssjs_ver2($src)
{
	if (strpos($src, 'ver='))
		$src = remove_query_arg('ver', $src);
	return $src;
}
add_filter('style_loader_src', 'remove_cssjs_ver2', 9999);
add_filter('script_loader_src', 'remove_cssjs_ver2', 9999);

//メールアドレス変更時のメール送信STOP
add_filter('send_email_change_email', '__return_false');
//パスワード変更時のメール送信STOP
add_filter('send_password_change_email', '__return_false');



//ノンタンフェアのタグに属する記事にオリジナルテンプレートを適用

function load_custom_template_for_nontan_fair($template)
{
	if (is_single() && has_tag('nontan-fair')) {
		$custom_template = locate_template('single-nontan-fair.php');
		if ($custom_template) {
			return $custom_template;
		}
	}
	return $template;
}
add_filter('single_template', 'load_custom_template_for_nontan_fair');


add_action('rest_api_init', function () {
	error_log('REST URL: ' . rest_url());
});
