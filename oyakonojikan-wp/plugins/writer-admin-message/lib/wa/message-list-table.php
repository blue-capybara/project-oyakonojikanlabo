<?php

class WA_Message_List_Table extends WP_List_Table {
	public function get_columns() {
		return array(
			'wa_msg_title'  => 'タイトル',
			'wa_msg_count'  => '件数',
			'wa_msg_user'   => '宛先ユーザー',
			'wa_msg_sender' => '最終送信者',
			'wa_msg_date'   => '最終送信日',
		);
	}

	public function prepare_items() {
		$this->_column_headers = array(
			$this->get_columns(),
			array(),
			$this->get_sortable_columns()
		);

		$per_page = 20;
		$paged    = $this->get_pagenum();
		$offset   = ( $paged - 1 ) * $per_page;

		require_once WA_MESSAGE_PATH . 'lib/wa/message-query.php';
		$message_query = new WA_Message_Query( array(
			'per_page' => $per_page,
			'offset'   => $offset
		) );

		$total_count = $message_query->get_total_count();
		$total_pages = $message_query->get_total_pages();
		$this->items = $message_query->get_results();

		$this->set_pagination_args( array(
			'total_items' => $total_count,
			'total_pages' => $total_pages,
			'per_page'    => $per_page,
		) );
	}

	public function column_wa_msg_title( $item ) {
		$html = '';

		if ( ! $item->admin_read ) {
			$html = '<span class="wa-msg-unread">未読</span>';
		}

		$html .= iwf_html_tag( 'a', array( 'href' => remove_query_arg( array( 'deleted' ), add_query_arg( array( 'action' => 'view', 'id' => $item->ID ) ) ) ), get_the_title( $item->ID ) );
		$html .= $this->row_actions( array( 'delete' => iwf_html_tag( 'a', array( 'href' => remove_query_arg( array( 'deleted' ), add_query_arg( array( 'action' => 'delete', 'id' => $item->ID, '_wpnonce' => wp_create_nonce( 'delete' . $item->ID ) ) ) ), 'onclick' => 'return confirm("本当に削除してもよろしいですか？")' ), '削除' ) ) );

		return $html;
	}

	public function column_wa_msg_count( $item ) {
		return $item->count . '件';
	}

	public function column_wa_msg_user( $item ) {
		$user = get_userdata( $item->post_author );

		return WA_User::is_writer( $user->ID ) ? WA_User::get_name( $user->ID ) : '-';
	}

	public function column_wa_msg_sender( $item ) {
		$user = get_userdata( $item->post_author );

		if ( ! WA_Message::to_admin( $item->ID ) ) {
			return '管理者';
		}

		return WA_User::is_writer( $user->ID ) ? WA_User::get_name( $user->ID ) : '-';
	}

	public function column_wa_msg_date( $item ) {
		return mysql2date( 'Y.m.d H:i:s', $item->post_date );
	}
}