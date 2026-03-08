


function word_balloon_balloon_change_think_2(data) {

	word_balloon_reset_over_under_balloon('over');

	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';

	word_balloon_make_balloon_svg(data["balloon"],data["side"]);

	return data;

}



function word_balloon_status_box_margin_think_2(side , position) {

	var w_b_status_box = document.getElementById('w_b_status_box');

	w_b_status_box.style.marginBottom = '16px';

}


