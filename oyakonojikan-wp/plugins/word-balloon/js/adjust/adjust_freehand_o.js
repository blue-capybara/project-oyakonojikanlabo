


function word_balloon_balloon_change_freehand_o(data) {

	word_balloon_reset_over_under_balloon('over');

	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';

	word_balloon_make_balloon_svg(data["balloon"],data["side"]);

	return data;

}

function word_balloon_change_balloon_space_freehand_o(box) {

	return box;

}


function word_balloon_status_box_margin_freehand_o(side , position) {

	var w_b_status_box = document.getElementById('w_b_status_box');

	if(side === 'L'){
		w_b_status_box.style.marginBottom = '20px';
	}else{
		w_b_status_box.style.marginBottom = '16px';
	}

}

function word_balloon_name_under_balloon_margin_freehand_o(side) {

	var name_position = document.getElementById('w_b_name_under_balloon');

	name_position.style.marginTop = '-16px';


}
