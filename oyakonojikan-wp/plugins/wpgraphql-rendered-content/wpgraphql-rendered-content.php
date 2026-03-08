<?php

/**
 * Plugin Name: WPGraphQL Rendered Content
 * Description: GraphQLにショートコード展開済みのHTMLを返すフィールドを追加
 */

add_filter('graphql_register_types', function () {
	register_graphql_field('Post', 'renderedContent', [
		'type' => 'String',
		'description' => 'ショートコードを展開したコンテンツ',
		'resolve' => function ($post) {
			return apply_filters('the_content', $post->post_content);
		}
	]);
});
