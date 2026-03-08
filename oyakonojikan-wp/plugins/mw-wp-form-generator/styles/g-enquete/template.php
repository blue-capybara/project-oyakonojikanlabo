<?php
/**
 * MW_WP_Form_Generator_Template_G_Enquete
 * Version    : 1.0.0
 * Author     : Takashi Kitajima
 * Created    : November 1, 2014
 * Modified   : November 17, 2015
 * License    : GPLv2
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 */
class MW_WP_Form_Generator_Template_G_Enquete extends MW_WP_Form_Generator_Template_Base {

	/**
	 * create_content
	 * @param string $content 本文
	 * @param array $items フォーム項目
	 * @param array $other_items エラー要素などの非フォーム項目
	 * @return string $content
	 */
	public function create_content( $content, $items, $other_items ) {
		$content = '<div class="g-enquete-items">';
		foreach ( $items as $item ) {
			$require = '';
			if ( $item['require'] === true ) {
				$require = '<span class="require">*</span> ';
			}

			$description = '';
			if ( $item['description'] ) {
				$description = sprintf(
					'<div class="g-enquete-description">%s</div>',
					wpautop( $item['description'] )
				);
			}

			$notes = '';
			if ( $item['notes'] ) {
				$notes = sprintf( '<span class="notes">%s</span>', esc_attr( $item['notes'] ) );
			}
			$content .= sprintf(
				'<div class="g-enquete-row">
					<div class="g-enquete-title">%s%s</div>
					<div class="g-enquete-item">%s%s%s</div>
				<!-- end .g-enquete-row --></div>',
				$require,
				$item['display_name'],
				$description,
				$item['shortcode'],
				$notes
			);
		}
		$content .= '<!-- end .g-enquete-items --></div>';
		$content .= implode( '', $other_items );
		$content .= '<div class="action-buttons">[mwform_backButton] [mwform_submitButton]</div>';
		return $content;
	}
}
new MW_WP_Form_Generator_Template_G_Enquete();
