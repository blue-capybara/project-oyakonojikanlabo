

window.addEventListener('load', function () {
	
	
	

	if (!document.getElementById('w_b_avatar_name')) return;
	
	word_balloon_set_avatar_image(word_balloon_get_avatar_image_url());

	
	document.getElementById('w_b_avatar_name').value = word_balloon_get_avatar_default_name();
	document.getElementById('w_b_edit_avatar_name_color').value = document.getElementById('w_b_edit_avatar_name_color').getAttribute('data-default_color');

	document.getElementById('w_b_edit_avatar_name_position').value = word_balloon_get_balloon_default_name_position();
	word_balloon_set_avatar_name(word_balloon_get_balloon_default_name_position());

	word_balloon_change_avatar_size();
	word_balloon_change_avatar_border();
	word_balloon_change_avatar_shadow();
	word_balloon_change_avatar_border_radius();
	word_balloon_change_avatar_hide();
	word_balloon_change_avatar();

	word_balloon_change_balloon_box_center();
	word_balloon_change_balloon_vertical_writing();
	word_balloon_change_balloon_shadow();
	word_balloon_change_balloon();
	word_balloon_change_balloon_space();

	word_balloon_change_status_box();

});



function word_balloon_now_editor() {

	if (document.getElementById('wp-content-wrap')) {

		if (document.getElementById('wp-content-wrap').classList.contains('html-active')) {
			
			return 'text';
		} else {
			
			return 'visual';
		}

	} else {
		
		return 'block';
	}

}



if (document.getElementById('w_b_set_quote')) {

	document.getElementById('w_b_set_quote').onclick = function () {
		var copied = '';
		if (document.getElementById('wp-content-wrap').classList.contains('html-active')) {
			copied = word_balloon_getSelectionText();
		} else {
			copied = tinymce.activeEditor.selection.getContent();
		}

		if (typeof (copied) === 'undefined') {
			word_balloon_pop_up_message(translations_word_balloon.pop_up_select_text, '#ffc107');
			return;
		}

		copied = copied.replace(/<br \/>/g, "\r");
		copied = copied.replace(/<br>/g, "\r");

		document.getElementById('w_b_post_text_ph').style.display = 'none';

		document.getElementById('w_b_post_text').value = copied;
		document.getElementById('w_b_post_pre_text').innerHTML = copied.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r?\n/g, '<br>') + '\u200b';

		document.getElementById('w_b_modal_open').click();

		//jQuery('#w_b_overlay #w_b_modal_open').trigger('onclick');

	};

}















if (document.getElementById('w_b_edit_template')) {

	var w_b_edit_template = document.getElementById('w_b_edit_template');
	w_b_edit_template.addEventListener('change', function () {
		var word = this.value;

		var textarea = document.querySelector('textarea.w_b_post_text');

		var sentence = textarea.value;
		var len = sentence.length;
		var pos = textarea.selectionStart;
		var end = textarea.selectionEnd;

		var before = sentence.substr(0, pos);

		var after = sentence.substr(pos, len);

		sentence = before + word + after;

		textarea.value = sentence;
		textarea.selectionEnd = end + word.length;

		var event = document.createEvent('Event');
		event.initEvent('input', true, true);

		document.getElementById('w_b_post_text').dispatchEvent(event);

		word_balloon_change_select_option('w_b_edit_template', 'default');
		//jQuery('#w_b_overlay textarea.w_b_post_text').trigger('input');
		//jQuery('#w_b_overlay [name=w_b_template]').val('default');
	});

}












function word_balloon_now_data_copy() {

	function isset(data) {
		return (typeof (data) !== 'undefined');
	}

	if (typeof window['word_balloon_restore_reset'] === 'function') {
		word_balloon_restore_reset();
	}

	var temp = '',
		balloon_atts = '',
		avatar_atts = '',
		icon_atts = '',
		status_atts = '',
		mobile_atts = '';

	var w_b_restore = document.getElementById('w_b_restore');
	w_b_restore.setAttribute('data-enable', 'true');

	if (document.getElementById('w_b_do_restore')) {
		var w_b_do_restore = document.getElementById('w_b_do_restore');
		w_b_do_restore.style.color = '#444';
		w_b_do_restore.style.cursor = 'pointer';
	}



	
	
	
	
	
	

	//var quote = jQuery('#w_b_overlay textarea.w_b_post_text').val();
	var quote = document.getElementById('w_b_post_text').value;

	
	
	
	quote = quote.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\r?\n/g, '<br>')
	
	
	

	w_b_restore.setAttribute('data-balloon_quote', quote);




	
	
	

	
	var avatar_id = word_balloon_get_avatar_id();
	w_b_restore.setAttribute('data-id', avatar_id);
	w_b_restore.setAttribute('data-avatar_select', avatar_id);

	avatar_atts += ' id="' + avatar_id + '"';

	
	if (avatar_id === 'unset') {
		temp = word_balloon_get_avatar_image_url();
		w_b_restore.setAttribute('data-src', temp);
		avatar_atts += ' src="' + temp + '"';
	}

	
	var avatar_size = word_balloon_get_avatar_size();
	w_b_restore.setAttribute('data-avatar_size', avatar_size);
	avatar_atts += ' size="' + avatar_size + '"';

	
	var avatar_position = word_balloon_get_avatar_position();
	w_b_restore.setAttribute('data-avatar_position', avatar_position);
	avatar_atts += ' position="' + avatar_position + '"';

	
	temp = word_balloon_get_avatar_name_position();
	w_b_restore.setAttribute('data-name_position', temp);
	avatar_atts += ' name_position="' + temp + '"';

	
	temp = word_balloon_get_avatar_border_radius();
	w_b_restore.setAttribute('data-avatar_border_radius', temp);
	avatar_atts += ' radius="' + temp + '"';

	
	temp = document.getElementById("w_b_avatar_shadow").checked;
	if (temp) {
		avatar_atts += ' avatar_shadow="true"';
		w_b_restore.setAttribute('data-avatar_shadow', 'true');
	}

	
	temp = document.getElementById("w_b_edit_avatar_hide").checked;
	if (temp) {
		avatar_atts += ' avatar_hide="true"';
		w_b_restore.setAttribute('data-avatar_hide', 'true');
	}


	
	
	
	temp = word_balloon_get_avatar_name();
	if (temp !== word_balloon_get_avatar_default_name()) {
		if (temp === '') temp = 'false';
		w_b_restore.setAttribute('data-avatar_name', temp);
		avatar_atts += ' name="' + temp + '"';
	}

	temp = document.getElementById("w_b_edit_avatar_name_color").value;
	w_b_restore.setAttribute('data-name_color', temp);

	if (temp !== '') avatar_atts += ' name_color="' + temp + '"';

	if (document.getElementById('w_b_edit_name_font_size')) {
		temp = document.getElementById("w_b_edit_name_font_size").value;
		w_b_restore.setAttribute('data-name_font_size', temp);

		if (temp !== '') avatar_atts += ' name_font_size="' + temp + '"';
	}

	
	
	
	temp = document.getElementById("w_b_edit_avatar_border").checked;

	if (temp) {
		avatar_atts += ' avatar_border="true"';
		w_b_restore.setAttribute('data-avatar_border', 'true');
		
		if (document.getElementById('w_b_edit_avatar_border_style')) {
			temp = word_balloon_get_avatar_border_style();
			if (temp !== '') {
				avatar_atts += ' avatar_border_style="' + temp + '"';
				w_b_restore.setAttribute('data-avatar_border_style', temp);
			}


			temp = word_balloon_get_avatar_border_color();
			if (temp !== '') {
				avatar_atts += ' avatar_border_color="' + temp + '"';
				w_b_restore.setAttribute('data-avatar_border_color', temp);
			}

			temp = word_balloon_get_avatar_border_width();
			if (temp !== '') {
				avatar_atts += ' avatar_border_width="' + temp + '"';
				w_b_restore.setAttribute('data-avatar_border_width', temp);
			}
		}

	}

	
	
	
	if (document.getElementById('w_b_edit_avatar_background_color')) {
		temp = document.getElementById("w_b_edit_avatar_background_color").value;
		w_b_restore.setAttribute('data-avatar_background_color', temp);

		if (temp !== '') avatar_atts += ' avatar_background_color="' + temp + '"';
	}


	
	
	
	temp = word_balloon_get_avatar_flip();

	if (temp === 'hv') {
		avatar_atts += ' avatar_flip="hv"';
		w_b_restore.setAttribute('data-avatar_flip_h', 'true');
		w_b_restore.setAttribute('data-avatar_flip_v', 'true');
	} else if (temp === 'h') {
		avatar_atts += ' avatar_flip="h"';
		w_b_restore.setAttribute('data-avatar_flip_h', 'true');
	} else if (temp === 'v') {
		avatar_atts += ' avatar_flip="v"';
		w_b_restore.setAttribute('data-avatar_flip_v', 'true');
	}


	
	
	
	if (document.getElementById('w_b_edit_avatar_effect')) {
		temp = word_balloon_get_avatar_effect();

		w_b_restore.setAttribute('data-avatar_effect', temp);

		if (temp !== '') {
			avatar_atts += ' avatar_effect="' + temp + '"';
			if (document.getElementById('w_b_edit_avatar_effect_duration')) {
				temp = document.getElementById('w_b_edit_avatar_effect_duration').value;
				w_b_restore.setAttribute('data-avatar_effect_duration', temp);
				if (temp !== '') avatar_atts += ' avatar_effect_duration="' + temp + '"';
			}

		}

	}

	if (document.getElementById('w_b_edit_avatar_filter')) {
		temp = word_balloon_get_avatar_filter();
		w_b_restore.setAttribute('data-avatar_filter', temp);
		if (temp !== '') avatar_atts += ' avatar_filter="' + temp + '"';
	}

	if (document.getElementById('w_b_edit_avatar_in_view')) {
		temp = word_balloon_get_avatar_in_view();
		w_b_restore.setAttribute('data-avatar_in_view', temp);
		if (temp !== '') {
			avatar_atts += ' avatar_in_view="' + temp + '"';

			if (document.getElementById('w_b_edit_avatar_in_view_duration')) {
				temp = document.getElementById('w_b_edit_avatar_in_view_duration').value;
				w_b_restore.setAttribute('data-avatar_in_view_duration', temp);
				if (temp !== '') avatar_atts += ' avatar_in_view_duration="' + temp + '"';
			}
		}

	}



	
	
	

	if (document.getElementById('w_b_edit_icon_type') && word_balloon_get_icon_type() !== '') {

		var icon_type = word_balloon_get_icon_type();
		w_b_restore.setAttribute('data-icon_type', icon_type);
		icon_atts += ' icon_type="' + icon_type + '"';

		var e = document.getElementsByName('icon_position');
		for (temp = '', i = e.length; i--;) {
			if (e[i].checked) {
				temp = e[i].value;
				break;
			}
		}
		w_b_restore.setAttribute('data-icon_position', temp);
		icon_atts += ' icon_position="' + temp + '"';

		temp = word_balloon_get_icon_size();
		w_b_restore.setAttribute('data-icon_size', temp);
		icon_atts += ' icon_size="' + temp + '"';

		
		
		
		temp = word_balloon_get_icon_flip();

		if (temp === 'hv') {
			icon_atts += ' icon_flip="hv"';
			w_b_restore.setAttribute('data-icon_flip_h', 'true');
			w_b_restore.setAttribute('data-icon_flip_v', 'true');
		} else if (temp === 'h' || temp === 'v') {
			icon_atts += ' icon_flip="' + temp + '"';
			w_b_restore.setAttribute('data-icon_flip_' + temp, 'true');
		}

		
		
		
		if (document.getElementById('w_b_edit_icon_effect')) {
			temp = word_balloon_get_icon_effect();

			w_b_restore.setAttribute('data-icon_effect', temp);

			if (temp !== '') {
				icon_atts += ' icon_effect="' + temp + '"';
				if (document.getElementById('w_b_edit_icon_effect_duration')) {
					temp = document.getElementById('w_b_edit_icon_effect_duration').value;
					w_b_restore.setAttribute('data-icon_effect_duration', temp);
					if (temp !== '') icon_atts += ' icon_effect_duration="' + temp + '"';
				}

			}

		}

		if (document.getElementById('w_b_edit_icon_filter')) {
			temp = word_balloon_get_icon_filter();
			w_b_restore.setAttribute('data-icon_filter', temp);
			if (temp !== '') icon_atts += ' icon_filter="' + temp + '"';
		}

		if (document.getElementById('w_b_edit_icon_in_view')) {
			temp = word_balloon_get_icon_in_view();
			w_b_restore.setAttribute('data-icon_in_view', temp);
			if (temp !== '') {
				icon_atts += ' icon_in_view="' + temp + '"';

				if (document.getElementById('w_b_edit_icon_in_view_duration')) {
					temp = document.getElementById('w_b_edit_icon_in_view_duration').value;
					w_b_restore.setAttribute('data-icon_in_view_duration', temp);
					if (temp !== '') icon_atts += ' icon_in_view_duration="' + temp + '"';
				}
			}
		}

		
		
		
		if (document.getElementById('w_b_edit_icon_fill_color')) {

			var icon_data = document.getElementById('custom_icon_' + icon_type);
			
			var fill = icon_data.getAttribute('data-fill');
			var stroke = icon_data.getAttribute('data-stroke');
			var stroke_width = icon_data.getAttribute('data-stroke_width');

			temp = document.getElementById('w_b_edit_icon_fill_color').value;
			if (fill !== temp) {
				icon_atts += ' icon_fill="' + temp + '"';
				w_b_restore.setAttribute('data-icon_fill', temp);
			}

			temp = document.getElementById('w_b_edit_icon_stroke_color').value;
			if (stroke !== temp) {
				icon_atts += ' icon_stroke="' + temp + '"';
				w_b_restore.setAttribute('data-icon_stroke', temp);
			}

			temp = document.getElementById('w_b_edit_icon_stroke_width').value;
			if (stroke_width !== temp) {
				icon_atts += ' icon_stroke_width="' + temp + '"';
				w_b_restore.setAttribute('data-icon_stroke_width', temp);
			}

		}

	}
	
	
	


	
	
	

	
	var balloon_type = word_balloon_get_balloon();
	w_b_restore.setAttribute('data-choice_balloon', balloon_type);

	var balloon_data = document.getElementById('custom_balloon_' + balloon_type + '_' + avatar_position);

	balloon_atts += ' balloon="' + balloon_type + '"';

	temp = document.getElementById("w_b_edit_balloon_shadow").checked;
	if (temp) {
		balloon_atts += ' balloon_shadow="true"';
		w_b_restore.setAttribute('data-balloon_shadow', 'true');
	}

	temp = document.getElementById("w_b_balloon_full_width").checked;
	if (temp) {
		balloon_atts += ' balloon_full_width="true"';
		w_b_restore.setAttribute('data-balloon_full_width', 'true');
	}

	temp = document.getElementById("w_b_edit_balloon_vertical_writing").checked;
	if (temp) {
		balloon_atts += ' balloon_vertical_writing="true"';
		w_b_restore.setAttribute('data-balloon_vertical_writing', 'true');
	}

	temp = document.getElementById("w_b_edit_box_center").checked;
	if (temp) {
		balloon_atts += ' box_center="true"';
		w_b_restore.setAttribute('data-box_center', 'true');
	}

	temp = document.getElementById("w_b_edit_balloon_hide").checked;
	if (temp) {
		balloon_atts += ' balloon_hide="true"';
		w_b_restore.setAttribute('data-balloon_hide', 'true');
	}

	if (document.getElementById('w_b_edit_box_margin')) {
		temp = document.getElementById("w_b_edit_box_margin").checked;
		if (temp) {
			balloon_atts += ' box_margin="true"';
			w_b_restore.setAttribute('data-box_margin', 'true');
		}
	}


	temp = word_balloon_get_balloon_text_align();
	w_b_restore.setAttribute('data-text_align', temp);
	if (temp === 'C') {
		balloon_atts += ' text_align="C"';
	} else if (temp === 'R') {
		balloon_atts += ' text_align="R"';
	}



	temp = word_balloon_get_balloon_font_size();
	if (temp !== '') {
		balloon_atts += ' font_size="' + temp + '"';
		w_b_restore.setAttribute('data-font_size', temp);
	}

	
	if (document.getElementById('w_b_edit_balloon_quote_effect')) {
		temp = word_balloon_get_select_option_value('w_b_edit_balloon_quote_effect');

		if (temp !== '') {
			balloon_atts += ' quote_effect="' + temp + '"';
			w_b_restore.setAttribute('data-quote_effect', temp);

			temp = document.getElementById('w_b_edit_quote_effect_speed').value;
			w_b_restore.setAttribute('data-quote_effect_speed', temp);
			balloon_atts += ' quote_effect_speed="' + temp + '"';

			temp = document.getElementById("w_b_edit_quote_effect_minimum").checked;
			if (temp) {
				balloon_atts += ' quote_effect_minimum="true"';
				w_b_restore.setAttribute('data-quote_effect_minimum', 'true');
			}

		}
	}



	
	
	
	if (document.getElementById('w_b_edit_balloon_effect')) {
		temp = word_balloon_get_balloon_effect();

		w_b_restore.setAttribute('data-balloon_effect', temp);

		if (temp !== '') {
			balloon_atts += ' balloon_effect="' + temp + '"';
			if (document.getElementById('w_b_edit_balloon_effect_duration')) {
				temp = document.getElementById('w_b_edit_balloon_effect_duration').value;
				w_b_restore.setAttribute('data-balloon_effect_duration', temp);
				if (temp !== '') balloon_atts += ' balloon_effect_duration="' + temp + '"';
			}

		}

	}

	if (document.getElementById('w_b_edit_balloon_filter')) {
		temp = word_balloon_get_balloon_filter();
		w_b_restore.setAttribute('data-balloon_filter', temp);
		if (temp !== '') balloon_atts += ' balloon_filter="' + temp + '"';
	}

	if (document.getElementById('w_b_edit_balloon_in_view')) {
		temp = word_balloon_get_balloon_in_view();
		w_b_restore.setAttribute('data-balloon_in_view', temp);
		if (temp !== '') {
			balloon_atts += ' balloon_in_view="' + temp + '"';

			if (document.getElementById('w_b_edit_balloon_in_view_duration')) {
				temp = document.getElementById('w_b_edit_balloon_in_view_duration').value;
				w_b_restore.setAttribute('data-balloon_in_view_duration', temp);
				if (temp !== '') balloon_atts += ' balloon_in_view_duration="' + temp + '"';
			}
		}
	}




	temp = document.getElementById('w_b_edit_balloon_text_color').value;
	if (temp !== '' && temp !== balloon_data.getAttribute('data-color_value')) {
		balloon_atts += ' font_color="' + temp + '"';
		w_b_restore.setAttribute('data-font_color', temp);
	}



	
	if (['line', 'round', 'soi', 'tail', 'bump', 'upper', 'lower', 'rpg_1', 'rpg_3', 'tail_2', 'tail_3', 'twin_t', 'geek'].indexOf(balloon_type) !== -1) {
		if (word_balloon_is_alpha_balloon(balloon_type)) {
			temp = document.getElementById('w_b_edit_balloon_background_alpha').value;
		} else {
			temp = document.getElementById('w_b_edit_balloon_background').value;
		}

		if (temp !== '' && temp !== balloon_data.getAttribute('data-background_value')) {
			balloon_atts += ' bg_color="' + temp + '"';
			w_b_restore.setAttribute('data-balloon_background', temp);
		}
	}

	
	if (['round', 'round_2'].indexOf(balloon_type) !== -1) {
		temp = document.getElementById('w_b_edit_balloon_border_style').value;
		if (temp !== '' && temp !== balloon_data.getAttribute('data-border_style_value')) {
			balloon_atts += ' border_style="' + temp + '"';
			w_b_restore.setAttribute('data-border_style', temp);
		}

		temp = document.getElementById('w_b_edit_balloon_border_width').value;
		if (temp !== '' && temp !== balloon_data.getAttribute('data-border_width_value')) {
			balloon_atts += ' border_width="' + temp + '"';
			w_b_restore.setAttribute('data-border_width', temp);
		}

	}

	
	if (['round', 'bump', 'upper', 'lower', 'rpg_1', 'rpg_3', 'round_2', 'tail_3', 'twin_t'].indexOf(balloon_type) !== -1) {
		temp = document.getElementById('w_b_edit_balloon_border_color').value;
		if (temp !== '' && temp !== balloon_data.getAttribute('data-border_color_value')) {
			balloon_atts += ' border_color="' + temp + '"';
			w_b_restore.setAttribute('data-border_color', temp);
		}
	}

	
	if (['rpg_3'].indexOf(balloon_type) !== -1) {
		temp = document.getElementById('w_b_edit_balloon_shadow_color').value;
		if (temp !== '' && temp !== balloon_data.getAttribute('data-balloon_shadow_color_value')) {
			balloon_atts += ' balloon_shadow_color="' + temp + '"';
			w_b_restore.setAttribute('data-balloon_shadow_color', temp);
		}
	}

	
	
	

	temp = document.getElementById("w_b_status_comment").value;
	if (temp !== '') {
		status_atts += ' status="' + temp + '"';
		w_b_restore.setAttribute('data-status', temp);

		temp = document.getElementById("w_b_edit_status_color").value;
		if (temp !== '') {
			status_atts += ' status_color="' + temp + '"';
			w_b_restore.setAttribute('data-status_color', temp);
		}
	}

	if (document.getElementById("w_b_status_sound_id")) {

		temp = document.getElementById("w_b_status_sound_id").value;
		if (temp !== '') {
			status_atts += ' sound="' + temp + '"';
			w_b_restore.setAttribute('data-status_sound_id', temp);
			w_b_restore.setAttribute('data-status_sound_filename', document.getElementById("w_b_status_sound_filename").value);
			w_b_restore.setAttribute('data-status_sound_url', document.getElementById("w_b_status_sound_url").value);
		}

	}

	
	
	

	if (document.getElementById('w_b_edit_choice_balloon_m')) {

		temp = word_balloon_get_select_option_value('w_b_edit_choice_balloon_m');
		if (temp !== '') {
			w_b_restore.setAttribute('data-balloon_m', temp);
			mobile_atts += ' balloon_m="' + temp + '"';
		}

		temp = word_balloon_get_select_option_value('w_b_edit_select_avatar_size_m');
		if (temp !== '') {
			w_b_restore.setAttribute('data-avatar_size_m', temp);
			mobile_atts += ' avatar_size_m="' + temp + '"';
		}

		temp = word_balloon_get_select_option_value('w_b_edit_select_name_position_m');
		if (temp !== '') {
			mobile_atts += ' name_position_m="' + temp + '"';
			w_b_restore.setAttribute('data-name_position_m', temp);
		}

		temp = word_balloon_get_select_option_value('w_b_edit_font_size_m');
		if (temp !== '') {
			w_b_restore.setAttribute('data-font_size_m', temp);
			mobile_atts += ' font_size_m="' + temp + '"';
		}

	}

	return '[word_balloon' + avatar_atts + balloon_atts + icon_atts + status_atts + mobile_atts + ']' + quote + '[/word_balloon]';


}


function word_balloon_modal_reset() {

	var temp = '';
	
	document.getElementById('w_b_post_text').value = '';
	document.getElementById('w_b_post_pre_text').innerHTML = '';
	document.getElementById('w_b_post_text_ph').style.display = 'block';

	var reset_select = ['w_b_edit_icon_type', 'w_b_edit_avatar_effect', 'w_b_edit_icon_effect', 'w_b_edit_balloon_effect', 'w_b_edit_avatar_filter', 'w_b_edit_icon_filter', 'w_b_edit_balloon_filter'];

	for (var i = 0; i < reset_select.length; i++) {

		if (document.getElementById(reset_select[i])) {

			var e = document.getElementById(reset_select[i]);

			for (var j = 0; j < e.options.length; j++) {
				if (e.options[j].value === '') {
					e[j].selected = true;
					break;
				}
			}

		}

	}

	
	if (document.getElementById('w_b_edit_icon_type') && typeof window['word_balloon_set_icon_type'] === 'function')
		word_balloon_set_icon_type();

	
	if (document.getElementById('w_b_edit_balloon_effect') && typeof window['word_balloon_change_balloon_effect'] === 'function') {
		word_balloon_change_balloon_effect();
		if (document.getElementById('w_b_edit_balloon_effect_duration') && typeof window['word_balloon_effect_duration_clear'] === 'function')
			word_balloon_effect_duration_clear('balloon');
	}

	if (document.getElementById('w_b_edit_icon_effect') && typeof window['word_balloon_change_icon_effect'] === 'function') {
		word_balloon_change_icon_effect();
		if (document.getElementById('w_b_edit_icon_effect_duration') && typeof window['word_balloon_effect_duration_clear'] === 'function')
			word_balloon_effect_duration_clear('icon');
	}

	if (document.getElementById('w_b_edit_avatar_effect') && typeof window['word_balloon_change_avatar_effect'] === 'function') {
		word_balloon_change_avatar_effect();
		if (document.getElementById('w_b_edit_avatar_effect_duration') && typeof window['word_balloon_effect_duration_clear'] === 'function')
			word_balloon_effect_duration_clear('avatar');
	}

	
	if (document.getElementById('w_b_edit_balloon_in_view') && typeof window['word_balloon_change_balloon_in_view'] === 'function') {
		word_balloon_change_balloon_effect();
		if (document.getElementById('w_b_edit_balloon_in_view_duration') && typeof window['word_balloon_in_view_duration_clear'] === 'function')
			word_balloon_in_view_duration_clear('balloon');
	}

	if (document.getElementById('w_b_edit_icon_in_view') && typeof window['word_balloon_change_icon_in_view'] === 'function') {
		word_balloon_change_icon_effect();
		if (document.getElementById('w_b_edit_icon_in_view_duration') && typeof window['word_balloon_in_view_duration_clear'] === 'function')
			word_balloon_in_view_duration_clear('icon');
	}

	if (document.getElementById('w_b_edit_avatar_in_view') && typeof window['word_balloon_change_avatar_in_view'] === 'function') {
		word_balloon_change_avatar_effect();
		if (document.getElementById('w_b_edit_avatar_in_view_duration') && typeof window['word_balloon_in_view_duration_clear'] === 'function')
			word_balloon_in_view_duration_clear('avatar');
	}

	
	if (document.getElementById('w_b_edit_balloon_filter') && typeof window['word_balloon_change_balloon_filter'] === 'function')
		word_balloon_change_balloon_filter();

	if (document.getElementById('w_b_edit_icon_filter') && typeof window['word_balloon_change_icon_filter'] === 'function')
		word_balloon_change_icon_filter();

	if (document.getElementById('w_b_edit_avatar_filter') && typeof window['word_balloon_change_avatar_filter'] === 'function')
		word_balloon_change_avatar_filter();

	
	if (document.getElementById('w_b_edit_avatar_in_view'))
		word_balloon_change_select_option('w_b_edit_avatar_in_view', '');

	if (document.getElementById('w_b_edit_icon_in_view'))
		word_balloon_change_select_option('w_b_edit_icon_in_view', '');

	if (document.getElementById('w_b_edit_balloon_in_view'))
		word_balloon_change_select_option('w_b_edit_balloon_in_view', '');

	
	if (document.getElementById('w_b_edit_balloon_quote_effect'))
		word_balloon_change_select_option('w_b_edit_balloon_quote_effect', '');

	
	document.getElementById('w_b_status_comment').value = '';

	
	document.getElementById('w_b_status_sound_filename').value = '';
	document.getElementById('w_b_status_sound_url').value = '';
	document.getElementById('w_b_status_sound_id').value = '';
	word_balloon_change_status_box();

	
	temp = document.getElementById('w_b_edit_status_color').getAttribute('data-default_color');
	document.getElementById('w_b_edit_status_color').value = temp;
	document.querySelector('#w_b_edit_status_color_wrap button.wp-color-result').style.background = temp;
	document.getElementById('w_b_status').style.color = temp;
	document.getElementById('w_b_status').innerHTML = '';


	
	temp = document.getElementById('w_b_edit_avatar_name_color').getAttribute('data-default_color');
	document.getElementById('w_b_edit_avatar_name_color').value = temp;
	document.querySelector('#w_b_edit_avatar_name_color_wrap button.wp-color-result').style.background = temp;
	document.getElementById('w_b_name_' + word_balloon_get_avatar_name_position()).style.color = temp;

	
	temp = document.getElementById('w_b_font_size_default').value;
	if (temp === '') temp = 16;
	word_balloon_set_balloon_font_size(temp);
	word_balloon_change_balloon_font_size();

}


function word_balloon_insert_text_editor(word) {



	var editor = word_balloon_now_editor();


	if (editor === 'text') {
		var textarea = document.querySelector('textarea.wp-editor-area');


		word = word + '\n';
		word = word.replace('][/word_balloon', ']' + '\n' + '\n' + '[/word_balloon');
		if (document.selection && textarea.tagName == 'TEXTAREA') {
			
			textarea.focus();
			sel = document.selection.createRange();
			sel.word = word;
			textarea.focus();
		} else if (textarea.selectionStart || textarea.selectionStart == '0') {
			
			startPos = textarea.selectionStart;
			endPos = textarea.selectionEnd;
			scrollTop = textarea.scrollTop;
			textarea.value = textarea.value.substring(0, startPos) + word + textarea.value.substring(endPos, textarea.value.length);
			textarea.focus();
			textarea.selectionStart = startPos + word.length;
			textarea.selectionEnd = startPos + word.length;
			textarea.scrollTop = scrollTop;
		} else {
			
			textarea.value += word;
			textarea.focus();
			textarea.value = textarea.value; 
		}

	} else {
		if (word.match(/\]\[\/word_balloon/)) {
			word = word.replace('][/word_balloon', ']' + '<br><span id="_w_b_caret"></span><br>' + '[/word_balloon');
		} else {
			word = word + '<br><span id="_w_b_caret"></span><br>';
		}

		
		tinymce.activeEditor.execCommand('mceInsertContent', false, word);

		tinymce.activeEditor.focus();
		tinymce.activeEditor.selection.select(tinymce.activeEditor.dom.select('#_w_b_caret')[0]);
		tinymce.activeEditor.selection.collapse(0);
		tinymce.activeEditor.dom.setAttrib('_w_b_caret', 'id', '');

	}

}




document.addEventListener("DOMContentLoaded", function () {
	
	var $html = document.documentElement,
		$body = document.body,
		$overlay = document.getElementById('w_b_overlay'),
		scrollbar_width = window.innerWidth - document.body.scrollWidth,
		touch_start_y,
		scrollbar_scrolltop;
	
	window.addEventListener('touchstart', function (event) {
		
		touch_start_y = event.changedTouches[0].screenY;
	});

	if (document.getElementById('w_b_modal_open')) {
		document.getElementById('w_b_modal_open').onclick = function () {
			
			
			if ('scrollingElement' in document) {
				
				scrollbar_scrolltop = document.scrollingElement.scrollTop;
			} else {
				
				scrollbar_scrolltop = document.body.scrollTop;
			}

			
			//$window.on('touchmove.noscroll', function(event) {
			window.addEventListener('touchmove.noscroll', function (event) {
				var overlay = $overlay[0],
					current_y = event.originalEvent.changedTouches[0].screenY,
					
					height = $overlay.offsetHeight,
					is_top = touch_start_y <= current_y && overlay.scrollTop === 0,
					is_bottom = touch_start_y >= current_y && overlay.scrollHeight - overlay.scrollTop === height;

				
				if (is_top || is_bottom) {
					
					event.preventDefault();
				}
			});
			
			
			$html.style.overflow = 'hidden';
			$body.style.overflow = 'hidden';


			
			if (scrollbar_width) {
				
				
				$html.style.paddingRight = scrollbar_width;
			}
			
			
			$overlay.style.visibility = 'hidden';
			
			word_balloon_fadeIn($overlay, 'block');
			
			$overlay.style.visibility = 'visible';
			
			
		}
	}
	
	var closeModal = function () {
		$body.style.overflow = '';
		
		
		window.removeEventListener('touchmove.noscroll', arguments.callee);
		
		word_balloon_fadeOut($overlay);
		//$overlay.animate({
		//	opacity: 0
		//}, 300, function() {
		
		//	$overlay.scrollTop(0).hide().removeAttr('style');
		
		//	$html.removeAttr('style');
		//});

		$html.style.overflow = '';

		
		
		if (scrollbar_scrolltop === 0) scrollbar_scrolltop = 1;

		
		if ('scrollingElement' in document) {
			
			document.scrollingElement.scrollTop = scrollbar_scrolltop;
		} else {
			
			document.body.scrollTop = scrollbar_scrolltop;
		}

	};

	if ($overlay) {
		$overlay.addEventListener('click', function (e) {
			if (e.target.firstElementChild && e.target.firstElementChild.className === 'w_b_modal') {
				closeModal();
			}
		});
	}

	if (document.getElementById('w_b_modal_close')) {
		document.getElementById('w_b_modal_close').onclick = function () {
			closeModal();
		};
	}

	
	if (document.getElementById('w_b_avatar_data_submit')) {
		document.getElementById("w_b_avatar_data_submit").onclick = function () {

			var word = word_balloon_now_data_copy();

			word_balloon_insert_text_editor(word);

			
			closeModal();
			
			word_balloon_modal_reset();
			
			word_balloon_pop_up_message(translations_word_balloon.pop_up_shortcode_inserted, '#28a745');
		};
	}


	
	if (document.getElementsByClassName('w_b_wallpaper_panel').length) {

		var button = document.getElementsByClassName('w_b_wallpaper_submit');
		for (var i = 0; i < button.length; i++) {
			button[i].addEventListener("click", function (e) {
				var wallpaper_number = e.target.getAttribute('data-wallpaper_number');
				word_balloon_insert_text_editor('[word_balloon_wallpaper id="' + wallpaper_number + '"][/word_balloon_wallpaper]');
				closeModal();
				word_balloon_pop_up_message(translations_word_balloon.pop_up_shortcode_inserted, '#28a745');
			}, false);
		}


	}


	if (document.getElementById('w_b_side_by_side_insert')) {
		
		document.getElementById('w_b_side_by_side_insert').onclick = function () {

			var side_by_side_position = word_balloon_get_select_option_value('w_b_select_side_by_side_position'),
				side_by_side_wrap = word_balloon_get_select_option_value('w_b_select_side_by_side_wrap');

			word_balloon_insert_text_editor('[word_balloon_side_by_side position="' + side_by_side_position + '" wrap="' + side_by_side_wrap + '"][/word_balloon_side_by_side]');

			closeModal();
			word_balloon_pop_up_message(translations_word_balloon.pop_up_shortcode_inserted, '#28a745');
		}
	}


	
	if (document.getElementById('w_b_do_copy')) {
		document.getElementById('w_b_do_copy').onclick = function () {

			var ok = word_balloon_data_to_clipboard(word_balloon_now_data_copy());

			if (ok === '') return;

			closeModal();
			word_balloon_modal_reset();

			word_balloon_pop_up_message(translations_word_balloon.pop_up_shortcode_copied, '#28a745');
		};
	}


});











































if (document.getElementById('w_b_ava_wrap')) {
	document.getElementById('w_b_ava_wrap').addEventListener('click', function (e) {
		
		var custom_uploader;
		e.preventDefault();
		if (custom_uploader) {
			custom_uploader.open();
			return;
		}
		custom_uploader = wp.media({
			title: translations_word_balloon.select_an_avatar,
			library: {
				type: "image"
			},
			button: {
				text: translations_word_balloon.select
			},
			multiple: false
		});
		custom_uploader.on('select', function () {
			var images = custom_uploader.state().get('selection');

			images.each(function (file) {

				var select_image_avatar_url;
				if (file.attributes.width <= 512) {
					select_image_avatar_url = file.attributes.sizes.full.url;
				} else if (typeof file.attributes.sizes.large != "undefined" && file.attributes.sizes.large.width <= 512) {
					select_image_avatar_url = file.attributes.sizes.large.url;
				} else if (typeof file.attributes.sizes.medium != "undefined" && file.attributes.sizes.medium.width <= 512) {
					select_image_avatar_url = file.attributes.sizes.medium.url;
				} else if (typeof file.attributes.sizes.thumbnail != "undefined") {
					select_image_avatar_url = file.attributes.sizes.thumbnail.url;
				} else {
					select_image_avatar_url = file.attributes.sizes.full.url;

				}

				document.getElementById('w_b_ava_img').setAttribute('src', select_image_avatar_url);

				var option = document.createElement('option');
				option.value = 'unset';
				option.text = translations_word_balloon.anonymous;
				option.setAttribute('data-avatar_name', '');
				option.setAttribute('data-avatar_img', select_image_avatar_url);
				option.setAttribute('selected', 'selected');

				document.getElementById("w_b_avatar_select").appendChild(option);

				document.getElementById("w_b_avatar_name").value = '';

				word_balloon_set_avatar_name(word_balloon_get_avatar_name_position());

				
				

				

				

				
				

			});
		});
		custom_uploader.open();
	});
}









function word_balloon_data_to_clipboard(word) {
	if (!word || typeof (word) !== 'string') return '';





	
	var textarea = document.createElement('textarea');
	textarea.id = 'w_b_temp_text';
	textarea.value = word;
	document.body.appendChild(textarea);
	


	
	var w_b_temp = document.getElementById("w_b_temp_text");

	
	w_b_temp.select();

	
	var range = document.createRange();
	range.selectNodeContents(w_b_temp);
	var sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange(range);
	w_b_temp.setSelectionRange(0, 9999999);

	
	document.execCommand("copy");

	
	
	w_b_temp.remove();

	return 'ok';
}











