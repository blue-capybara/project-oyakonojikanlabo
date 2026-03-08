


function word_balloon_balloon_change_rpg_1(data) {

	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';
	document.getElementById('w_b_edit_balloon_background_alpha_wrap').style.display = 'block';
	document.getElementById('w_b_edit_balloon_border_color_wrap').style.display = 'block';
	document.getElementById('w_b_edit_border_wrap').style.display = 'block';
	document.getElementById('w_b_edit_border_label').style.display = 'inline-block';

	return data;

}

function word_balloon_change_balloon_space_rpg_1(box) {

	if(word_balloon_get_avatar_name_position() === "on_avatar"){
		box["padding_top"] = box["name_margin"];
	}else if(word_balloon_get_avatar_name_position() === "on_balloon"){
		box["avatar_padding_top"] = box["name_margin"];
	}

	return box;

}


