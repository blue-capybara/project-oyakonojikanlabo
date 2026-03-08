<?php
defined( 'ABSPATH' ) || exit;



function word_balloon_shortcode_wallpaper( $atts, $content = null ) {

	$atts = shortcode_atts(
		array(
			'id' => '',
			'background_color' => '',
			'background_image' => '',
			'border_style' => '',
			'border_width' => '',
			'border_color' => '',
			'border_radius' => '',
		), $atts, 'word_balloon_wallpaper' );

	$content = do_shortcode( shortcode_unautop( $content ) );

	
	if (strpos($content,'class="w_b_block_wallpaper"') !== false){
		$content = str_replace('<div class="w_b_block_wallpaper">', '', $content);
		$content = rtrim($content, '</div>');
	}

	$style = $style_background_color = $style_image = $style_border = $border_radius = '';

	if( '' !== $atts['id'] ){

		if( 'custom' === $atts['id']){

			if( '' !== $atts['background_color']){
				$style_background_color = 'background-color:'.$atts['background_color'].';';
			}

			if( '' !== $atts['background_image']){
				$style_image .= 'background-image:url(\''.esc_url($atts['background_image']).'\');';
			}

			if( '' !== $atts['border_style']){
				$style_border = 'border-style:'.$atts['border_style'].';';

				if( '' !== $atts['border_width']){
					$style_border .= 'border-width:'.$atts['border_width'].'px;';
				}
				if( '' !== $atts['border_color']){
					$style_border .= 'border-color:'.$atts['border_color'].';';
				}
			}

			if( '' !== $atts['border_radius']){
				$border_radius = 'border-radius:'.$atts['border_radius'].'px;';
			}

		}else{

			
			$wallpaper_setting = get_option('word_balloon_wallpaper_settings');

			if( isset( $wallpaper_setting[$atts['id']]["image"] ) ){
				if($wallpaper_setting[$atts['id']]["image"] != '')
					$style_image = 'background-image:url(\''.esc_url($wallpaper_setting[$atts['id']]["image"]).'\');';
			}
			if( isset( $wallpaper_setting[$atts['id']]["background_color"] ) ){
				$style_background_color = 'background-color:'.$wallpaper_setting[$atts['id']]["background_color"].';';
			}
			if( isset( $wallpaper_setting[$atts['id']]["border_style"] ) ){
				if($wallpaper_setting[$atts['id']]["border_style"]!='none'){
					$style_border = 'border:'.$wallpaper_setting[$atts['id']]["border_style"].' '.$wallpaper_setting[$atts['id']]["border_width"].'px '.$wallpaper_setting[$atts['id']]["border_color"].';';
				}
			}
			if( isset( $wallpaper_setting[$atts['id']]["border_radius"] ) ){
				if($wallpaper_setting[$atts['id']]["border_radius"]!=0){
					$border_radius = 'border-radius:'.$wallpaper_setting[$atts['id']]["border_radius"].'px;';
				}
			}



		}

			//if($style_image || $style_background_color){
		$style = ' style="'.$style_image.$style_background_color.$style_border.$border_radius.'padding:20px 5px;margin:40px 0"';
			//}

	}





	return '<div class="w_b_wallpaper"'.$style.'>' . $content . '</div>';
}

