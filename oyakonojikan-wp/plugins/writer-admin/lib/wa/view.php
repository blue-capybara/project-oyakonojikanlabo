<?php

class WA_View {
	public static function get_link( $slug ) {
		$pages = WA::get_config( 'links' );

		if ( ! isset( $pages[ $slug ] ) ) {
			return '';
		}

		$page = $pages[ $slug ];
		$url  = '';

		if ( ! empty( $page['template'] ) ) {
			$page = IWF_Post::get_by_template( $page['template'] );

			if ( $page ) {
				$url = get_permalink( $page );
			}

		} else if ( ! empty( $page['url'] ) ) {
			$url = $page['url'];
		}

		return $url;
	}

	public static function get_sidebar() {
		ob_start();
		?>
		<!-- sidebar: style can be found in sidebar.less -->
		<section class="sidebar">
			<!-- Sidebar Menu -->
			<ul class="sidebar-menu" data-widget="tree">
				<!-- Optionally, you can add icons to the links -->
				<?php echo static::get_sidebar_recursive( WA::get_config( 'structure' ) ) ?>
			</ul>
			<!-- /.sidebar-menu -->
		</section>
		<!-- /.sidebar -->
		<?php
		return ob_get_clean();
	}

	protected static function get_sidebar_recursive( $menus ) {
		if ( ! is_array( $menus ) ) {
			return '';
		}

		ob_start();

		foreach ( $menus as $menu_slug => $menu ) {
			if ( ! empty( $menu['ignore'] ) ) {
				continue;
			}

			$icon      = '';
			$base_page = false;

			if ( ! empty( $menu['template'] ) ) {
				$base_page = IWF_Post::get_by_template( $menu['template'] );
			}

			if ( ! empty( $menu['title'] ) ) {
				$title = $menu['title'];

			} else if ( $base_page ) {
				$title = get_the_title( $base_page );

			} else {
				continue;
			}

			if ( ! empty( $menu['icon'] ) ) {
				$icon = $menu['icon'];
			}

			if ( ! empty( $menu['link'] ) || empty( $menu['children'] ) ) {
				if ( ! empty( $menu['url'] ) ) {
					$link = $menu['url'];

				} else if ( ! empty( $menu['link'] ) ) {
					$link = static::get_link( $menu['link'] );

				} else if ( $base_page ) {
					$link = get_permalink( $base_page );

				} else {
					$link = 'javascript:void(0);';
				}

				$target = '';

				if ( ! empty( $menu['blank'] ) ) {
					$target = 'target="_blank"';
				}
				?>
				<li class="menu-<?php echo $menu_slug ?>"><a href="<?php echo $link ?>"<?php echo $target ?>><?php echo $icon ? '<i class="' . $icon . '"></i> ' : '' ?><span><?php echo $title ?></span></a></li>
				<?php
			} else {
				?>
				<li class="treeview menu-<?php echo $menu_slug ?>">
					<a href="#"><?php echo $icon ? '<i class="' . $icon . '"></i> ' : '' ?><span><?php echo $title ?></span> <span class="pull-right-container"><i class="fa fa-angle-left pull-right"></i></span></a>
					<ul class="treeview-menu">
						<?php echo static::get_sidebar_recursive( $menu['children'] ) ?>
					</ul>
				</li>
				<?php
			}
		}

		return ob_get_clean();
	}

	public static function get_post_status( $post ) {
		$post = get_post( $post );

		switch ( $post->post_status ) {
			case 'publish':
			case 'private':
			case 'future':
				$status = '<span class="label bg-olive">納品済み</span>';
				break;

			case 'draft':
				$status = '<span class="label bg-aqua">下書き</span>';
				break;

			case 'pending':
				$status = '<span class="label bg-red">納品確認中</span>';
				break;
		}

		if ( get_post_meta( $post->ID, 'wa_remand', true ) ) {
			$status = '<span class="label bg-orange">差し戻し</span>';
		}

		return apply_filters( 'wa/view/get_post_status', $status, $post );
	}

	public static function get_pager( $paged = null, $total_pages = null, $range = 5, $class = '' ) {
		$html = '';

		if ( ! $paged ) {
			$paged = max( 1, get_query_var( 'paged' ) );
		}

		if ( ! $total_pages ) {
			global $wp_query;

			$total_pages = $wp_query->max_num_pages;
		}

		if ( $total_pages > 1 ) {
			$odd = 0;

			if ( $paged <= $range ) {
				$offset = 1;
				$odd    += $range - $paged + 1;

			} else {
				$offset = $paged - $range;
			}

			$max = $paged + $odd + $range;

			if ( $max > $total_pages ) {
				$odd = $max - $total_pages;
				$max = $total_pages;

				if ( $offset > $odd ) {
					$offset -= $odd;

				} else {
					$offset = 1;
				}
			}

			$html .= '<ul class="pagination ' . $class . '">';

			if ( $paged > 1 ) {
				$html .= '<li><a href="' . get_pagenum_link( $paged - 1 ) . '">«</a></li>';
			}

			for ( $i = $offset; $i <= $max; $i ++ ) {
				$html .= ( $paged == $i ) ? '<li class="active">' : '<li>';
				$html .= '<a href="' . get_pagenum_link( $i ) . '">' . $i . '</a>';
				$html .= '</li>';
			}

			if ( $paged < $total_pages ) {
				$html .= '<li><a href="' . get_pagenum_link( $paged + 1 ) . '">»</a></li>';
			}

			$html .= '</ul>';
		}

		return $html;
	}
}