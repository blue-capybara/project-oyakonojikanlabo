


function word_balloon_change_status_comment(){

	var val = document.getElementById('w_b_status_comment').value,
	w_b_status_box = document.getElementById('w_b_status_box');

	document.getElementById('w_b_status').innerHTML = val;

	if(val === ''){
		w_b_status_box.style.display = 'none';
	}else{
		w_b_status_box.style.display = '';
	}
}

function word_balloon_change_status_box(){


	var w_b_sound = document.getElementById('w_b_sound');

	if( document.getElementById('w_b_enable_sound').getAttribute('data-enable_sound') !== 'true'){
		w_b_sound.style.display = 'none';
	}

	//jQuery('#w_b_overlay div.w_b_status_box').remove();

	var side = word_balloon_get_avatar_position(),
	balloon = word_balloon_get_balloon(),
	name_position = word_balloon_get_avatar_name_position(),
	name_size = word_balloon_get_avatar_name_size(),
	flip = '',
	w_b_status_box = document.getElementById('w_b_status_box'),
	name_lh = Math.floor( name_size * 1.4 );

	
	w_b_status_box.style = '';
	w_b_status_box.classList.remove( 'w_b_order-1' );

	if(side === 'R') {
		flip = 'w_b_flip_h';
		w_b_status_box.classList.add( 'w_b_order-1' );
	}

	if( document.getElementById('w_b_status_comment').value === ''){
		w_b_status_box.style.display = 'none';
	}else{

		w_b_status_box.style.display = '';

		if( ['talk_uc' , 'talk_oc' , 'slash_uc' , 'slash_oc'].indexOf(balloon) !== -1 ){
			w_b_status_box.style.position = 'absolute';
			w_b_status_box.style.height = '100%';
			w_b_status_box.style.width = '100%';

			if(side === 'L'){
				w_b_status_box.style.left = '4px';
				w_b_status_box.style.marginLeft = '100%';
				w_b_status_box.style.textAlign = '';

			}else{
				w_b_status_box.style.right = '4px';
				w_b_status_box.style.marginRight = '100%';
				w_b_status_box.style.textAlign = 'right';
			}
		}else{
			w_b_status_box.style.position = '';
			w_b_status_box.style.height = '';
			w_b_status_box.style.width = '';
			w_b_status_box.style.right = '';
			w_b_status_box.style.left = '';
			w_b_status_box.style.marginLeft = '';
			w_b_status_box.style.marginRight = '';
			w_b_status_box.style.textAlign = '';
		}


	}

	if( name_position === 'under_balloon' ){
		w_b_status_box.style.bottom = name_lh + 'px';
	}


	//if(word_balloon_is_svg_balloon(balloon)){

		//if ( !document.getElementById( 'w_b_edit_avatar_hide' ).checked && typeof balloon !== "undefined" ){

			//if(typeof window['word_balloon_status_box_margin_' + balloon] === "function"){
				
				//eval('word_balloon_status_box_margin_' + balloon + '(side , name_position)');
			//}

			//if(typeof window['word_balloon_sound_box_margin_' + balloon] === "function"){
				
				//eval('word_balloon_sound_box_margin_' + balloon + '(side)');
			//}

		//}


	//}else{

		//if( name_position === 'on_balloon' ){
			//w_b_status_box.style.marginTop = '12px';
		//}

	//}

	word_balloon_status_color_change( document.getElementById('w_b_edit_status_color').value );



	if( document.getElementById('w_b_status_sound_filename') ) {

		if( document.getElementById('w_b_status_sound_filename').value === '' ){
			w_b_sound.style.display = 'none';
		}else{
			w_b_status_box.style.display = '';

			w_b_sound.style.display = 'block';

			var w_b_sound_icon_wrap = document.getElementById('w_b_sound_icon_wrap'),
			w_b_status_sound_id = document.getElementById('w_b_status_sound_id'),
			w_b_status_sound_url = document.getElementById('w_b_status_sound_url'),
			w_b_status_sound_icon = document.getElementById('w_b_status_sound_icon'),
			w_b_sound_icon = document.getElementById('w_b_sound_icon'),
			w_b_sound = document.getElementById('w_b_sound');

			if(w_b_sound.style.display !== 'none')
				w_b_sound_icon_wrap.style.display = 'block';

			w_b_sound_icon_wrap.setAttribute('data-audio_id', w_b_status_sound_id.value);
			w_b_sound_icon_wrap.setAttribute('data-audio_url', w_b_status_sound_url.value);
			

			w_b_sound_icon.classList.remove( 'w_b_flip_h' );
			if(flip !== '' && w_b_sound_icon_wrap.getAttribute('data-current') === 'stop')
				w_b_sound_icon.classList.add( flip );

			if(side === 'L'){
				w_b_sound.classList.remove( 'w_b_ta_R' );
			}else{
				w_b_sound.classList.add( 'w_b_ta_R' );
			}


			w_b_status_sound = document.getElementById('w_b_status_sound');

			w_b_status_sound.style.marginTop = '';

			if( name_position === 'on_balloon' || name_position === 'under_balloon' ){
				w_b_status_sound.style.marginTop = name_lh + 'px';
			}


		}

	}


	if ( !document.getElementById( 'w_b_edit_avatar_hide' ).checked && typeof balloon !== "undefined" ){

		if(typeof window['word_balloon_status_box_margin_' + balloon] === "function"){
			
			eval('word_balloon_status_box_margin_' + balloon + '(side , name_position)');
		}

	}




}





