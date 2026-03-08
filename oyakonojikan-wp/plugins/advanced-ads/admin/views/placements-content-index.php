<?php
/**
 * Render content index option for placements.
 *
 * @var string $_placement_slug slug of the current placement.
 * @var array $_placement information of the current placement.
 */
$_positions = array(
	'after'  => __( 'after', 'advanced-ads' ),
	'before' => __( 'before', 'advanced-ads' ),
); ?>
<select name="advads[placements][<?php echo esc_attr( $_placement_slug ); ?>][options][position]">
	<?php foreach ( $_positions as $_pos_key => $_pos ) : ?>
	<option value="<?php echo esc_attr( $_pos_key ); ?>"
							  <?php
								if ( isset( $_placement['options']['position'] ) ) {
									selected( $_placement['options']['position'], $_pos_key );
								}
								?>
	>
		<?php echo esc_html( $_pos ); ?></option>
	<?php endforeach; ?>
</select>

<input type="number" name="advads[placements][<?php echo esc_attr( $_placement_slug ); ?>][options][index]" value="<?php echo ( isset( $_placement['options']['index'] ) ) ? absint( max( 1, (int) $_placement['options']['index'] ) ) : 1; ?>" min="1"/>.

<?php $tags = Advanced_Ads_Placements::tags_for_content_injection(); ?>
<select name="advads[placements][<?php echo esc_attr( $_placement_slug ); ?>][options][tag]">
	<?php foreach ( $tags as $_tag_key => $_tag ) : ?>
	<option value="<?php echo esc_attr( $_tag_key ); ?>"
							  <?php
								if ( isset( $_placement['options']['tag'] ) ) {
									selected( $_placement['options']['tag'], $_tag_key ); }
								?>
		><?php echo esc_html( $_tag ); ?></option>
	<?php endforeach; ?>
</select>

<p><label><input type="checkbox" name="advads[placements][<?php echo esc_attr( $_placement_slug ); ?>][options][start_from_bottom]" value="1"
																	 <?php
																		if ( isset( $_placement['options']['start_from_bottom'] ) ) {
																			checked( $_placement['options']['start_from_bottom'], 1 ); }
																		?>
/><?php esc_html_e( 'start counting from bottom', 'advanced-ads' ); ?></label></p>
