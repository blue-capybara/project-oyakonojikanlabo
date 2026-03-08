function word_balloon_favorite_to_reset(favorite_id) {

	var reset_item = word_balloon_restore_data_name();

	var w_b_restore = document.getElementById('w_b_restore');
	var w_b_favorite = document.getElementById('w_b_favorite_' + favorite_id);

	for (var i = 0; i < reset_item.length; i++) {

		w_b_restore.setAttribute('data-' + reset_item[i], w_b_favorite.getAttribute('data-' + reset_item[i]));

	}

	//jQuery(document).ready(function($){
	word_balloon_load_data_set();
	//});



	word_balloon_change_select_option('w_b_edit_select_favorite', 'default');

}

function word_balloon_load_data_set() {

	var result, pre;
	var id_name = '#w_b_restore';

	var restore_data = document.getElementById('w_b_restore');

	var display_checke = true;

	var w_b_overlay = document.getElementById('w_b_overlay');

	if (w_b_overlay.style.display === 'none') {
		w_b_overlay.style.display = 'block'
		w_b_overlay.style.visibility = 'hidden'
	} else {
		display_checke = false;
	}





	jQuery(document).ready(function ($) {

		document.getElementById('w_b_restore_load').value = 'true';
		

		jQuery('#w_b_overlay .w_b_bal').removeAttr('style');
	});

	jQuery(document).ready(function ($) {

		var set_item = ['avatar_position', 'icon_position'];

		for (var i = 0; i < set_item.length; i++) {



			result = restore_data.getAttribute('data-' + set_item[i]);

			if (result !== '') {
				document.getElementById(set_item[i] + '_' + result).checked = true
			}

			

			

			
		}


	});



	jQuery(document).ready(function ($) {


		var set_item = ['enable', 'avatar_border', 'avatar_flip_h', 'avatar_flip_v', 'avatar_hide', 'avatar_shadow', 'balloon_full_width', 'balloon_shadow', 'box_center', 'icon_flip_h', 'icon_flip_v', 'balloon_vertical_writing', 'balloon_hide', 'box_margin', 'quote_effect_minimum'];

		for (var i = 0; i < set_item.length; i++) {
			result = restore_data.getAttribute('data-' + set_item[i]);

			if (result === "true") {
				jQuery('#w_b_overlay input[name="' + set_item[i] + '"]').prop("checked", true);
			} else {
				jQuery('#w_b_overlay input[name="' + set_item[i] + '"]').prop("checked", false);
			}

			jQuery('#w_b_overlay input[name="' + set_item[i] + '"]').change();
		}

	});

	jQuery(document).ready(function ($) {

		var set_item = ['font_size', 'text_align', 'avatar_border_radius', 'choice_balloon', 'avatar_select'];

		for (var i = 0; i < set_item.length; i++) {

			result = restore_data.getAttribute('data-' + set_item[i]);
			pre = '';
			if (set_item[i] === 'avatar_select') {
				pre = 'w_b_';
				var options = jQuery('#w_b_overlay select[name="w_b_avatar_select"]').children();

				if (result === '') {

					result = options.first().val();

				} else if (result === 'unset') {
					
					var has_src = false;

					for (var q = 0; q < options.length; q++) {
						if (options.eq(q).attr('data-avatar_img') === restore_data.getAttribute('data-src')) has_src = true;
					}

					if (!has_src) {
						jQuery('#w_b_overlay select[name="w_b_avatar_select"]').append('<option value="unset" data-avatar_name="' + restore_data.getAttribute('data-avatar_name') + '" data-avatar_img="' + restore_data.getAttribute('data-src') + '">' + translations_word_balloon.anonymous + '</option>');
					}
				}
			}
			if (set_item[i] === 'choice_balloon') {
				pre = 'post_';
			}

			jQuery('#w_b_overlay select[name="' + pre + set_item[i] + '"] option').attr("selected", false);
			jQuery('#w_b_overlay select[name="' + pre + set_item[i] + '"]').val(result).prop('selected', true)
			jQuery('#w_b_overlay select[name="' + pre + set_item[i] + '"]').val(result).trigger('change', [true]);

		}

	});

	jQuery(document).ready(function ($) {

		var set_item = ['icon_type', 'avatar_size', 'avatar_effect', 'avatar_filter', 'balloon_effect', 'balloon_filter', 'icon_effect', 'icon_filter', 'icon_size', 'name_position', 'border_style', 'balloon_m', 'avatar_size_m', 'name_position_m', 'font_size_m', 'avatar_border_style', 'avatar_in_view', 'icon_in_view', 'balloon_in_view', 'quote_effect'];

		for (var i = 0; i < set_item.length; i++) {

			result = restore_data.getAttribute('data-' + set_item[i]);
			pre = '';

			
			if (set_item[i] === 'border_style') {
				pre = 'balloon_';
				var balloon = word_balloon_get_balloon();
				
				if (balloon !== 'round' && balloon !== 'round_2') continue;
				
			}

			if (set_item[i] === 'name_position') {
				if (result === '') {
					result = word_balloon_get_balloon_default_name_position();
				}
			}
			if (['avatar_effect', 'icon_effect', 'balloon_effect', 'avatar_filter', 'balloon_filter', 'icon_filter', 'icon_size', 'icon_type', 'quote_effect'].indexOf(set_item[i]) !== -1) {
				pre = 'w_b_';
			}



			if (set_item[i] === 'icon_size') {
				if (result === '') result = 'M';
			}


			jQuery('#w_b_overlay select[name="' + pre + set_item[i] + '"] option').attr("selected", false);
			jQuery('#w_b_overlay select[name="' + pre + set_item[i] + '"]').val(result).change();

		}

	});

	jQuery(document).ready(function ($) {

		var set_item = ['balloon_background', 'balloon_background_alpha', 'balloon_border_color', 'balloon_shadow_color', 'name_color', 'status_color', 'text_color', 'avatar_border_color', 'avatar_background_color', 'icon_fill', 'icon_stroke'];

		jQuery(document).ready(function ($) {


			for (var i = 0; i < set_item.length; i++) {
				result = restore_data.getAttribute('data-' + set_item[i]);
				var after = '';
				var pre = '';

				if (set_item[i] === 'icon_fill' || set_item[i] === 'icon_stroke') {
					after = '_color';

				}

				
				
				//return true;
				
				if (set_item[i] === 'balloon_background_alpha' && restore_data.getAttribute('data-balloon_background') !== '') {
					continue;
				}


				var target = jQuery('#w_b_overlay input.w_b_color_pick[name="' + pre + set_item[i] + after + '"]').val();

				if (target === '') {

					jQuery('#w_b_overlay input.w_b_color_pick[name="' + pre + set_item[i] + after + '"]').val("#666666").change();

					jQuery('#w_b_overlay input.w_b_color_pick[name="' + pre + set_item[i] + after + '"]').val("").change();

				}
				
				
				jQuery('#w_b_overlay input.w_b_color_pick[name="' + pre + set_item[i] + after + '"]').val(result).trigger('change', [true]);


				
			}


		});

	});

	jQuery(document).ready(function ($) {

		jQuery('#w_b_overlay .w_b_status').html(restore_data.getAttribute('data-status'));

		var set_item = ['memo', 'avatar_name', 'status', 'status_sound_filename', 'status_sound_url', 'status_sound_id'];

		for (var i = 0; i < set_item.length; i++) {

			result = restore_data.getAttribute('data-' + set_item[i]);
			pre = '';
			if (set_item[i] === 'avatar_name') {

				if (result === '') {
					result = document.getElementById('w_b_avatar_name').value;
				}
				if (result === 'false') {
					result = '';
				}
			} else if (set_item[i] === 'status_sound_id') {

				if (result !== '' && restore_data.getAttribute('data-status_sound_url') === '') {
					var data = JSON.stringify({
						action: 'word_balloon_call_ajax',
						nonce: word_balloon_ajax_data.nonce,
						ID: parseInt(result),
					});
					var xhr = new XMLHttpRequest();
					xhr.onreadystatechange = function () {
						if (xhr.readyState === 4) {
							
							
							
							var msg = JSON.parse(xhr.response);

							if (xhr.status === 200 && msg['message'] === "OK") {
								

								document.getElementById('w_b_status_sound_url').value = msg['url'];
								restore_data.setAttribute('data-status_sound_url', msg['url']);
								document.getElementById('w_b_status_sound_filename').value = msg['url'].match(".+/(.+?)([\?#;].*)?$")[1];
								restore_data.setAttribute('data-status_sound_filename', msg['url'].match(".+/(.+?)([\?#;].*)?$")[1]);
								word_balloon_change_status_box();

							} else {
								
								
							}
						} else {
							
							
						}
					};

					xhr.open("POST", word_balloon_ajax_data.ajaxurl, true);
					xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

					xhr.send('action=word_balloon_call_ajax&nonce=' + word_balloon_ajax_data.nonce + '&ID=' + parseInt(result));
				}
			}

			jQuery('#w_b_overlay input[name="' + pre + set_item[i] + '"]').val(result);
			jQuery('#w_b_overlay input[name="' + pre + set_item[i] + '"]').change();

		}

	});










	jQuery(document).ready(function ($) {

		word_balloon_change_avatar_name_position();
		word_balloon_change_status_box();

		var set_item = ['border_width', 'avatar_border_width', 'icon_stroke_width', 'avatar_effect_duration', 'icon_effect_duration', 'balloon_effect_duration', 'quote_effect_speed', 'avatar_in_view_duration', 'icon_in_view_duration', 'balloon_in_view_duration', 'name_font_size'];

		for (var i = 0; i < set_item.length; i++) {

			result = restore_data.getAttribute('data-' + set_item[i]);
			pre = '';

			if (set_item[i] === 'border_width') {
				pre = 'balloon_';
			}else if(set_item[i] === 'name_font_size'){
				if( result === '' ){
					//result = 10;
				}
			}

			jQuery('#w_b_overlay input[name="' + pre + set_item[i] + '"]').val(result);

			jQuery('#w_b_overlay input[name="' + pre + set_item[i] + '"]').change();

		}


	});

	jQuery(document).ready(function ($) {

		var quote = '';
		var w_b_post_text = document.getElementById('w_b_post_text');
		var w_b_post_pre_text = document.getElementById('w_b_post_pre_text');
		var w_b_post_text_ph = document.getElementById('w_b_post_text_ph');

		if ('' !== restore_data.getAttribute('data-balloon_quote')) {
			quote = restore_data.getAttribute('data-balloon_quote').replace(/<p>&nbsp;<\/p>/g, "\r\r").replace(/<br \/>/g, "\r").replace(/<br>/g, "\r");
		}

		if ('' !== quote) {
			w_b_post_text.value = quote;

			
			

			//w_b_post_pre_text.innerHTML = restore_data.getAttribute('data-balloon_quote').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace( /\r?\n/g, '<br>' )  + '\u200b';
			w_b_post_pre_text.innerHTML = restore_data.getAttribute('data-balloon_quote').replace(/\r?\n/g, '<br>') + '\u200b';

		}

		if (quote !== '') {
			w_b_post_text_ph.style.display = 'none';
			w_b_post_pre_text.style.display = 'block';
			w_b_quote.style.minWidth = 'auto'
		} else {
			w_b_post_text_ph.style.display = 'block';
			w_b_post_pre_text.style.display = 'none';
			w_b_quote.style.minWidth = '120px'
		}

		/*
				if('' !== quote ){
					jQuery('#w_b_overlay textarea.w_b_post_text').val( quote );
				}

				if(jQuery('#w_b_overlay textarea.w_b_post_text').val() !== ''){
					jQuery('#w_b_overlay div.w_b_post_text_ph').css('display', "none");
					jQuery('#w_b_overlay div.w_b_post_pre_text').css('display', "block");
				}else{
					jQuery('#w_b_overlay div.w_b_post_text_ph').css('display', "block");
					jQuery('#w_b_overlay div.w_b_post_pre_text').css('display', "none");
				}
				jQuery(document).ready(function($){
					jQuery('#w_b_overlay textarea.w_b_post_text').trigger('input');
				});
				*/
	});




	if (display_checke) {
		w_b_overlay.style.visibility = 'visible';
		w_b_overlay.style.display = 'none';
	}



	jQuery(document).ready(function ($) {


		word_balloon_change_balloon_space();
	});

	jQuery(document).ajaxStop(function () {
		jQuery('#w_b_overlay input#w_b_restore_load').val('false');
	});

}
