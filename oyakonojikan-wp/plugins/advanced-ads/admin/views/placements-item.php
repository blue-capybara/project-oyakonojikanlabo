<?php
/**
 * Render item option for placements.
 *
 * @var string $_placement_slug slug of the current placement.
 * @var array $_placement information of the current placement.
 */
?>
<select id="advads-placements-item-<?php echo esc_attr( $_placement_slug ); ?>" name="advads[placements][<?php echo esc_attr( $_placement_slug ); ?>][item]">
	<option value=""><?php esc_html_e( '--not selected--', 'advanced-ads' ); ?></option>
	<?php if ( isset( $items['groups'] ) ) : ?>
	<optgroup label="<?php esc_html_e( 'Ad Groups', 'advanced-ads' ); ?>">
		<?php foreach ( $items['groups'] as $_item_id => $_item_title ) : ?>
		<option value="<?php echo esc_attr( $_item_id ); ?>"
								  <?php
									if ( isset( $_placement['item'] ) ) {
										selected( $_item_id, $_placement['item'] ); }
									?>
		><?php echo esc_html( $_item_title ); ?></option>
	<?php endforeach; ?>
	</optgroup>
	<?php endif; ?>
	<?php if ( isset( $items['ads'] ) ) : ?>
	<optgroup label="<?php esc_html_e( 'Ads', 'advanced-ads' ); ?>">
		<?php foreach ( $items['ads'] as $_item_id => $_item_title ) : ?>
		<option value="<?php echo esc_attr( $_item_id ); ?>"
								  <?php
									if ( isset( $_placement['item'] ) ) {
										selected( $_item_id, $_placement['item'] ); }
									?>
		><?php echo esc_html( $_item_title ); ?></option>
	<?php endforeach; ?>
	</optgroup>
	<?php endif; ?>
</select>
<?php
// link to item.
if ( isset( $_placement['item'] ) ) :
	$currently_linked_item = explode( '_', $_placement['item'] );
	$link_to_item          = false;
	switch ( $currently_linked_item[0] ) :
		case 'ad':
			$link_to_item = get_edit_post_link( $currently_linked_item[1] );
			break;
		case 'group':
			$link_to_item = admin_url( 'admin.php?page=advanced-ads-groups&advads-last-edited-group=' . $currently_linked_item[1] );
			break;
	endswitch;
	if ( $link_to_item ) :
		?>
	<a href="<?php echo esc_url( $link_to_item ); ?>"><span class="dashicons dashicons-external"></span></span></a>
		<?php
	endif;
endif;
