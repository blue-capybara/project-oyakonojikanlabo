


function word_balloon_balloon_change_talk_oc(data) {

	var w_b_wrap = document.getElementById('w_b_wrap');

	word_balloon_reset_over_under_balloon('over');

	w_b_wrap.classList.add( 'w_b_ai_c' );

	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';

	return data;

}



