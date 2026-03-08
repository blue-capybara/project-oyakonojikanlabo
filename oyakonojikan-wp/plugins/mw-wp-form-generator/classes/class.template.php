<?php
/**
 * MW_WP_Form_Generator_Template_Base
 * Version    : 1.0.1
 * Author     : Takashi Kitajima
 * Created    : November 1, 2014
 * Modified   : January 5, 2015
 * License    : GPLv2
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 */
class MW_WP_Form_Generator_Template_Base {
	
	/**
	 * __construct
	 */
	public function __construct() {
		add_filter( 'mw-wp-form-generator-content', array( $this, 'create_content' ), 10, 3 );
	}

	/**
	 * create_content
	 * @param string $content 本文
	 * @param array $items フォーム項目
	 * @param array $other_items エラー要素などの非フォーム項目
	 * @return string $content
	 */
	public function create_content( $content, $items, $other_items ) {
		return $content;
	}
}
