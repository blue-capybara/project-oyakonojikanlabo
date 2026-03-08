


function word_balloon_balloon_change_bump(data) {

	document.getElementById('w_b_edit_balloon_background_wrap').style.display = 'block';
	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';
	document.getElementById('w_b_edit_balloon_border_color_wrap').style.display = 'block';

	document.getElementById('w_b_edit_border_wrap').style.display = 'block';
	document.getElementById('w_b_edit_border_label').style.display = 'inline-block';

	return data;

}

function word_balloon_change_balloon_space_bump(box) {

	box["padding_top"] = box["name_margin"];
	if(word_balloon_get_avatar_name_position() === "on_avatar"){
		box["padding_top"] = box["name_margin"] * 2;
	}else if(word_balloon_get_avatar_name_position() === "on_balloon"){
		box["padding_top"] = '';
	}

	return box;

}


