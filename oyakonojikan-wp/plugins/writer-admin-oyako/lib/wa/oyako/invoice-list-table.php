<?php

class WA_Oyako_Invoice_List_Table extends WP_List_Table {
	public function get_columns() {
		return array(
			'wa_invoice_date'       => '日付',
			'wa_invoice_user'       => 'ユーザー',
			'wa_invoice_post_count' => '件数',
			'wa_invoice_amount'     => '金額',
			'wa_invoice_status'     => 'ステータス',
		);
	}

	public function prepare_items() {
		global $wpdb;

		$this->_column_headers = array(
			$this->get_columns(),
			array(),
			$this->get_sortable_columns()
		);

		$per_page = 20;
		$paged    = $this->get_pagenum();

		$the_query = new WP_Query( array(
			'post_type'      => 'wa_invoice',
			'post_status'    => 'publish',
			'posts_per_page' => $per_page,
			'paged'          => $paged,
		) );

		$total       = $the_query->found_posts;
		$pages       = $the_query->max_num_pages;
		$this->items = $the_query->get_posts();

		$this->set_pagination_args( array(
			'total_items' => $total,
			'total_pages' => $pages,
			'per_page'    => $per_page,
		) );
	}

	public function column_wa_invoice_date( $item ) {
		$html = iwf_html_tag( 'a', array( 'href' => remove_query_arg( array( 'deleted' ), add_query_arg( array( 'action' => 'view', 'id' => $item->ID ) ) ) ), get_the_time( 'Y年n月j日 H:i', $item ) );

		$row_actions             = array();
		$row_actions['download'] = iwf_html_tag( 'a', array( 'href' => remove_query_arg( array( 'download' ), add_query_arg( array( 'action' => 'download', 'id' => $item->ID, '_wpnonce' => wp_create_nonce( 'download' . $item->ID ) ) ) ) ), 'ダウンロード' );

		if ( get_post_meta( $item->ID, 'wa_payed', true ) ) {
			$row_actions['status'] = iwf_html_tag( 'a', array( 'href' => remove_query_arg( array( 'download' ), add_query_arg( array( 'action' => 'status', 'id' => $item->ID, '_wpnonce' => wp_create_nonce( 'status' . $item->ID ) ) ) ) ), '未払いにする' );

		} else {
			$row_actions['status'] = iwf_html_tag( 'a', array( 'href' => remove_query_arg( array( 'download' ), add_query_arg( array( 'action' => 'status', 'id' => $item->ID, '_wpnonce' => wp_create_nonce( 'status' . $item->ID ) ) ) ) ), '支払い済みにする' );
		}

		$row_actions['delete'] = iwf_html_tag( 'a', array( 'href' => remove_query_arg( array( 'deleted' ), add_query_arg( array( 'action' => 'delete', 'id' => $item->ID, '_wpnonce' => wp_create_nonce( 'delete' . $item->ID ) ) ) ), 'onclick' => 'return confirm("本当に削除してもよろしいですか？\n請求書の復元はできず、また記事の請求済みステータスを元に戻すことは出来ません。")' ), '削除' );

		$html .= $this->row_actions( $row_actions );

		return $html;
	}

	public function column_wa_invoice_user( $item ) {
		return WA_User::get_name( $item->post_author );
	}

	public function column_wa_invoice_post_count( $item ) {
		$billed_posts = get_post_meta( $item->ID, 'billed_posts', true );

		return $billed_posts ? count( $billed_posts ) . '件' : '-';
	}

	public function column_wa_invoice_amount( $item ) {
		$billed_posts  = get_post_meta( $item->ID, 'billed_posts', true );
		$billed_amount = 0;

		foreach ( $billed_posts as $billed_post ) {
			$billed_amount += $billed_post['amount'];
		}

		return $billed_amount ? number_format_i18n( $billed_amount ) . '円' : '-';
	}

	public function column_wa_invoice_status( $item ) {
		return get_post_meta( $item->ID, 'wa_payed', true ) ? '支払い済み' : '未払い';
	}
}