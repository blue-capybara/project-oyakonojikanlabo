<?php
/**
 * MU プラグイン用サンプルコード（未ロード）
 *
 * このファイルはリポジトリ内のメモです。WordPress には自動では読み込まれません。
 * 実際に使う場合は、`wp-content/mu-plugins/custom-acf-fields.php` などへ配置してください。
 *
 * 目的:
 * - 記事ごとのカスタム JS / CSS を ACF で入力できるようにする
 * - WPGraphQL から取得し、フロント側で条件付き注入できるようにする
 *
 * 前提:
 * - Advanced Custom Fields Pro が有効
 * - WPGraphQL + WPGraphQL for ACF が有効
 */

add_action( 'acf/init', function () {
	if ( function_exists( 'acf_add_local_field_group' ) ) {
		acf_add_local_field_group( [
			'key'                   => 'group_custom_headless_injections',
			'title'                 => 'Headless 用カスタムコード',
			'fields'                => [
				[
					'key'               => 'field_custom_css',
					'label'             => 'カスタムCSS (記事/固定ページ)',
					'name'              => 'custom_css',
					'type'              => 'textarea',
					'instructions'      => "本ページ/記事にだけ適用する CSS を記述します。\nできるだけスコープを限定してください（例: .post-id-{{post_id}} .foo {...}）。",
					'rows'              => 8,
					'new_lines'         => '',
					'esc_html'          => 0,
				],
				[
					'key'               => 'field_custom_js',
					'label'             => 'カスタムJavaScript (記事/固定ページ)',
					'name'              => 'custom_js',
					'type'              => 'textarea',
					'instructions'      => "本ページ/記事にだけ適用する JS を記述します。\n即時実行(IIFE)推奨。依存がある場合はCDN等の読み込み確認をしてください。",
					'rows'              => 10,
					'new_lines'         => '',
					'esc_html'          => 0,
				],
			],
			'location'              => [
				[
					[
						'param'    => 'post_type',
						'operator' => '==',
						'value'    => 'post',
					],
				],
				[
					[
						'param'    => 'post_type',
						'operator' => '==',
						'value'    => 'page',
					],
				],
			],
			'style'                 => 'seamless',
			'position'              => 'normal',
			'active'                => true,
			'show_in_rest'          => 0,
		] );
	}
} );

/**
 * WPGraphQL へフィールドを公開
 */
add_action( 'graphql_register_types', function () {
	if ( ! function_exists( 'register_graphql_field' ) ) {
		return;
	}

	register_graphql_field(
		'Post',
		'customCss',
		[
			'type'        => 'String',
			'description' => '記事/固定ページ専用のカスタムCSS',
			'resolve'     => function ( $post ) {
				return get_field( 'custom_css', $post->ID );
			},
		]
	);

	register_graphql_field(
		'Post',
		'customJs',
		[
			'type'        => 'String',
			'description' => '記事/固定ページ専用のカスタムJavaScript',
			'resolve'     => function ( $post ) {
				return get_field( 'custom_js', $post->ID );
			},
		]
	);

	register_graphql_field(
		'Page',
		'customCss',
		[
			'type'        => 'String',
			'description' => '記事/固定ページ専用のカスタムCSS',
			'resolve'     => function ( $page ) {
				return get_field( 'custom_css', $page->ID );
			},
		]
	);

	register_graphql_field(
		'Page',
		'customJs',
		[
			'type'        => 'String',
			'description' => '記事/固定ページ専用のカスタムJavaScript',
			'resolve'     => function ( $page ) {
				return get_field( 'custom_js', $page->ID );
			},
		]
	);
} );
