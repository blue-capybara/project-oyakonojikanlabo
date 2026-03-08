


function word_balloon_balloon_change_freehand(data) {

	var w_b_ava_box = document.getElementById('w_b_ava_box');
	var w_b_bal_box = document.getElementById('w_b_bal_box');
	var w_b_bal = document.getElementById('w_b_bal');


	w_b_ava_box.classList.add( 'w_b_mta' );
	w_b_bal_box.classList.add( 'w_b_mta' );



	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';


	word_balloon_make_balloon_svg(data["balloon"],data["side"]);


	return data;

}

function word_balloon_change_balloon_space_freehand(box) {

	var under_avatar_margin = 0;
	if(word_balloon_get_avatar_name_position() === "under_avatar"){
		under_avatar_margin = box["name_margin"];
	}else if(word_balloon_get_avatar_name_position() === "under_balloon"){
		box["avatar_padding_bottom"] = box["name_margin"];
	}

	box["padding_bottom"] = under_avatar_margin + 5;

	return box;

}

/*
function word_balloon_status_box_margin_freehand(side , position) {

	//var w_b_status_box = document.getElementById('w_b_status_box');

	//if( position === 'on_balloon' ){
	//	w_b_status_box.style.marginTop = '-8px';
	//}

	//w_b_status_box.style.marginBottom = '28px';

	//if(side === 'L'){
	//	w_b_status_box.style.marginLeft = '-22px';
	//}else{
	//	w_b_status_box.style.marginRight = '-22px';
	//}


}
*/
function word_balloon_sound_box_margin_freehand(side) {

	//if(side === 'L'){
		return 'margin-top:22px;';
	//}else{
		//return 'margin-right:-6px;margin-bottom:28px;';
	//}


}
/*
function word_balloon_name_on_balloon_margin_freehand(side) {

	var name_position = document.getElementById('w_b_name_on_balloon');

	name_position.style.marginTop = '';
	name_position.style.marginBottom = '';

	if(side === 'L'){

		name_position.style.marginRight = '28px';
		name_position.style.marginLeft = '';

	}else{

		name_position.style.marginRight = '';
		name_position.style.marginLeft = '28px';

	}

}

function word_balloon_name_under_balloon_margin_freehand(side) {

	var name_position = document.getElementById('w_b_name_under_balloon');

	name_position.style.marginTop = '';
	name_position.style.marginBottom = '-15px';

	if(side === 'L'){

		name_position.style.marginRight = '30px';
		name_position.style.marginLeft = '';

	}else{

		name_position.style.marginRight = '';
		name_position.style.marginLeft = '30px';

	}

}
*/