


function word_balloon_balloon_change_heart(data) {

	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';

	word_balloon_make_balloon_svg(data["balloon"],data["side"]);

	return data;

}

function word_balloon_change_balloon_space_heart(box) {

	if(word_balloon_get_avatar_name_position() === "on_avatar"){
		box["padding_top"] = box["name_margin"];
	}else if(word_balloon_get_avatar_name_position() === "on_balloon"){
		box["avatar_padding_top"] = box["name_margin"];
	}
	return box;

}
