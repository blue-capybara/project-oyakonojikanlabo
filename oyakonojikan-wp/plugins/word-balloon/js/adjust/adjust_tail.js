


function word_balloon_balloon_change_tail(data) {

	var w_b_ava_box = document.getElementById('w_b_ava_box');

	w_b_ava_box.classList.add( 'w_b_mta' );

	document.getElementById('w_b_edit_balloon_background_wrap').style.display = 'block';
	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';

	return data;

}

function word_balloon_change_balloon_space_tail(box) {

	var under_avatar_margin = 0;
	if(word_balloon_get_avatar_name_position() === "under_avatar"){
		under_avatar_margin = box["name_margin"];
	}else if(word_balloon_get_avatar_name_position() === "on_avatar"){
		box["padding_top"] = box["name_margin"];
	}else if(word_balloon_get_avatar_name_position() === "under_balloon"){
		box["avatar_padding_bottom"] = box["name_margin"];
	}else if(word_balloon_get_avatar_name_position() === "on_balloon"){
		box["avatar_padding_top"] = box["name_margin"];
	}

	box["padding_bottom"] = parseInt( document.getElementById('w_b_avatar_custom_size_'+box["size"]).value * 0.48 + under_avatar_margin);

	return box;

}


