


function word_balloon_balloon_change_wriggle(data) {

	var w_b_ava_box = document.getElementById('w_b_ava_box');
	var w_b_bal_box = document.getElementById('w_b_bal_box');
	var w_b_bal = document.getElementById('w_b_bal');

	w_b_ava_box.classList.add( 'w_b_mta' );
	w_b_bal_box.classList.add( 'w_b_mta' );

	if(data["side"] === 'L'){
		
		//w_b_bal.style.marginRight = 'auto';
	}else{
		//w_b_bal.style.marginRight = 'auto';
	}

	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';

	//word_balloon_make_balloon_svg(data["balloon"],data["side"]);

	return data;

}

function word_balloon_change_balloon_space_wriggle(box) {

	var under_avatar_margin = 0;
	if(word_balloon_get_avatar_name_position() === "under_avatar"){
		under_avatar_margin = box["name_margin"];
	}else if(word_balloon_get_avatar_name_position() === "under_balloon"){
		box["avatar_padding_top"] = box["name_margin"] + 5;
	}

	box["padding_bottom"] = under_avatar_margin + 5;

	return box;

}


function word_balloon_status_box_margin_wriggle(side , position) {

	var w_b_status_box = document.getElementById('w_b_status_box');

/*
	if(position === 'on_balloon'){
		w_b_status_box.style.marginTop = '22px';
	}
	*/

	if(position !== 'under_balloon'){
		w_b_status_box.style.marginBottom = '26px';
	}else{
		w_b_status_box.style.marginBottom = '';
	}


	if(side === 'L'){
		//w_b_status_box.style.marginLeft = '-16px';
	}else{
		//w_b_status_box.style.marginRight = '-16px';
	}

}

function word_balloon_sound_box_margin_wriggle(side) {

	return 'margin-top:-8px;';


}


function word_balloon_name_on_balloon_margin_wriggle(side) {

	var name_position = document.getElementById('w_b_name_on_balloon');

	name_position.style.marginTop = '';
	name_position.style.marginBottom = '4px';



}

function word_balloon_name_under_balloon_margin_wriggle(side) {

	var name_position = document.getElementById('w_b_name_under_balloon');

	name_position.style.marginTop = '-24px';
	name_position.style.marginBottom = '4px';



}
