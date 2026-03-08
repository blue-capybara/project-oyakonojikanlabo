


function word_balloon_balloon_change_think(data) {

	word_balloon_reset_over_under_balloon('over');

	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';

	return data;

}

function word_balloon_change_balloon_space_think(box) {

	if(word_balloon_get_avatar_name_position() !== "under_balloon"){
		box["padding_bottom"] = 18;
	}

	return box;

}


