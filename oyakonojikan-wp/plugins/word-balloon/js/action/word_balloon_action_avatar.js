



function word_balloon_get_avatar_position() {
	if( document.getElementById( "avatar_position_L" ).checked ) return 'L';
	return 'R';
}

function word_balloon_get_avatar_size() {
	return word_balloon_get_select_option_value('w_b_select_avatar_size');
}

function word_balloon_get_avatar_custom_size(size) {
	return document.getElementById('w_b_avatar_custom_size_' + size).value;
}


function word_balloon_get_avatar_default_name() {

	var e = document.getElementById('w_b_avatar_select');
	return e.options[e.selectedIndex].getAttribute('data-avatar_name');

}

function word_balloon_get_avatar_name() {

	return document.getElementById('w_b_avatar_name').value;

}

function word_balloon_get_avatar_name_size() {

	var name_size = document.getElementById( 'w_b_atts_name_font_size' ).value;

	if(name_size === '') name_size = document.getElementById( 'w_b_name_font_size' ).value;

	return parseInt( name_size );

}

function word_balloon_get_avatar_name_color() {

	return document.getElementById('w_b_edit_avatar_name_color').value;

}

function word_balloon_get_avatar_name_position() {

	return word_balloon_get_select_option_value('w_b_edit_avatar_name_position');

}


function word_balloon_get_balloon_default_name_position() {

	return document.getElementById('custom_balloon_' + word_balloon_get_balloon() + '_' + word_balloon_get_avatar_position() ).getAttribute('data-avatar_name_position_value');

}

function word_balloon_get_avatar_image_url() {

	var e = document.getElementById('w_b_avatar_select');
	return e.options[e.selectedIndex].getAttribute('data-avatar_img');

}

function word_balloon_get_avatar_id() {
	return word_balloon_get_select_option_value('w_b_avatar_select');
}

function word_balloon_get_avatar_border_radius() {
	return word_balloon_get_select_option_value('w_b_edit_avatar_border_radius');
}

function word_balloon_get_avatar_border_style() {
	if( !document.getElementById('w_b_edit_avatar_border_style') ) return '';
	return word_balloon_get_select_option_value('w_b_edit_avatar_border_style');
}

function word_balloon_get_avatar_border_width() {
	if( !document.getElementById('w_b_edit_avatar_border_width') ) return '';
	return document.getElementById('w_b_edit_avatar_border_width').value;
}

function word_balloon_get_avatar_border_color() {
	if( !document.getElementById('w_b_edit_avatar_border_color') ) return '';
	return document.getElementById('w_b_edit_avatar_border_color').value;
}

function word_balloon_get_avatar_effect(){
	if( !document.getElementById('w_b_edit_avatar_effect') ) return '';
	return word_balloon_get_select_option_value('w_b_edit_avatar_effect');
}

function word_balloon_get_avatar_filter(){
	if( !document.getElementById('w_b_edit_avatar_filter') ) return '';
	return word_balloon_get_select_option_value('w_b_edit_avatar_filter');
}

function word_balloon_get_avatar_in_view(){
	if( !document.getElementById('w_b_edit_avatar_in_view') ) return '';
	return word_balloon_get_select_option_value('w_b_edit_avatar_in_view');
}


function word_balloon_get_avatar_flip() {
	if( document.getElementById( 'w_b_avatar_flip_h' ).checked && document.getElementById( 'w_b_avatar_flip_v' ).checked ){
		return 'hv';
	}else if( document.getElementById( "w_b_avatar_flip_h" ).checked ){
		return 'h';
	}else if( document.getElementById( "w_b_avatar_flip_v" ).checked ){
		return 'v';
	}
	return '';
}






function word_balloon_set_avatar_name(position) {

	var arr = ['under_avatar', 'on_balloon', 'on_avatar', 'under_balloon', 'side_avatar'];

	for (var i = 0; i < arr.length; i++) {
		var reset_position = document.getElementById('w_b_name_' + arr[i]);
		reset_position.innerHTML = '';
		reset_position.style.display = 'none';
		reset_position.style.color = '';
	}

	if(position === 'hide') return;

	var set_position = document.getElementById('w_b_name_' + position);
	set_position.style.display = 'block';
	set_position.style.color = document.getElementById('w_b_edit_avatar_name_color').value;
	set_position.innerHTML = word_balloon_get_avatar_name();

	var temp = word_balloon_get_avatar_name_color();
	if(temp !== '')
		set_position.style.color = temp;
}

function word_balloon_set_avatar_name_positon(position) {

	var e = document.getElementById('w_b_edit_avatar_name_position');

	for( var i = 0; i < e.options.length; i++){
		if (e.options[i].value == position){
			e[i].selected = true;
			break;
		}
	}

}

function word_balloon_set_avatar_image (url) {

	document.getElementById('w_b_ava_img').src = url;

}






function word_balloon_change_avatar_size() {

	var size = word_balloon_get_avatar_size();
	var resize = word_balloon_get_avatar_custom_size(size);


	var balloon = word_balloon_get_balloon();


	var w_b_ava_img = document.getElementById('w_b_ava_img');
	w_b_ava_img.width = resize;
	w_b_ava_img.height = resize;

	var w_b_ava_effect = document.getElementById('w_b_ava_effect');
	
	w_b_ava_effect.classList.remove( 'w_b_size_S' );
	w_b_ava_effect.classList.remove( 'w_b_size_M' );
	w_b_ava_effect.classList.remove( 'w_b_size_L' );

	w_b_ava_effect.classList.add( 'w_b_size_' + size );


	word_balloon_change_balloon_space();


	word_balloon_reset_avatar();
	word_balloon_change_avatar_flip();
	//if( word_balloon_is_over_under_balloon( balloon ) )
	//	word_balloon_ud_margin_change();
	if(balloon === 'rpg_3')
		word_balloon_change_balloon();
}

function word_balloon_change_avatar_border() {

	var w_b_ava_effect = document.getElementById('w_b_ava_effect');
	
	w_b_ava_effect.classList.remove( 'w_b_border_L' );
	w_b_ava_effect.classList.remove( 'w_b_border_R' );
	w_b_ava_effect.style.borderStyle = 'none';

	
	if( document.getElementById( 'w_b_edit_avatar_border' ).checked ){

		w_b_ava_effect.style.borderStyle = '';
		w_b_ava_effect.classList.add( 'w_b_border_' + word_balloon_get_avatar_position() );

		
		if(document.getElementById('w_b_edit_avatar_border_style')) {
			word_balloon_change_avatar_border_style( word_balloon_get_select_option_value('w_b_edit_avatar_border_style') );
		}
	}

}



function word_balloon_change_avatar_shadow(){

	var w_b_ava_effect = document.getElementById('w_b_ava_effect');
	w_b_ava_effect.classList.remove( 'w_b_ava_shadow_L' );
	w_b_ava_effect.classList.remove( 'w_b_ava_shadow_R' );

	if( document.getElementById( "w_b_avatar_shadow" ).checked )
		w_b_ava_effect.classList.add( 'w_b_ava_shadow_' + word_balloon_get_avatar_position() );

}



function word_balloon_change_avatar_border_radius(){

	var radius = word_balloon_get_avatar_border_radius();

	var w_b_ava_effect = document.getElementById('w_b_ava_effect');

	var Classes = new Array();

	Classes = [ 'w_b_radius' , 'w_b_radius_3' , 'w_b_radius_12' , 'w_b_radius_20' ];
	Classes.forEach(function(target) {
		w_b_ava_effect.classList.remove(target);
	});

	//w_b_ava_effect.classList.remove( 'w_b_radius' , 'w_b_radius_3' , 'w_b_radius_12' , 'w_b_radius_20');


	switch(radius){
		case 'radius_3' : w_b_ava_effect.classList.add("w_b_radius_3"); break;
		case 'radius_12' : w_b_ava_effect.classList.add("w_b_radius_12"); break;
		case 'radius_20' : w_b_ava_effect.classList.add("w_b_radius_20"); break;
		case 'true' : w_b_ava_effect.classList.add("w_b_radius"); break;
		default : break;
	}

}


function word_balloon_change_avatar(){

	
	word_balloon_set_avatar_image( word_balloon_get_avatar_image_url() );

	
	document.getElementById('w_b_avatar_name').value = word_balloon_get_avatar_default_name();

	
	word_balloon_set_avatar_name( word_balloon_get_avatar_name_position() );

	

	var e = word_balloon_get_select_option_value('w_b_avatar_select');
	if( e === 'mystery_men' || e === 'unset'){
		document.getElementById('w_b_name_' + word_balloon_get_avatar_name_position() ).innerHTML = '';
		document.getElementById('w_b_avatar_name').value = '';
	}

}



function word_balloon_change_avatar_flip() {

	
	var w_b_ava_img = document.getElementById('w_b_ava_img');
	w_b_ava_img.classList.remove( 'w_b_flip_h' );
	w_b_ava_img.classList.remove( 'w_b_flip_v' );
	w_b_ava_img.classList.remove( 'w_b_flip_hv');

	var flip = word_balloon_get_avatar_flip();

	if( flip !== '')
		w_b_ava_img.classList.add( 'w_b_flip_' + flip );

}

function word_balloon_change_avatar_hide(){

	if( document.getElementById( 'w_b_edit_avatar_hide' ).checked ){

		document.getElementById('w_b_ava_box').style.visibility = 'hidden';

	}else{

		document.getElementById('w_b_ava_box').style.visibility = 'visible';

	}
}



function word_balloon_change_avatar_name_position(){

	
	word_balloon_reset_avatar_name_box();

	var	name = word_balloon_get_avatar_name(),
	name_position = word_balloon_get_avatar_name_position(),
	balloon = word_balloon_get_balloon(),
	side = word_balloon_get_avatar_position(),
	name_side = name_position,
	name_size = word_balloon_get_avatar_name_size();

	if( 'hide' !== name_position)
		var name_box = document.getElementById('w_b_name_' + name_position);



	switch(name_position){
		case 'under_avatar' :
		case 'on_avatar' :
		name_box.classList.add( 'w_b_name_C' );
		name_box.classList.add( 'w_b_ta_C');
		break;


		case 'on_balloon' :
		if(side === 'L'){
			name_box.classList.add( 'w_b_name_R' );
			name_box.classList.add( 'w_b_ta_R');
		}else{
			name_box.classList.add( 'w_b_name_L' );
			name_box.classList.add( 'w_b_ta_L');
		}

		if(typeof balloon !== "undefined" && typeof window['word_balloon_name_on_balloon_margin_' + balloon] === "function" )
			eval('word_balloon_name_on_balloon_margin_' + balloon + '(side)');

		break;

		case 'under_balloon' :
		if(side === 'L'){
			name_box.classList.add( 'w_b_name_R' );
			name_box.classList.add( 'w_b_ta_R');
		}else{
			name_box.classList.add( 'w_b_name_L' );
			name_box.classList.add( 'w_b_ta_L');
		}

		if(typeof balloon !== "undefined" && typeof window['word_balloon_name_under_balloon_margin_' + balloon] === "function" )
			eval('word_balloon_name_under_balloon_margin_' + balloon + '(side)');

		break;

		case 'side_avatar' :
		if(side === 'R'){
			name_box.classList.add( 'w_b_order-1');
		}

		case 'hide' :
		default :
		break;
	}

	if(name_position !== 'hide') name_box.style.fontSize = name_size + 'px';
	//var name_box_style = '';


	var w_b_ava_box = document.getElementById('w_b_ava_box');
	w_b_ava_box.classList.remove( 'w_b_flex' );

	var w_b_name_side_avatar = document.getElementById('w_b_name_side_avatar');
	w_b_name_side_avatar.classList.remove( 'w_b_order-1' );

	if(name_position === 'side_avatar'){
		w_b_name_side_avatar.style.marginTop = 'auto';
		w_b_ava_box.classList.add( 'w_b_flex' );
		if(side === 'R')
			w_b_name_side_avatar.classList.add( 'w_b_order-1' );
	}

/*
	if(typeof balloon !== "undefined" && typeof window['word_balloon_edit_balloon_name_position_' + balloon] === "function")
		data = eval('word_balloon_edit_balloon_name_position_' + balloon + '(name_position , side)');
	*/
//	jQuery('#w_b_overlay div.w_b_name').remove();

/*
switch(name_position){
	case 'under_avatar' : jQuery('#w_b_overlay div.w_b_ava_box').append('<div class="w_b_name w_b_name_C w_b_ta_C">' + name + '</div>'); break;
	case 'on_balloon' :
	if(balloon != 'line'){
		if(side === 'R'){
			name_side = 'L';
		}else{
			name_side = 'R';
		}
	}

	if(  word_balloon_is_svg_balloon( balloon ) ){
		if(typeof balloon !== "undefined"){

			if(typeof window['word_balloon_name_on_balloon_margin_' + balloon] === "function"){
				*/
				
				/*
				name_box_style = eval('word_balloon_name_on_balloon_margin_' + balloon + '(side)');
				name_box_style = ' style="' + name_box_style + '"';
			}
		}
	}

	jQuery('<div class="w_b_name w_b_name_' + name_side +' w_b_ta_' + name_side +'"'+name_box_style+'>' + name + '</div>').insertBefore('#w_b_overlay div.w_b_bal');
	if(balloon === 'line')word_balloon_name_side_margin_change();
	break;

	case 'on_avatar' : jQuery('#w_b_overlay div.w_b_ava_box').prepend('<div class="w_b_name w_b_name_C w_b_ta_C">' + name + '</div>'); break;

	case 'under_balloon' :
	if(side === 'R'){
		name_side = 'L';
	}else{
		name_side = 'R';
	}

	if(  word_balloon_is_svg_balloon( balloon ) ){
		if(typeof balloon !== "undefined"){

			if( typeof window['word_balloon_name_under_balloon_margin_' + balloon] === "function"){
				*/
				
				/*
				name_box_style = eval('word_balloon_name_under_balloon_margin_' + balloon + '(side)');
				name_box_style = ' style="' + name_box_style + '"';
			}
		}
	}


	jQuery('<div class="w_b_name w_b_name_' + name_side +' w_b_ta_' + name_side + '"' + name_box_style + '>' + name + '</div>').insertAfter('#w_b_overlay div.w_b_bal');
	if(balloon === 'line')word_balloon_name_side_margin_change();
	break;

	case 'hide' : break;

	default : break;
}
if(balloon === 'rpg_3') word_balloon_rpg_3_adjustment(name_position,'');
word_balloon_change_balloon_space();
word_balloon_change_avatar_name_color(jQuery("#w_b_overlay input.change_avatar_name_color").val());
*/

/*
word_balloon_up_low_name();
*/
//if(balloon === 'rpg_3') word_balloon_rpg_3_adjustment(name_position,'');
word_balloon_change_balloon_space();
word_balloon_set_avatar_name(name_position);

word_balloon_change_status_box();

}


function word_balloon_change_avatar_position(){

	var side = word_balloon_get_avatar_position();
	var balloon = word_balloon_get_balloon();

	
	var w_b_ava_box = document.getElementById('w_b_ava_box');

	var Classes = new Array();

	Classes = [ 'w_b_order_1' , 'w_b_order_3' , 'w_b_ava_L' , 'w_b_ava_R' ];
	Classes.forEach(function(target) {
		w_b_ava_box.classList.remove(target);
	});
	//w_b_ava_box.classList.remove( 'w_b_order_1' , 'w_b_order_3' , 'w_b_ava_L' , 'w_b_ava_R');

	var w_b_bal_box = document.getElementById('w_b_bal_box');

	var w_b_status_box = document.getElementById('w_b_status_box');

	if( side ==='L'){

		w_b_ava_box.classList.add( 'w_b_order_1' );
		w_b_ava_box.classList.add( 'w_b_ava_L' );
		w_b_status_box.classList.remove( 'w_b_order-1');

	}else{

		w_b_ava_box.classList.add( 'w_b_order_3' );
		w_b_ava_box.classList.add( 'w_b_ava_R' );
		w_b_status_box.classList.add( 'w_b_order-1');
	}


	word_balloon_reset_avatar();

	word_balloon_reset_balloon();

}



function word_balloon_change_avatar_border_width (width) {
	if ( !document.getElementById( 'w_b_edit_avatar_border' ).checked ) return;

	document.getElementById( 'w_b_ava_effect' ).style.borderWidth = width + 'px';
}

function word_balloon_change_avatar_border_style (style) {
	if ( !document.getElementById( 'w_b_edit_avatar_border' ).checked ) return;

	document.getElementById( 'w_b_ava_effect' ).style.borderStyle = style;
}


function word_balloon_change_avatar_name(e){

	document.getElementById('w_b_name_' + word_balloon_get_avatar_name_position() ).innerHTML = e.target.value;

}

function word_balloon_change_name_font_size(size){

	document.getElementById( 'w_b_atts_name_font_size' ).value = size;

	var name_position = word_balloon_get_avatar_name_position();

	if(	name_position !== 'hide'){

		var name_box = document.getElementById('w_b_name_' + word_balloon_get_avatar_name_position());

		if (size === ''){
			name_box.style.fontSize = '';
		}else{
			name_box.style.fontSize = size + 'px';
		}

	}

	word_balloon_change_balloon_space();
	word_balloon_change_status_box();
}





function word_balloon_reset_avatar_name_box() {

	var arr = ['under_avatar', 'on_balloon', 'on_avatar', 'under_balloon', 'side_avatar'];

	for (var i = 0; i < arr.length; i++) {
		var reset_position = document.getElementById('w_b_name_' + arr[i]);
		reset_position.className = '';
		reset_position.innerHTML = '';
		reset_position.style.marginTop = '';
		reset_position.style.marginRight = '';
		reset_position.style.marginBottom = '';
		reset_position.style.marginLeft = '';
		reset_position.classList.add( 'w_b_name');
		reset_position.classList.add( 'w_b_mp0');
		reset_position.classList.add( 'w_b_lh');
		reset_position.classList.add( 'w_b_name_' + arr[i]);
		reset_position.classList.add( 'w_b_div');
	}

}



function word_balloon_reset_avatar(){
	word_balloon_change_avatar_border();
	word_balloon_change_avatar_shadow();
	word_balloon_change_avatar_border_radius();
	if(typeof word_balloon_change_avatar_effect == 'function')
		word_balloon_change_avatar_effect();
	if(typeof word_balloon_change_avatar_filter == 'function')
		word_balloon_change_avatar_filter();
}




