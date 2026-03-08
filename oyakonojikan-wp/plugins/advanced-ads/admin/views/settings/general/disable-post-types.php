<p><a href="<?php echo esc_url( ADVADS_URL . 'add-ons/advanced-ads-pro/#utm_source=advanced-ads&utm_medium=link&utm_campaign=pitch-pro-disable-post-type' ); ?>" target="_blank"><?php esc_html_e( 'Pro feature', 'advanced-ads' ); ?></a></p>
<?php
foreach ( $post_types as $_type_id => $_type ) :
	if ( $type_label_counts[ $_type->label ] < 2 ) {
		$_label = $_type->label;
	} else {
		$_label = sprintf( '%s (%s)', $_type->label, $_type_id );
	}
	?>
	<label style="margin-right: 1em;"><input type="checkbox" disabled="disabled"><?php echo esc_html( $_label ); ?></label>
																								   <?php
endforeach;
