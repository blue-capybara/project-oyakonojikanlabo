


function word_balloon_balloon_change_talk(data) {

	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';

	return data;

}

function word_balloon_change_balloon_space_talk(box) {

	var on_balloon_margin = 0;
	if(word_balloon_get_avatar_name_position() === "on_balloon"){
		on_balloon_margin = box["name_margin"];
	}else if(word_balloon_get_avatar_name_position() === "on_avatar"){
		on_balloon_margin = -box["name_margin"];
	}

	box["padding_top"] = parseInt( document.getElementById('w_b_avatar_custom_size_'+box["size"]).value / 2.5 - on_balloon_margin );

	return box;

}


