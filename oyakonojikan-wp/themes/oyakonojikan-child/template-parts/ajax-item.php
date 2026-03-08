<?php
require_once '../../../../wp-load.php';

$offset         = isset($_POST['post_num_now']) ? $_POST['post_num_now'] : 1;
$posts_per_page = isset($_POST['post_num_add']) ? $_POST['post_num_add'] : 0;


$ajax_query = new WP_Query(
	array(
		'post_type'      => 'post',
		'posts_per_page' => $posts_per_page,
		'offset'         => $offset,
	)
);
$all_query = new WP_Query(
	array(
		'post_type'      => 'post',
		'posts_per_page' => -1,
	)
);
$all_post_count = $all_query->found_posts;
?>
<?php if ($ajax_query->have_posts()) : ?>
	<?php $entry_item = ''; ?>
	<?php ob_start(); ?>
  <?php while ($ajax_query->have_posts()) : ?>
    <?php $ajax_query->the_post(); ?>

		<?php get_template_part('template-parts/tmp-topics'); ?>

<?php endwhile; ?>
	<?php $entry_item .= ob_get_contents(); ?>
	<?php ob_end_clean(); ?>
<?php endif; ?>
<?php

wp_reset_postdata();
echo json_encode(array($entry_item, $all_post_count - ($offset + $ajax_query->post_count)));