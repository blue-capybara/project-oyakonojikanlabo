
function word_balloon_get_avatar_effect(){
	return word_balloon_get_select_option_value('w_b_edit_avatar_effect');
}

function word_balloon_change_avatar_filter(){
	word_balloon_filter_reset ( 'avatar' , 'w_b_ava_img' );
}

function word_balloon_change_balloon_filter(){
	word_balloon_filter_reset ( 'balloon' , 'w_b_bal' );
}

function word_balloon_change_icon_filter(){
	word_balloon_filter_reset ( 'icon' , 'w_b_icon_svg' );
}



function word_balloon_filter_reset (type , target) {

	var filter = eval('word_balloon_get_' + type + '_filter()');

	target = document.getElementById(target);

	var arr = JSON.parse(document.getElementById('w_b_type_filter').dataset.type);

	for (var i = 0; i < arr.length; i++) {
		target.classList.remove( 'w_b_f_' + arr[i] );
	}

	if(filter !== ''){
		target.classList.add( 'w_b_f_' + filter );
	}
}

