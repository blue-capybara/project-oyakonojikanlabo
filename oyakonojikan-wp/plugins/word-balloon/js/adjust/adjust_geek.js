


function word_balloon_balloon_change_geek(data) {

	document.getElementById('w_b_wrap').classList.add( 'w_b_ai_c' );

	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';
	document.getElementById('w_b_edit_balloon_background_alpha_wrap').style.display = 'block';

	return data;

}

function word_balloon_change_balloon_space_geek(box) {

	if(word_balloon_get_avatar_name_position() === "under_avatar"){
		box["padding_bottom"] = box["name_margin"];
	}else if(word_balloon_get_avatar_name_position() === "on_avatar"){
		box["padding_top"] = box["name_margin"];
	}else if(word_balloon_get_avatar_name_position() === "under_balloon"){
		box["avatar_padding_bottom"] = box["name_margin"];
	}else if(word_balloon_get_avatar_name_position() === "on_balloon"){
		box["avatar_padding_top"] = box["name_margin"];
	}

	return box;

}



