
function word_balloon_restore_data_name() {
	return JSON.parse(document.getElementById('w_b_type_restore').dataset.type);
	
}

function word_balloon_restore_reset() {

	var reset_item = word_balloon_restore_data_name();

	for (var i = 0; i < reset_item.length; i++) {
		document.getElementById('w_b_restore').setAttribute('data-' + reset_item[i], '');
		
	}
	document.getElementById('w_b_restore').setAttribute('data-text_color', '');
	document.getElementById('w_b_restore').setAttribute('data-balloon_border_color', '');
	
	

}






if (document.getElementById('w_b_do_restore')) {

	document.getElementById('w_b_do_restore').onclick = function () {

		if (document.getElementById('w_b_restore').getAttribute('data-enable') === 'false') return;
		word_balloon_load_data_set();

	};

}







if (document.getElementById('w_b_restore_copy')) {
	document.getElementById('w_b_restore_copy').onclick = function () {

		

		var result = /\[word_balloon (.*?)\]([\s\S]*?)\[\/word_balloon\]/.exec(word_balloon_getSelectionText());

		if (result) {
			

			if (word_balloon_restore_copy(result)) {
				
				word_balloon_load_data_set();

				word_balloon_pop_up_message(translations_word_balloon.pop_up_restore, '#28a745');

			}

		} else {
			word_balloon_pop_up_message(translations_word_balloon.pop_up_restore_fail, '#dc3848');
		}

	};
}





function word_balloon_restore_copy(result) {
	word_balloon_restore_reset();

	
	
	var w_b_restore = document.getElementById('w_b_restore');

	var result2 = / balloon="(.*?)"/.exec(result[1]);
	if (null !== result2) {
		
		if (document.getElementById('custom_balloon_' + result2[1] + '_L') != null) {

			w_b_restore.setAttribute('data-choice_balloon', result2[1]);
		} else {
			
			
			console.log('No balloon');
			return false;

		}
	}

	result2 = /id="(.*?)"/.exec(result[1]);
	if (null !== result2) {
		w_b_restore.setAttribute('data-id', result2[1]);
		w_b_restore.setAttribute('data-avatar_select', result2[1]);
		
		
	}

	result2 = / position="(.*?)"/.exec(result[1]);
	if (null !== result2) {
		w_b_restore.setAttribute('data-avatar_position', result2[1]);
	}

	result2 = / size="(.*?)"/.exec(result[1]);
	if (null !== result2) {
		w_b_restore.setAttribute('data-avatar_size', result2[1]);
	}

	result2 = / name="(.*?)"/.exec(result[1]);
	if (null !== result2) {
		w_b_restore.setAttribute('data-avatar_name', result2[1]);
	}

	result2 = / radius="(.*?)"/.exec(result[1]);
	if (null !== result2) {
		w_b_restore.setAttribute('data-avatar_border_radius', result2[1]);
	}

	result2 = / bg_color="(.*?)"/.exec(result[1]);
	if (null !== result2) {
		w_b_restore.setAttribute('data-balloon_background', result2[1]);
	}

	result2 = / border_color="(.*?)"/.exec(result[1]);
	if (null !== result2) {
		w_b_restore.setAttribute('data-balloon_border_color', result2[1]);
	}

	result2 = / font_color="(.*?)"/.exec(result[1]);
	if (null !== result2) {
		w_b_restore.setAttribute('data-text_color', result2[1]);
	}


	result2 = / sound="(.*?)"/.exec(result[1]);
	if (null !== result2) {
		w_b_restore.setAttribute('data-status_sound_id', result2[1]);
	}

	result2 = / text_align="(.*?)"/.exec(result[1]);
	if (null !== result2) {
		w_b_restore.setAttribute('data-text_align', result2[1]);
	} else {
		w_b_restore.setAttribute('data-text_align', 'L');
	}

	result2 = / icon_flip="(.*?)"/.exec(result[1]);
	if (null !== result2) {
		if (result2[1] === 'hv') {
			w_b_restore.setAttribute('data-icon_flip_h', 'true');
			w_b_restore.setAttribute('data-icon_flip_v', 'true');
		} else if (result2[1] === 'h') {
			w_b_restore.setAttribute('data-icon_flip_h', 'true');
		} else if (result2[1] === 'v') {
			w_b_restore.setAttribute('data-icon_flip_v', 'true');
		}
	}

	result2 = / avatar_flip="(.*?)"/.exec(result[1]);
	if (null !== result2) {
		if (result2[1] === 'hv') {
			w_b_restore.setAttribute('data-avatar_flip_h', 'true');
			w_b_restore.setAttribute('data-avatar_flip_v', 'true');
		} else if (result2[1] === 'h') {
			w_b_restore.setAttribute('data-avatar_flip_h', 'true');
		} else if (result2[1] === 'v') {
			w_b_restore.setAttribute('data-avatar_flip_v', 'true');
		}
	}

	var copy_item = word_balloon_restore_data_name();

	var delete_item = ['balloon', 'id', 'position', 'size', 'name', 'radius', 'bg_color', 'border_color', 'font_color', 'sound', 'text_align', 'icon_flip', 'avatar_flip'];


	for (var i = 0; i < delete_item.length; i++) {

		var idx = copy_item.indexOf(delete_item[i]);
		if (idx >= 0) {
			copy_item.splice(idx, 1);
		}

	}

	for (var i = 0; i < copy_item.length; i++) {
		reg = new RegExp(' ' + copy_item[i] + '="(.*?)"');

		result2 = reg.exec(result[1]);
		if (null !== result2) {
			w_b_restore.setAttribute('data-' + copy_item[i], result2[1]);
		}
	}




	if (null !== result[2]) {
		//result[2] = result[2].replace( /<p>&nbsp;<\/p>/g , "\r\r" );
		//result[2] = result[2].replace( /<br \/>/g , "\r" );
		//result[2] = result[2].replace( /<br>/g , "\r" );

		result[2] = result[2].replace(/\r/g, "<br>");

		w_b_restore.setAttribute('data-balloon_quote', result[2]);
	}

	
	
	

	document.getElementById('w_b_restore').setAttribute('data-enable', 'true');
	document.getElementById('w_b_do_restore').style.color = '#444';
	document.getElementById('w_b_do_restore').style.cursor = 'pointer';

	return true;

}
