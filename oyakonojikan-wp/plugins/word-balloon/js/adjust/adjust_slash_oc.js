function word_balloon_balloon_change_slash_oc(data) {

	var w_b_wrap = document.getElementById('w_b_wrap');
	var w_b_bal_outer = document.getElementById('w_b_bal_outer');

	word_balloon_reset_over_under_balloon('over');

	w_b_wrap.classList.add( 'w_b_ai_c' );

	w_b_bal_outer.classList.add( 'w_b_jc_c' );

	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';


	word_balloon_make_balloon_svg(data["balloon"],data["side"]);


	return data;

}
