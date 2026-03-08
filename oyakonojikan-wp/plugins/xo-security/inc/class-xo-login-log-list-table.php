<?php
/**
 * XO Security log list table.
 *
 * @package xo-security
 */

if ( ! class_exists( 'WP_List_Table' ) ) {
	require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

/**
 * XO Security log list table class.
 */
class XO_Login_Log_List_Table extends WP_List_Table {
	/**
	 * Default status.
	 *
	 * @var string
	 */
	public $default_status = '';

	/**
	 * Construction.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		parent::__construct(
			array(
				'singular' => 'loginlog',
				'plural'   => 'loginlogs',
				'ajax'     => false,
			)
		);

		wp_get_current_user();
	}

	/**
	 * Column default value.
	 *
	 * @param object|array $item Item.
	 * @param string       $column_name Column name.
	 * @return string
	 */
	public function column_default( $item, $column_name ) {
		return $item[ $column_name ];
	}

	/**
	 * Column success.
	 *
	 * @param object|array $item Item.
	 */
	public function column_success( $item ) {
		return $item['success'] ? __( 'Success', 'xo-security' ) : __( 'Failure', 'xo-security' );
	}

	/**
	 * Column checkbox.
	 *
	 * @param object|array $item Item.
	 */
	public function column_cb( $item ) {
		/**
		 * Filters whether to show the bulk edit checkbox for login log.
		 *
		 * @since 3.4.2
		 *
		 * @param bool $show Whether to show the checkbox.
		 */
		if ( apply_filters( 'xo_security_loginlog_checkbox', true ) ) {
			printf( '<input type="checkbox" name="%1$s[]" value="%2$s" />', esc_attr( $this->_args['singular'] ), esc_attr( $item['id'] ) );
		}
	}

	/**
	 * Column type.
	 *
	 * @param object|array $item Item.
	 */
	public function column_type( $item ) {
		$s = '';
		if ( XO_Security::LOGIN_TYPE_LOGIN_PAGE === (int) $item['type'] ) { // phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
			$s = esc_html__( 'Login page', 'xo-security' );
		} elseif ( XO_Security::LOGIN_TYPE_XMLRPC === (int) $item['type'] ) { // phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
			$s = esc_html__( 'XMLRPC', 'xo-security' );
		}
		return $s;
	}

	/**
	 * Get table columns.
	 *
	 * @return string[] Column name to header HTML.
	 */
	public function get_columns() {
		global $current_user;

		$columns = array(
			'cb'         => '<input type="checkbox" />',
			'login_time' => __( 'Date', 'xo-security' ),
			'success'    => __( 'Result', 'xo-security' ),
			'ip_address' => __( 'IP address', 'xo-security' ),
			'type'       => __( 'Type', 'xo-security' ),
			'lang'       => __( 'Language', 'xo-security' ),
			'user_agent' => __( 'User Agent', 'xo-security' ),
		);
		if ( $current_user->has_cap( 'administrator' ) ) {
			$columns['user_name'] = __( 'Username', 'xo-security' );
		}
		return $columns;
	}

	/**
	 * Get table sortable columns.
	 *
	 * @return string[] Column name to header HTML.
	 */
	protected function get_sortable_columns() {
		$sortable_columns = array(
			'login_time' => array( 'logintime', true ),
			'success'    => array( 'success', false ),
			'ip_address' => array( 'ipaddress', false ),
			'type'       => array( 'type', false ),
			'lang'       => array( 'lang', false ),
			'user_name'  => array( 'username', false ),
		);
		return $sortable_columns;
	}

	/**
	 * Get bulk actions for the table.
	 *
	 * @return string[] Actions, code => text.
	 */
	protected function get_bulk_actions() {
		$actions = array( 'delete' => __( 'Delete', 'xo-security' ) );
		return $actions;
	}

	/**
	 * Displays a status drop-down.
	 */
	protected function status_dropdown() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a view, not a model or controller.
		$status = isset( $_GET['status'] ) ? sanitize_text_field( wp_unslash( $_GET['status'] ) ) : $this->default_status;

		echo '<label for="filter-by-status" class="screen-reader-text">' . esc_html__( 'Filter by results', 'xo-security' ) . '</label>';
		echo '<select name="status" id="filter-by-status">';
		echo '<option' . selected( $status, '', false ) . ' value="">' . esc_html__( 'All results', 'xo-security' ) . '</option>';
		printf( "<option %s value='%s'>%s</option>\n", selected( $status, '0', false ), '0', esc_html__( 'Failure', 'xo-security' ) );
		printf( "<option %s value='%s'>%s</option>\n", selected( $status, '1', false ), '1', esc_html__( 'Success', 'xo-security' ) );
		echo '</select>' . "\n";
	}

	/**
	 * Displays a users drop-down.
	 */
	protected function users_dropdown() {
		global $current_user;

		if ( $current_user->has_cap( 'administrator' ) ) {
			$users = get_users();

			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a view, not a model or controller.
			$user_login = isset( $_GET['u'] ) ? sanitize_text_field( wp_unslash( $_GET['u'] ) ) : '';

			echo '<label for="filter-by-user" class="screen-reader-text">' . esc_html__( 'Filter by user', 'xo-security' ) . '</label>';
			echo '<select name="u" id="filter-by-user">';
			echo '<option' . selected( $user_login, '', false ) . ' value="">' . esc_html__( 'All users', 'xo-security' ) . '</option>';
			foreach ( $users as $user ) {
				printf( "<option %s value='%s'>%s</option>\n", selected( $user_login, $user->user_login, false ), esc_html( $user->user_login ), esc_html( $user->user_login ) );
			}
			echo '</select>' . "\n";
		} else {
			echo '<label for="filter-by-user" class="screen-reader-text">' . esc_html__( 'Filter by user', 'xo-security' ) . '</label>';
			echo '<select name="u" id="filter-by-user">';
			printf( '<option selected="selected" value="%s">%s</option>', esc_html( $current_user->user_login ), esc_html( $current_user->user_login ) );
			echo '</select>' . "\n";
		}
	}

	/**
	 * Extra controls to be displayed between bulk actions and pagination.
	 *
	 * @param string $which Which.
	 */
	protected function extra_tablenav( $which ) {
		echo '<div class="alignleft actions">';
		if ( 'top' === $which && ! is_singular() ) {
			$this->status_dropdown();
			$this->users_dropdown();
			submit_button( __( 'Filter', 'xo-security' ), 'button', 'filter_action', false, array( 'id' => 'post-query-submit' ) );
		}
		echo '</div>';
	}

	/**
	 * Prepares the list of items for displaying.
	 */
	public function prepare_items() {
		global $wpdb, $current_user;

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$status = isset( $_GET['status'] ) ? sanitize_text_field( wp_unslash( $_GET['status'] ) ) : $this->default_status;

		$per_page = $this->get_items_per_page( 'login_log_per_page', 100 );

		if ( $current_user->has_cap( 'administrator' ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$user_login = isset( $_GET['u'] ) ? sanitize_text_field( wp_unslash( $_GET['u'] ) ) : '';
		} else {
			$user_login = $current_user->user_login;
		}

		list( $columns, $hidden ) = $this->get_column_info();

		$sortable = $this->get_sortable_columns();

		$this->_column_headers = array( $columns, $hidden, $sortable );

		$this->process_bulk_action();

		// WHERE.
		$wheres = array();
		if ( '' !== $status ) {
			$wheres[] = $wpdb->prepare( 'success=%d', $status );
		}
		if ( '' !== $user_login ) {
			$wheres[] = $wpdb->prepare( 'user_name=%s', $user_login );
		}
		$where = ( count( $wheres ) ) ? ' WHERE ' . implode( ' AND ', $wheres ) : '';

		// Get all data records.
		$total_items = intval( $wpdb->get_var( "SELECT count(*) FROM {$wpdb->prefix}xo_security_loginlog {$where}" ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery

		$orderby_mapping = array(
			'success'   => 'success',
			'logintime' => 'login_time',
			'ipaddress' => 'ip_address',
			'type'      => 'login_type',
			'lang'      => 'lang',
			'useragent' => 'user_agent',
			'username'  => 'user_name',
		);

		if ( isset( $_REQUEST['orderby'] ) && isset( $orderby_mapping[ $_REQUEST['orderby'] ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$orderby = $orderby_mapping[ $_REQUEST['orderby'] ]; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput, WordPress.Security.NonceVerification.Recommended
		} else {
			$orderby = 'login_time';
		}

		$order = ( isset( $_REQUEST['order'] ) && 'asc' === $_REQUEST['order'] ) ? 'ASC' : 'DESC'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		$start = ( $this->get_pagenum() - 1 ) * $per_page;

		$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT id,success,login_time,ip_address,login_type,lang,user_agent,user_name FROM {$wpdb->prefix}xo_security_loginlog {$where} ORDER BY {$orderby} {$order} LIMIT %d, %d;", // phpcs:ignore
				$start,
				$per_page
			),
			'ARRAY_A'
		);

		foreach ( $rows as $row ) {
			$item = array(
				'id'         => esc_html( $row['id'] ),
				'success'    => esc_html( $row['success'] ),
				'login_time' => esc_html( $row['login_time'] ),
				'ip_address' => esc_html( $row['ip_address'] ),
				'type'       => esc_html( $row['login_type'] ),
				'lang'       => esc_html( $row['lang'] ),
				'user_agent' => esc_html( $row['user_agent'] ),
				'user_name'  => esc_html( $row['user_name'] ),
			);

			$this->items[] = $item;
		}

		$this->set_pagination_args(
			array(
				'total_items' => $total_items,
				'per_page'    => $per_page,
				'total_pages' => ceil( $total_items / $per_page ),
			)
		);
	}

	/**
	 * Gets the name of the primary column.
	 */
	protected function get_primary_column_name() {
		return 'login_time';
	}

	/**
	 * Process bulk actions.
	 */
	public function process_bulk_action() {
		global $wpdb, $current_user;

		if ( 'delete' !== $this->current_action() ) {
			return;
		}

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		if ( empty( $_REQUEST['_wpnonce'] ) || ! wp_verify_nonce( wp_unslash( $_REQUEST['_wpnonce'] ), 'bulk-' . $this->_args['plural'] ) ) {
			return;
		}

		$ids = isset( $_REQUEST['loginlog'] ) ? wp_parse_id_list( wp_unslash( $_REQUEST['loginlog'] ) ) : array();
		$ids = implode( ',', array_map( 'absint', $ids ) );
		if ( ! empty( $ids ) ) {
			if ( $current_user->has_cap( 'administrator' ) ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$wpdb->query( "DELETE FROM {$wpdb->prefix}xo_security_loginlog WHERE id IN ($ids);" );
			} else {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->prefix}xo_security_loginlog WHERE id IN ($ids) AND user_name = %s;", $current_user->user_login ) );
			}
		}
	}
}
