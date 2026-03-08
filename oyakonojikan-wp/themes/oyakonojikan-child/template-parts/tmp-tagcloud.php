<?php
wp_list_categories('
orderby=count
&order=DESC
&taxonomy=post_tag
&title_li=
&number=30
&show_count=1
');
?>

<div class="tags_wrap">
	<?php
	// $tagsとして空の配列を定義
	$tags = array();

	// $postsとして全投稿データを取得
	$posts = get_posts(array(
		'post_type' => 'post',
		'post_status' => 'publish',
		'meta_key' => 'views', //（WP-PostViewsの閲覧数データを取得）
		'posts_per_page' => -1
	));

	foreach ($posts as $post) {
		$posttags = get_the_tags();
		if ($posttags) {
			foreach ($posttags as $tag) {
				// タグ名を$tag_nameと定義
				$tag_name = $tag->name;
				// ビュー数を$view_countと定義
				$view_count = (int) get_post_meta($post->ID, 'views', true);

				if ($tags["$tag_name"]) {
					// $tag_nameが連想配列内に存在する場合、$view_countを足し合わせる
					$tags["$tag_name"] += $view_count;
				} else {
					// 連想配列にarray( $tag_name => $view_count)を入れる
					$tags += array($tag_name => $view_count);
				}
			}
		}
	}
	// ビュー数順に並べる
	arsort($tags);
	?>
	<?php
	foreach ($tags as $key => $value) :
		$tag = get_term_by('name', $key, 'post_tag');
	?>
		<a class="tags_link" href="<?php echo get_tag_link($tag->term_id); ?>">#<?php echo $tag->name; ?></a>
	<?php endforeach; ?>
</div>