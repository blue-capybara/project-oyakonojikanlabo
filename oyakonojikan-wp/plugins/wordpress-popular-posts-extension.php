<?php

/**
 * Plugin Name: Wordpress Popular Posts Extension
 * Plugin URI: http://inspire-tech.jp/
 * Description: This plugin is extension of the WordPress Popular Posts plugin.
 * Version: 1.1.0
 * Author: Masayuki Ietomi
 * Author URI: http://inspire-tech.jp
 * License: GPL2
 */
class WordpressPopularPosts_Extension {
	protected $allowed_order_range = array( 'all', 'daily', 'yesterday', 'monthly', 'weekly' );

	protected $allowed_orderby = array( 'views', 'avg', 'comments' );

	public function __construct() {
		add_filter( 'posts_clauses', array( $this, 'query_filter' ), 10, 2 );
	}

	/**
	 * @param $sql array
	 * @param $the_query WP_Query
	 *
	 * @return array
	 */
	public function query_filter( $sql, $the_query ) {
		if ( ! class_exists( 'WordpressPopularPosts' ) ) {
			return $sql;
		}

		$order_range = $the_query->get( 'order_range' );
		$orderby     = $the_query->get( 'orderby' );


		if ( in_array( $order_range, $this->allowed_order_range ) && in_array( $orderby, $this->allowed_orderby ) ) {
			/** @var $wpdb wpdb */
			global $wpdb;

			if ( $order_range === 'all' ) {
				$table = $wpdb->prefix . "popularpostsdata";

				if ( $orderby === 'comments' ) {
					$sql['where']   .= " AND {$wpdb->posts}.comment_count > 0 ";
					$sql['orderby'] = "{$wpdb->posts}.comment_count DESC ";

				} else if ( $orderby === 'views' ) {
					$sql['fields']  .= ", v.pageviews AS 'pageviews' ";
					$sql['join']    .= " INNER JOIN {$table} AS v ON {$wpdb->posts}.ID = v.postid ";
					$sql['orderby'] = "pageviews DESC ";

				} else {
					$sql['fields']  .= ", (v.pageviews / (IF(DATEDIFF(CURRENT_DATE(), MIN(v.day)) > 0, DATEDIFF(CURRENT_DATE(), MIN(v.day)), 1))) AS 'avg_views' ";
					$sql['join']    .= " INNER JOIN {$table} AS v ON {$wpdb->posts}.ID = v.postid ";
					$sql['orderby'] = "avg_views DESC ";
					$sql['groupby'] = "{$wpdb->posts}.ID";
				}

			} else {
				$interval       = "";
				$cache_table    = $wpdb->prefix . "popularpostssummary";
				$datetime_field = 'view_datetime';

				switch ( $order_range ) {
					case "yesterday":
					case "daily":
						$interval = "1 DAY";
						break;

					case "weekly":
						$interval = "1 WEEK";
						break;

					case "monthly":
						$interval = "1 MONTH";
						break;
				}

				if ( $orderby === 'comments' ) {
					$sql['join']    .= " INNER JOIN (SELECT comment_post_ID AS 'id', COUNT(comment_post_ID) AS 'comment_count', MAX(comment_date) AS comment_date FROM {$wpdb->comments} WHERE comment_date > DATE_SUB(CURRENT_DATE(), INTERVAL {$interval}) AND comment_approved = 1 GROUP BY id) AS c ON {$wpdb->posts}.ID = c.id ";
					$sql['orderby'] = "c.comment_count DESC, c.comment_date DESC ";

				} else if ( $orderby === 'views' ) {
					$sql['fields']  .= ", v.pageviews AS 'pageviews' ";
					$sql['join']    .= " INNER JOIN (SELECT postid, IFNULL(SUM(pageviews), 0) AS pageviews FROM {$cache_table} WHERE {$datetime_field} > DATE_SUB(CURRENT_DATE(), INTERVAL {$interval}) GROUP BY postid) AS v ON {$wpdb->posts}.ID = v.postid ";
					$sql['orderby'] = "v.pageviews DESC ";

				} else {
					$sql['fields']  .= ", ( v.pageviews/(IF ( DATEDIFF(CURRENT_DATE(), DATE_SUB(CURRENT_DATE(), INTERVAL {$interval})) > 0, DATEDIFF(CURRENT_DATE(), DATE_SUB(CURRENT_DATE(), INTERVAL {$interval})), 1) ) ) AS 'avg_views' ";
					$sql['join']    .= " INNER JOIN (SELECT postid, IFNULL(SUM(pageviews), 0) AS pageviews FROM {$cache_table} WHERE {$datetime_field} > DATE_SUB(CURRENT_DATE(), INTERVAL {$interval}) GROUP BY postid) AS v ON {$wpdb->posts}.ID = v.postid ";
					$sql['orderby'] = "avg_views DESC ";
				}
			}
		}

		return $sql;
	}
}

$wordpresspopularposts_extension = new WordpressPopularPosts_Extension();