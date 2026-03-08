


function word_balloon_balloon_change_talk_u(data) {

	word_balloon_reset_over_under_balloon('under');

	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';

	return data;

}

function word_balloon_change_balloon_space_talk_u(box) {

	if(word_balloon_get_avatar_name_position() !== "on_balloon"){
		box["padding_top"] = 14;
	}

	return box;

}


