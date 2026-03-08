


function word_balloon_balloon_change_upper(data) {

	word_balloon_reset_over_under_balloon('over');

	document.getElementById('w_b_edit_balloon_background_wrap').style.display = 'block';
	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';
	document.getElementById('w_b_edit_balloon_border_color_wrap').style.display = 'block';

	document.getElementById('w_b_edit_border_wrap').style.display = 'block';
	document.getElementById('w_b_edit_border_label').style.display = 'inline-block';

	return data;

}

function word_balloon_change_balloon_space_upper(box) {

	if(word_balloon_get_avatar_name_position() !== "under_balloon"){
		box["padding_bottom"] = 16;
	}

	return box;

}


