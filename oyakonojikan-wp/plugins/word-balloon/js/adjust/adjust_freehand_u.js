


function word_balloon_balloon_change_freehand_u(data) {

	word_balloon_reset_over_under_balloon('under');

	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';

	word_balloon_make_balloon_svg(data["balloon"],data["side"]);

	return data;

}

function word_balloon_change_balloon_space_freehand_u(box) {


	//if(word_balloon_get_avatar_name_position() != "under_balloon"){
	//	box["padding_bottom"] = 14;
	//}

	return box;

}


function word_balloon_status_box_margin_freehand_u(side , position) {

	var w_b_status_box = document.getElementById('w_b_status_box');
	w_b_status_box.style.marginTop = '12px';

}

function word_balloon_name_on_balloon_margin_freehand_u(side) {

	var name_position = document.getElementById('w_b_name_on_balloon');

	name_position.style.marginBottom = '-16px';

}


