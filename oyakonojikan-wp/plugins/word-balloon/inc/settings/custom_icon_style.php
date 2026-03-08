<?php
defined( 'ABSPATH' ) || exit;

function word_balloon_custom_icon_style($load_setting){

	foreach ( $load_setting['type_icon'] as $key => $val ):

		$fill_value = '';
		$stroke_value = '';
		$stroke_width_value = '';

		if( empty($load_setting['custom_icon'][$key]) ){

			$fill_value = $load_setting['default_icon'][$key]['fill'];
			$stroke_value = $load_setting['default_icon'][$key]['stroke'];
			$stroke_width_value = $load_setting['default_icon'][$key]['stroke-width'];

		}else{

			$fill_value = $load_setting['custom_icon'][$key]['fill'];
			$stroke_value = $load_setting['custom_icon'][$key]['stroke'];
			$stroke_width_value = $load_setting['custom_icon'][$key]['stroke-width'];

		}



		?>
		<input id="custom_icon_<?php echo $key; ?>" type="hidden" name="custom_icon_<?php echo $key; ?>" data-fill="<?php echo esc_attr( $fill_value ); ?>" data-stroke="<?php echo esc_attr( $stroke_value ); ?>" data-stroke_width="<?php echo esc_attr( $stroke_width_value ); ?>" />
		<?php
	endforeach;

}

