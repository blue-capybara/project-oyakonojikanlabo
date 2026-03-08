<?php

class WA_Message_Query {
	protected $args;
	protected $total_pages;
	protected $total_count;
	protected $results;

	public function __construct( $args = array() ) {
		$args = wp_parse_args( $args, array(
			'offset'   => 0,
			'per_page' => 20,
			'user_id'  => 0
		) );

		$this->args = $args;
	}

	public function query() {
		global $wpdb;

		$where = '';

		if ( $this->args['user_id'] ) {
			$where = $wpdb->prepare( " AND {$wpdb->posts}.post_author = %d", $this->args['user_id'] );
		}

		$results = $wpdb->get_results( <<< EOF
SELECT SQL_CALC_FOUND_ROWS {$wpdb->posts}.*, tmp.count AS count, tmp.user_read AS user_read, tmp.admin_read AS admin_read
FROM {$wpdb->posts}
	INNER JOIN (
		SELECT MAX(ID) AS ID, MAX(post_date) as post_date, COUNT(*) AS count, MIN(user_read) AS user_read, MIN(admin_read) AS admin_read
		FROM (
			SELECT {$wpdb->posts}.ID, {$wpdb->posts}.post_date, mt1.meta_value AS tree_id, mt2.meta_value AS user_read, mt3.meta_value AS admin_read
			FROM {$wpdb->posts}
			LEFT JOIN {$wpdb->postmeta} AS mt1 ON {$wpdb->posts}.ID = mt1.post_id AND mt1.meta_key = 'tree_id'
			LEFT JOIN {$wpdb->postmeta} AS mt2 ON {$wpdb->posts}.ID = mt2.post_id AND mt2.meta_key = 'user_read'
			LEFT JOIN {$wpdb->postmeta} AS mt3 ON {$wpdb->posts}.ID = mt3.post_id AND mt3.meta_key = 'admin_read'
			WHERE {$wpdb->posts}.post_type = 'wa_message' AND {$wpdb->posts}.post_status = 'publish' {$where}
			ORDER BY {$wpdb->posts}.post_date DESC
		) tmp
		GROUP BY tree_id
	) AS tmp ON {$wpdb->posts}.ID = tmp.ID
ORDER BY post_date DESC
LIMIT {$this->args['offset']}, {$this->args['per_page']}
EOF
		);

		$this->total_count = $wpdb->get_var( 'SELECT FOUND_ROWS()' );
		$this->total_pages = ceil( $this->total_count / $this->args['per_page'] );
		$this->results     = $results;
	}

	public function get_total_pages() {
		if ( ! $this->results ) {
			$this->query();
		}

		return $this->total_pages;
	}

	public function get_total_count() {
		if ( ! $this->results ) {
			$this->query();
		}

		return $this->total_count;
	}

	public function get_results() {
		if ( ! $this->results ) {
			$this->query();
		}

		return $this->results;
	}
}