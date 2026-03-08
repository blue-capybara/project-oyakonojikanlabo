

function word_balloon_svg_encode(svg) {
	return btoa(unescape(encodeURIComponent(svg)));
}

function word_balloon_svg_decode(svg) {
	return decodeURIComponent(escape(atob(svg)));
}

function word_balloon_hex_to_rgba(hex, alpha) {

	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

	if (result) {
		var r = parseInt(result[1], 16);
		var g = parseInt(result[2], 16);
		var b = parseInt(result[3], 16);
		return 'rgba(' + parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) + ',' + alpha + ')';
	}
	return null;
}

function word_balloon_change_text_color(color, side, balloon) {

	//console.log(color+side+balloon);

	//jQuery('.w_b_bal').css('background','transparent');
	//console.log(color);


	if (jQuery("#w_b_post_page").length || jQuery("#w_b_favorite_page").length) {
		var placeholder_color = color;
		if (placeholder_color === '') {
			if (jQuery('[name=custom_balloon_' + balloon + '_' + side + ']').attr('data-color_value') !== '') {
				placeholder_color = color = jQuery('[name=custom_balloon_' + balloon + '_' + side + ']').attr('data-color_value');
			}
		}

		if (placeholder_color === '' || typeof placeholder_color === 'undefined') {
			placeholder_color = "#000000";
		}
		
		var red = parseInt(placeholder_color.substring(1, 3), 16);
		var green = parseInt(placeholder_color.substring(3, 5), 16);
		var blue = parseInt(placeholder_color.substring(5, 7), 16);
		var rgb = 'rgb(' + red + ',' + green + ',' + blue + ',0.6)'
		jQuery("#w_b_css").append('textarea.w_b_post_text::-webkit-input-placeholder{color:' + rgb + ';}');
		jQuery("#w_b_css").append('textarea.w_b_post_text:-ms-input-placeholder{color:' + rgb + ';}');
		jQuery("#w_b_css").append('textarea.w_b_post_text::placeholder{color:' + rgb + ';}');

		jQuery('textarea.w_b_post_text').css('color', color);


		jQuery('.w_b_color_pick[name="text_color"]').val(color);
		jQuery('.w_b_color_pick[name="text_color"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);
	} else {

		if (color === '') {
			color = jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][color]"]').attr('data-default_value');
		}

		jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][color]"]').val(color);
		jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][color]"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);


	}

	jQuery(".w_b_" + balloon + "_" + side + ':not(.w_b_block_bal)').css('color', color);

	if (document.getElementById('w_b_post_text_ph'))
		document.getElementById('w_b_post_text_ph').style.color = color;

}



function word_balloon_avatar_border_color_change(color, side, balloon) {


	var noblock = ':not(.w_b_block_bal)';

	if (jQuery("#w_b_post_page").length || jQuery("#w_b_favorite_page").length) {
		if (color === '') {
			//color = jQuery('[name=custom_balloon_'+balloon+'_'+side+']').attr('data-border_color_value');
			color = '';
		}
		if (color === '') {
			color = '';
		}
	}


	if (jQuery("#w_b_post_page").length || jQuery("#w_b_favorite_page").length) {
		jQuery('.w_b_color_pick[name="avatar_border_color"]').val(color);
		jQuery('.w_b_color_pick[name="avatar_border_color"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);

		jQuery("div.w_b_ava_effect" + noblock).css('border-color', color);
	}

}

function word_balloon_avatar_background_color_change(color, side, balloon) {


	var noblock = ':not(.w_b_block_bal)';

	if (jQuery("#w_b_post_page").length || jQuery("#w_b_favorite_page").length) {
		if (color === '') {
			//color = jQuery('[name=custom_balloon_'+balloon+'_'+side+']').attr('data-border_color_value');
			color = '';
		}
		if (color === '') {
			color = '';
		}
	}


	if (jQuery("#w_b_post_page").length || jQuery("#w_b_favorite_page").length) {
		jQuery('.w_b_color_pick[name="avatar_background_color"]').val(color);
		jQuery('.w_b_color_pick[name="avatar_background_color"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);

		jQuery("div.w_b_ava_effect" + noblock).css('background-color', color);
	}

}





function word_balloon_change_balloon_background_color(color, side, balloon) {





	var noblock = ':not(.w_b_block_bal)';

	if (jQuery("#w_b_post_page").length || jQuery("#w_b_favorite_page").length) {
		//jQuery('textarea.w_b_post_text').css('color','#32373c');
		jQuery('.w_b_bal' + noblock).css('background', '');
		if (color === '') {
			color = jQuery('[name="custom_balloon_' + balloon + '_' + side + '"]').attr('data-background_value');
		}
	} else {
		if (color === '') {
			color = jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][background]"]').attr('data-default_value');
		}
	}



	if (balloon == 'talk') {
		jQuery("#w_b_css").append('.w_b_talk_' + side + noblock + ':after{border-top-color:' + color + '!important;}');
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_talk_L' + noblock + ':after{border-right-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_talk_R' + noblock + ':after{border-left-color:' + color + '!important;}');
		}
	}
	if (balloon == 'think') {
		jQuery("#w_b_css").append('.w_b_think_' + side + noblock + ':before{background:' + color + '!important;}');
		jQuery("#w_b_css").append('.w_b_think_' + side + noblock + ':after{background:' + color + '!important;}');
	}
	if (balloon === 'line') {
		jQuery("#w_b_css").html('.w_b_line_' + side + noblock + ':before{border-right-color:' + color + ';}');
	}
	if (balloon === 'tail') {
		jQuery("#w_b_css").html('.w_b_tail_' + side + noblock + ':before{border-bottom-color:' + color + ';}');
	}
	if (balloon == 'bump') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_bump_L' + noblock + ':after{border-right-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_bump_R' + noblock + ':after{border-left-color:' + color + '!important;}');
		}
	}
	if (balloon == 'upper') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_upper_L' + noblock + ':after{border-top-color:' + color + '!important;}');
			jQuery("#w_b_css").append('.w_b_upper_L' + noblock + ':after{border-left-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_upper_R' + noblock + ':after{border-top-color:' + color + '!important;}');
			jQuery("#w_b_css").append('.w_b_upper_R' + noblock + ':after{border-right-color:' + color + '!important;}');
		}
	}

	if (balloon == 'lower') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_lower_L' + noblock + ':after{border-bottom-color:' + color + '!important;}');
			jQuery("#w_b_css").append('.w_b_lower_L' + noblock + ':after{border-left-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_lower_R' + noblock + ':after{border-bottom-color:' + color + '!important;}');
			jQuery("#w_b_css").append('.w_b_lower_R' + noblock + ':after{border-right-color:' + color + '!important;}');
		}
	}

	if (balloon == 'soi') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_soi_L' + noblock + ':before{border-right-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_soi_R' + noblock + ':before{border-left-color:' + color + '!important;}');
		}
	}

	if (balloon == 'talk_2') {
		jQuery("#w_b_css").append('.w_b_talk_2_' + side + noblock + ':after{border-top-color:' + color + '!important;}');
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_talk_2_L' + noblock + ':after{border-right-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_talk_2_R' + noblock + ':after{border-left-color:' + color + '!important;}');
		}
	}

	if (balloon == 'pointy') {
		jQuery("#w_b_css").append('.w_b_pointy_' + side + '' + noblock + ':after{border-top-color:' + color + '!important;}');
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_pointy_L' + noblock + ':after{border-right-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_pointy_R' + noblock + ':after{border-left-color:' + color + '!important;}');
		}
	}

	if (balloon == 'talk_u') {
		jQuery("#w_b_css").append('.w_b_talk_u_' + side + noblock + ':after{border-bottom-color:' + color + '!important;}');
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_talk_u_L' + noblock + ':after{border-left-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_talk_u_R' + noblock + ':after{border-right-color:' + color + '!important;}');
		}
	}

	if (balloon == 'talk_o') {
		jQuery("#w_b_css").append('.w_b_talk_o_' + side + noblock + ':after{border-top-color:' + color + '!important;}');
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_talk_o_L' + noblock + ':after{border-left-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_talk_o_R' + noblock + ':after{border-right-color:' + color + '!important;}');
		}
	}

	if (balloon == 'talk_uc') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_talk_uc_L' + noblock + ':after{border-bottom-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_talk_uc_R' + noblock + ':after{border-bottom-color:' + color + '!important;}');
		}
	}

	if (balloon == 'talk_oc') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_talk_oc_L' + noblock + ':after{border-top-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_talk_oc_R' + noblock + ':after{border-top-color:' + color + '!important;}');
		}
	}

	if (balloon == 'tail_3') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_tail_3_L' + noblock + ':after{border-bottom-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_tail_3_R' + noblock + ':after{border-top-color:' + color + '!important;}');
		}
	}



	if (jQuery("#w_b_post_page").length || jQuery("#w_b_favorite_page").length) {
		if (word_balloon_is_alpha_balloon(balloon)) {
			jQuery('.w_b_color_pick[name="balloon_background_alpha"]').val(color);
			jQuery('.w_b_color_pick[name="balloon_background_alpha"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);
		} else {
			jQuery('.w_b_color_pick[name="balloon_background"]').val(color);
			jQuery('.w_b_color_pick[name="balloon_background"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);
		}
	} else {
		jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][background]"]').val(color);
		jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][background]"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);
	}


	if (word_balloon_is_svg_balloon(balloon)) {
		var svg_balloon = jQuery(".w_b_" + balloon + "_" + side + noblock).css('border-image-source').match(/url\(\"data:image\/svg\+xml;base64,(.*)\"\)/);

		if (svg_balloon) {
			svg_balloon = word_balloon_svg_decode(svg_balloon[1]);

			svg_balloon = svg_balloon.replace(/fill=\"(.*?)\"/g, 'fill="' + color + '"');
			svg_balloon = svg_balloon.replace(/fill:(.*?);/g, 'fill:' + color + ';');

			jQuery(".w_b_" + balloon + "_" + side + noblock).css('border-image-source', 'url("data:image/svg+xml;base64,' + word_balloon_svg_encode(svg_balloon) + '")');

		}

	} else {
		jQuery(".w_b_" + balloon + "_" + side + noblock).css('background', color);
	}



	if (balloon == 'rpg_1') {
		jQuery("#w_b_css").append('.w_b_rpg_1_' + side + '{border-color:' + color + '!important;}');
	}

	if (balloon == 'tail_2') {
		jQuery("#w_b_css").append('.w_b_tail_2_' + side + noblock + ':before{background:' + color + '!important;}');
		jQuery("#w_b_css").append('.w_b_tail_2_' + side + noblock + ':after{background:' + color + '!important;}');
	}

	if (balloon === 'geek') {
		jQuery(".w_b_" + balloon + "_" + side + noblock).css('background', 'radial-gradient(' + color + ',#000 130%)');
	}

}

function word_balloon_change_balloon_border_color(color, side, balloon) {


	var noblock = ':not(.w_b_block_bal)';

	if (jQuery("#w_b_post_page").length || jQuery("#w_b_favorite_page").length) {
		if (color === '') {
			color = jQuery('[name=custom_balloon_' + balloon + '_' + side + ']').attr('data-border_color_value');
		}
		if (color === '') {
			color = 'transparent';
		}
	} else {
		if (color === '') {
			color = jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][border_color]"]').attr('data-default_value');
		}
	}

	if (balloon == 'talk') {
		jQuery("#w_b_css").append('.w_b_talk_' + side + noblock + ':before{border-top-color:' + color + '!important;}');
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_talk_L' + noblock + ':before{border-right-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_talk_R' + noblock + ':before{border-left-color:' + color + '!important;}');
		}
	}

	if (balloon == 'think') {
		jQuery("#w_b_css").append('.w_b_think_' + side + noblock + ':before{border-color:' + color + '!important;}');
		jQuery("#w_b_css").append('.w_b_think_' + side + noblock + ':after{border-color:' + color + '!important;}');
	}

	if (balloon == 'bump') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_bump_L' + noblock + ':before{border-right-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_bump_R' + noblock + ':before{border-left-color:' + color + '!important;}');
		}
	}

	if (balloon == 'upper') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_upper_L' + noblock + ':before{border-top-color:' + color + '!important;}');
			jQuery("#w_b_css").append('.w_b_upper_L' + noblock + ':before{border-left-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_upper_R' + noblock + ':before{border-top-color:' + color + '!important;}');
			jQuery("#w_b_css").append('.w_b_upper_R' + noblock + ':before{border-right-color:' + color + '!important;}');
		}
	}
	if (balloon == 'lower') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_lower_L' + noblock + ':before{border-bottom-color:' + color + '!important;}');
			jQuery("#w_b_css").append('.w_b_lower_L' + noblock + ':before{border-left-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_lower_R' + noblock + ':before{border-bottom-color:' + color + '!important;}');
			jQuery("#w_b_css").append('.w_b_lower_R' + noblock + ':before{border-right-color:' + color + '!important;}');
		}
	}
	if (balloon == 'rpg_1') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_rpg_1_L' + noblock + '{box-shadow: 0 0 0 4px ' + color + ' inset!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_rpg_1_R' + noblock + '{box-shadow: 0 0 0 4px ' + color + ' inset!important;}');
		}
	}

	if (balloon == 'rpg_2') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_rpg_2_L' + noblock + '{box-shadow:0 0 2px 3px #878397,0 0 0 6px ' + color + ',0 0 2px 8px #878397!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_rpg_2_R' + noblock + '{box-shadow:0 0 2px 3px #878397,0 0 0 6px ' + color + ',0 0 2px 8px #878397!important;}');
		}
	}

	if (balloon == 'talk_2') {
		jQuery("#w_b_css").append('.w_b_talk_2_' + side + noblock + ':before{border-top-color:' + color + '!important;}');
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_talk_2_L' + noblock + ':before{border-right-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_talk_2_R' + noblock + ':before{border-left-color:' + color + '!important;}');
		}
	}

	if (balloon == 'bump_2') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_bump_2_L' + noblock + ':before{border-right-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_bump_2_R' + noblock + ':before{border-left-color:' + color + '!important;}');
		}
	}

	if (balloon == 'pointy') {
		jQuery("#w_b_css").append('.w_b_pointy_' + side + noblock + ':before{border-top-color:' + color + '!important;}');
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_pointy_L' + noblock + ':before{border-right-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_pointy_R' + noblock + ':before{border-left-color:' + color + '!important;}');
		}
	}

	if (balloon == 'talk_u') {
		jQuery("#w_b_css").append('.w_b_talk_u_' + side + noblock + ':before{border-bottom-color:' + color + '!important;}');
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_talk_u_L' + noblock + ':before{border-left-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_talk_u_R' + noblock + ':before{border-right-color:' + color + '!important;}');
		}
	}

	if (balloon == 'talk_o') {
		jQuery("#w_b_css").append('.w_b_talk_o_' + side + noblock + ':before{border-top-color:' + color + '!important;}');
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_talk_o_L' + noblock + ':before{border-left-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_talk_o_R' + noblock + ':before{border-right-color:' + color + '!important;}');
		}
	}

	if (balloon == 'talk_uc') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_talk_uc_L' + noblock + ':before{border-bottom-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_talk_uc_R' + noblock + ':before{border-bottom-color:' + color + '!important;}');
		}
	}

	if (balloon == 'talk_oc') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_talk_oc_L' + noblock + ':before{border-top-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_talk_oc_R' + noblock + ':before{border-top-color:' + color + '!important;}');
		}
	}

	if (balloon == 'tail_3') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_tail_3_L' + noblock + ':before{border-bottom-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_tail_3_R' + noblock + ':before{border-top-color:' + color + '!important;}');
		}
	}

	if (balloon == 'twin_t') {
		if (side == 'L') {
			jQuery("#w_b_css").append('.w_b_twin_t_L' + noblock + ':before{border-right-color:' + color + '!important;}');
			jQuery("#w_b_css").append('.w_b_twin_t_L' + noblock + ':after{border-right-color:' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_twin_t_R' + noblock + ':before{border-left-color:' + color + '!important;}');
			jQuery("#w_b_css").append('.w_b_twin_t_R' + noblock + ':after{border-left-color:' + color + '!important;}');
		}
	}

	if (jQuery("#w_b_post_page").length || jQuery("#w_b_favorite_page").length) {
		jQuery('.w_b_color_pick[name="balloon_border_color"]').val(color);
		jQuery('.w_b_color_pick[name="balloon_border_color"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);
	} else {
		jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][border_color]"]').val(color);
		jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][border_color]"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);
	}

	if (word_balloon_is_svg_balloon(balloon)) {


		var svg_balloon = jQuery(".w_b_" + balloon + "_" + side + noblock).css('border-image-source').match(/url\(\"data:image\/svg\+xml;base64,(.*)\"\)/);

		if (svg_balloon) {
			svg_balloon = word_balloon_svg_decode(svg_balloon[1]);


			if (balloon === 'slash' || balloon === 'slash_uc' || balloon === 'slash_oc') {

				svg_balloon = svg_balloon.replace(/fill=\"(.*?)\"/g, 'fill="' + color + '"');
				svg_balloon = svg_balloon.replace(/fill:(.*?);/g, 'fill:' + color + ';');

			} else {

				svg_balloon = svg_balloon.replace(/stroke=\"(.*?)\"/g, 'stroke="' + color + '"');
				svg_balloon = svg_balloon.replace(/stroke:(.*?);/g, 'stroke:' + color + ';');


			}

			jQuery(".w_b_" + balloon + "_" + side + noblock).css('border-image-source', 'url("data:image/svg+xml;base64,' + word_balloon_svg_encode(svg_balloon) + '")');


		}

	} else {

		if (balloon != 'rpg_1' || balloon != 'rpg_2') {
			jQuery(".w_b_" + balloon + "_" + side + noblock).css('border-color', color);
		}

	}

}




function word_balloon_balloon_shadow_color_change(color, side, balloon) {


	var noblock = ':not(.w_b_block_bal)';

	if (jQuery("#w_b_post_page").length || jQuery("#w_b_favorite_page").length) {
		//jQuery('textarea.w_b_post_text').css('color','#32373c');
		//jQuery('.w_b_bal').css('background','transparent');
		if (color === '') {
			color = jQuery('[name="custom_balloon_' + balloon + '_' + side + '"]').attr('data-balloon_shadow_color_value');
		}
	} else {
		if (color === '') {
			color = jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][balloon_shadow_color]"]').attr('data-default_value');
		}
	}


	if (balloon == 'rpg_3') {
		if (side === 'L') {
			jQuery("#w_b_css").append('.w_b_rpg_3_L' + noblock + '{box-shadow :-2px 3px 1px 1px ' + color + '!important;}');
		} else {
			jQuery("#w_b_css").append('.w_b_rpg_3_R' + noblock + '{box-shadow :-2px 3px 1px 1px ' + color + '!important;}');
		}
	}



	if (jQuery("#w_b_post_page").length || jQuery("#w_b_favorite_page").length) {
		jQuery('.w_b_color_pick[name="balloon_shadow_color"]').val(color);
		jQuery('.w_b_color_pick[name="balloon_shadow_color"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);
	} else {
		jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][balloon_shadow_color]"]').val(color);
		jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][balloon_shadow_color]"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);
	}


}


function word_balloon_balloon_gradient_color_change(color, side, balloon, gradient_num) {


	var noblock = ':not(.w_b_block_bal)';
	//console.log(balloon)
	//console.log(color)
	//console.log(gradient_num)
	if (color === '') {
		if (gradient_num < 3) {
			color = jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][gradient_color_' + gradient_num + ']"]').attr('data-default_value');

		}
	}

	jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][gradient_color_' + gradient_num + ']"]').val(color);
	jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][gradient_color_' + gradient_num + ']"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);

	var color1 = jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][gradient_color_1]"]').val();
	var color2 = jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][gradient_color_2]"]').val();
	var color3 = jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][gradient_color_3]"]').val();
	var color4 = jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][gradient_color_4]"]').val();
	var color5 = jQuery('.w_b_color_pick[name="custom_balloon[' + balloon + '][' + side + '][gradient_color_5]"]').val();

	if (word_balloon_is_svg_balloon(balloon)) {

		var svg_balloon = jQuery(".w_b_" + balloon + "_" + side + noblock).css('border-image-source').match(/url\(\"data:image\/svg\+xml;base64,(.*)\"\)/);

		svg_balloon = word_balloon_svg_decode(svg_balloon[1]);

		svg_balloon = svg_balloon.replace(/offset=\"5%\" style=\"stop-color:(.*?)\"/, 'offset="5%" style="stop-color:' + color1 + '"');
		svg_balloon = svg_balloon.replace(/offset=\"25%\" style=\"stop-color:(.*?)\"/, 'offset="25%" style="stop-color:' + color2 + '"');
		svg_balloon = svg_balloon.replace(/offset=\"50%\" style=\"stop-color:(.*?)\"/, 'offset="50%" style="stop-color:' + color3 + '"');
		svg_balloon = svg_balloon.replace(/offset=\"75%\" style=\"stop-color:(.*?)\"/, 'offset="75%" style="stop-color:' + color4 + '"');
		svg_balloon = svg_balloon.replace(/offset=\"95%\" style=\"stop-color:(.*?)\"/, 'offset="95%" style="stop-color:' + color5 + '"');

		jQuery(".w_b_" + balloon + "_" + side + noblock).css('border-image-source', 'url("data:image/svg+xml;base64,' + word_balloon_svg_encode(svg_balloon) + '")');

	} else {





		if ('' != color1) {
			color1 = color1 + ',';
		} else {
			color1 = '';
		}
		if ('' != color2) {
			color2 = color2 + ',';
		} else {
			color2 = '';
		}
		if ('' != color3) {
			color3 = color3 + ',';
		} else {
			color3 = '';
		}
		if ('' != color4) {
			color4 = color4 + ',';
		} else {
			color4 = '';
		}
		if ('' != color5) {
			color5 = color5 + ',';
		} else {
			color5 = '';
		}

		comp = color1 + color2 + color3 + color4 + color5;
		var temp = comp.slice(-1);

		if (temp === ',') {
			comp = comp.slice(0, -1);
		}


		if (balloon === 'rpg_2' || balloon === 'bump_2') {
			comp = 'linear-gradient(' + comp + ')';
		} else if (balloon === 'round_2') {
			comp = 'radial-gradient(' + comp + ')';
		}

		jQuery(".w_b_" + balloon + "_" + side).css('background', comp);
	}

}


function word_balloon_icon_fill_color_change(color) {
	word_balloon_change_icon_color();
	return;
	jQuery('#w_b_overlay .w_b_icon_effect path').attr('fill', color);
	jQuery('#w_b_overlay .w_b_icon_effect ellipse').attr('fill', color);
	jQuery('#w_b_overlay .w_b_icon_effect polygon').attr('fill', color);

	jQuery('.w_b_color_pick[name="icon_fill_color"]').val(color);
	jQuery('.w_b_color_pick[name="icon_fill_color"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);
}

function word_balloon_icon_stroke_color_change(color) {
	word_balloon_change_icon_color();
	return;
	jQuery('#w_b_overlay .w_b_icon_effect path').attr('stroke', color);
	jQuery('#w_b_overlay .w_b_icon_effect ellipse').attr('stroke', color);
	jQuery('#w_b_overlay .w_b_icon_effect polygon').attr('stroke', color);

	jQuery('.w_b_color_pick[name="icon_stroke_color"]').val(color);
	jQuery('.w_b_color_pick[name="icon_stroke_color"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);
}

function word_balloon_change_avatar_name_color(color) {
	jQuery('#w_b_overlay .w_b_name').css('color', color);

	if (color === '') {
		color = jQuery('input[name="custom_name_color"]').attr('data-value');
	}

	jQuery('.w_b_color_pick[name="name_color"]').val(color);
	jQuery('.w_b_color_pick[name="name_color"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);

	word_balloon_set_avatar_name(word_balloon_get_avatar_name_position());
}

function word_balloon_status_color_change(color) {
	jQuery('#w_b_overlay .w_b_status').css('color', color);

	if (color === '') {
		color = jQuery('input[name="custom_status_color"]').attr('data-value');
	}

	jQuery('.w_b_color_pick[name="status_color"]').val(color);
	jQuery('.w_b_color_pick[name="status_color"]').closest('.wp-picker-container').children('.wp-color-result').css('background', color);
}

jQuery(document).ready(function ($) {

	jQuery('.w_b_color_pick').wpColorPicker({
		/**
		* @param {Event} event - standard jQuery event, produced by whichever
		* control was changed.
		* @param {Object} ui - standard jQuery UI object, with a color member
		* containing a Color.js object.
		*/
		change: function (event, ui) {
			var element = event.target,
				type = element.getAttribute('data-color_change_type'),
				side = '',
				balloon = '',
				color = ui.color.toString(),
				balloon_css = element.getAttribute('data-balloon_css');

			if (ui.color._alpha < 1) {
				color = word_balloon_hex_to_rgba(color, ui.color._alpha);
			}

			if (jQuery("#w_b_post_page").length || jQuery("#w_b_favorite_page").length) {
				side = word_balloon_get_avatar_position();
				balloon = word_balloon_get_balloon();
			} else {
				side = element.getAttribute('data-balloon_direction');
				balloon = element.getAttribute('data-balloon_name');
				if (balloon === 'rpg_2' || balloon === 'bump_2' || balloon === 'round_2' || balloon === 'wriggle') {
					var gradient_num = element.getAttribute('data-gradient_num');
				}
			}

			if (typeof color === "undefined") {
				return;
			}
			switch (type) {
				case 'text_color': word_balloon_change_text_color(color, side, balloon); break;
				case 'avatar_border_color': word_balloon_avatar_border_color_change(color, side, balloon); break;
				case 'avatar_background_color': word_balloon_avatar_background_color_change(color, side, balloon); break;
				case 'balloon_background': word_balloon_change_balloon_background_color(color, side, balloon); break;
				case 'balloon_background_alpha': word_balloon_change_balloon_background_color(color, side, balloon); break;
				case 'balloon_border_color': word_balloon_change_balloon_border_color(color, side, balloon); break;
				case 'icon_fill_color': word_balloon_icon_fill_color_change(color); break;
				case 'icon_stroke_color': word_balloon_icon_stroke_color_change(color); break;
				case 'name_color': word_balloon_change_avatar_name_color(color); break;
				case 'status_color': word_balloon_status_color_change(color); break;
				case 'balloon_shadow_color': word_balloon_balloon_shadow_color_change(color, side, balloon); break;
				case 'balloon_gradient_color': word_balloon_balloon_gradient_color_change(color, side, balloon, gradient_num); break;
				default: break;
			}


			//jQuery('textarea.w_b_post_text').css('color',color);
		},

		/**
		* @param {Event} event - standard jQuery event, produced by "Clear"
		* button.
		*/
		clear: function (event) {
			//var element = jQuery(event.target).siblings('.w_b_color_pick')[0];
			var color = '';
			//console.log(element);
			//jQuery('textarea.w_b_post_text').css('color',color);
			//if (element) {
			//}
			//console.log(event.target);
			//console.log(jQuery(event.target).prevAll());


			//var element = jQuery(event.target).prevAll()[0]['children'][1];
			//console.log(element);
			
			//function isset( data ){
			//return ( typeof( data ) != 'undefined' );
			//}
			//if (!isset(element)){
			// element = jQuery(event.target).prevAll()[0];
			// }
			


			function isset(data) {
				return (typeof (data) != 'undefined');
			}

			var element = jQuery(event.target).prevAll()[0];
			//console.log(element);
			if (isset(element)) {
				element = jQuery(event.target).prevAll()[0]['children'][1];
			}

			
			if (!isset(element)) {
				element = jQuery(event.target).prevAll()['prevObject'][0];
			}
			



			//console.log(element);
			var type = element.getAttribute('data-color_change_type');
			var side = balloon = '';
			var balloon_css = element.getAttribute('data-balloon_css');

			if (jQuery("#w_b_post_page").length || jQuery("#w_b_favorite_page").length) {
				side = word_balloon_get_avatar_position();
				balloon = word_balloon_get_balloon();
			} else {
				side = element.getAttribute('data-balloon_direction');
				balloon = element.getAttribute('data-balloon_name');
				if (balloon === 'rpg_2' || balloon === 'bump_2' || balloon === 'round_2' || balloon === 'wriggle') {
					var gradient_num = element.getAttribute('data-gradient_num');
				}
			}



			switch (type) {
				case 'text_color': word_balloon_change_text_color(color, side, balloon); break;
				case 'avatar_border_color': word_balloon_avatar_border_color_change(color, side, balloon); break;
				case 'avatar_background_color': word_balloon_avatar_background_color_change(color, side, balloon); break;
				case 'balloon_background': word_balloon_change_balloon_background_color(color, side, balloon); break;
				case 'balloon_background_alpha': word_balloon_change_balloon_background_color(color, side, balloon); break;
				case 'balloon_border_color': word_balloon_change_balloon_border_color(color, side, balloon); break;
				case 'icon_fill_color': word_balloon_icon_fill_color_change(color); break;
				case 'icon_stroke_color': word_balloon_icon_stroke_color_change(color); break;
				case 'name_color': word_balloon_change_avatar_name_color(color); break;
				case 'status_color': word_balloon_status_color_change(color); break;
				case 'balloon_shadow_color': word_balloon_balloon_shadow_color_change(color, side, balloon); break;
				case 'balloon_gradient_color': word_balloon_balloon_gradient_color_change(color, side, balloon, gradient_num); break;
				default: break;
			}



		},
		defaultColor: false,
		hide: true,
		palettes: true
	});



});