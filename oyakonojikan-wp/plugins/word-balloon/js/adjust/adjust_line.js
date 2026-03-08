


function word_balloon_balloon_change_line(data) {

	document.getElementById('w_b_edit_balloon_background_wrap').style.display = 'block';
	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'block';

	return data;

}

function word_balloon_change_balloon_space_line(box) {

	var name_position = word_balloon_get_avatar_name_position(),
	side = word_balloon_get_avatar_position();
	//Classes = new Array();

	if(name_position !== "on_balloon"){
		box["padding_top"] = box["name_margin"] + 4;
	}else{
		box["padding_top"] = 4;
	}
	if(name_position === "on_avatar"){
		box["padding_top"] = box["name_margin"] * 2 + 8;
	}


/*
	if(name_position === "on_balloon" || name_position ===  'under_balloon'){
		var w_b_name_on_balloon = document.getElementById('w_b_name_' + name_position);

		Classes = [ 'w_b_name_R' , 'w_b_ta_R' , 'w_b_name_L' , 'w_b_ta_L' ];
		Classes.forEach(function(target) {
			w_b_name_on_balloon.classList.remove(target);
		});
		//w_b_name_on_balloon.classList.remove( 'w_b_name_R' , 'w_b_ta_R' , 'w_b_name_L' , 'w_b_ta_L' );

		if(side === 'L'){
			w_b_name_on_balloon.classList.add( 'w_b_name_L' );
			w_b_name_on_balloon.classList.add( 'w_b_ta_L');
			//w_b_name_on_balloon.classList.add( 'w_b_name_L' , 'w_b_ta_L' );
			w_b_name_on_balloon.style.marginLeft = '14px';
		}else{
			w_b_name_on_balloon.classList.add( 'w_b_name_R' );
			w_b_name_on_balloon.classList.add( 'w_b_ta_R');
			//w_b_name_on_balloon.classList.add( 'w_b_name_R' , 'w_b_ta_R' );
			w_b_name_on_balloon.style.marginRight = '14px';
		}

	}
	*/
/*
	else if(name_position ===  'under_balloon'){
		var w_b_name_under_balloon = document.getElementById('w_b_name_under_balloon');

		Classes = [ 'w_b_name_R' , 'w_b_ta_R' , 'w_b_name_L' , 'w_b_ta_L' ];
		Classes.forEach(function(target) {
			w_b_name_under_balloon.classList.remove(target);
		});
		//w_b_name_under_balloon.classList.remove( 'w_b_name_R' , 'w_b_ta_R' , 'w_b_name_L' , 'w_b_ta_L' );

		if(side === 'L'){
			w_b_name_under_balloon.classList.add( 'w_b_name_L' );
			w_b_name_under_balloon.classList.add( 'w_b_ta_L' );
			//w_b_name_under_balloon.classList.add( 'w_b_name_L' , 'w_b_ta_L' );
			w_b_name_under_balloon.style.marginLeft = '14px';
		}else{
			w_b_name_under_balloon.classList.add( 'w_b_name_R' );
			w_b_name_under_balloon.classList.add( 'w_b_ta_R' );
			//w_b_name_under_balloon.classList.add( 'w_b_name_R' , 'w_b_ta_R' );
			w_b_name_under_balloon.style.marginRight = '14px';
		}
	}
	*/

	return box;

}
