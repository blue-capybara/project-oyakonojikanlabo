


function word_balloon_balloon_change_rpg_3(data) {

	document.getElementById('w_b_wrap').classList.add( 'w_b_ai_c' );

	var w_b_ava_box = document.getElementById('w_b_ava_box');
	var w_b_bal_box = document.getElementById('w_b_bal_box');
	var w_b_bal = document.getElementById('w_b_bal');

	var Classes = new Array();

	
	w_b_bal.style.minHeight = '';
	w_b_bal.style.marginLeft = '';
	w_b_bal.style.paddingLeft = '';
	w_b_bal.style.marginRight = '';
	w_b_bal.style.paddingRight = '';

	Classes = [ 'w_b_z1' , 'w_b_z2' ];
	Classes.forEach(function(target) {
		w_b_bal_box.classList.remove( target );
		w_b_ava_box.classList.remove( target );
	});
	//w_b_bal_box.classList.remove( 'w_b_z1' , 'w_b_z2' );
	//w_b_ava_box.classList.remove( 'w_b_z1' , 'w_b_z2' );

	w_b_bal_box.classList.add( 'w_b_z1' );
	w_b_ava_box.classList.add( 'w_b_z2' );

	//word_balloon_rpg_3_adjustment(data["name_position"] , data["resize"]);

	if(data["side"] === 'L'){
		w_b_bal.style.marginLeft = '-' + (parseInt(data["resize"]) + 10) + 'px';
		w_b_bal.style.paddingLeft = (parseInt(data["resize"]) + 20) + 'px';

	}else{
		w_b_bal.style.marginRight = '-' + (parseInt(data["resize"]) + 10) + 'px';
		w_b_bal.style.paddingRight = (parseInt(data["resize"]) + 20) + 'px';

	}

	w_b_bal.style.minWidth = (parseInt(data["resize"]) + 100) + 'px';

	word_balloon_balloon_shadow_color_change(data["balloon_shadow_color"],data["side"],data["balloon"]);

	document.getElementById('w_b_edit_balloon_background_alpha_wrap').style.display = 'block';
	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';
	document.getElementById('w_b_edit_balloon_border_color_wrap').style.display = 'block';
	document.getElementById('w_b_edit_balloon_shadow_color_wrap').style.display = 'block';

	document.getElementById('w_b_edit_border_wrap').style.display = 'block';
	document.getElementById('w_b_edit_border_label').style.display = 'inline-block';

	return data;

}


function word_balloon_rpg_3_adjustment(name_position , resize){



}

function word_balloon_change_balloon_space_rpg_3(box) {

	var w_b_ava_box = document.getElementById('w_b_ava_box'),
	w_b_bal = document.getElementById('w_b_bal'),
	size = word_balloon_get_avatar_size(),
	resize = word_balloon_get_avatar_custom_size(size),
	name_position = word_balloon_get_avatar_name_position();
	ava_style = box["name_margin"]*2;

	w_b_ava_box.style.marginTop = '';
	w_b_ava_box.style.marginBottom = '';

	if(name_position === 'on_balloon'){
		w_b_ava_box.style.marginTop = box["name_margin"] + 'px';
	}else if(name_position === 'under_balloon'){
		w_b_ava_box.style.marginBottom = box["name_margin"] + 'px';
	}

	w_b_bal.style.minHeight = (parseInt(resize) + parseInt(ava_style) + 30) + 'px';

	return box;

}


