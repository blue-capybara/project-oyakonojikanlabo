
function word_balloon_is_over_balloon( balloon ){

	if( ['upper','talk_o','think','think_2','talk_oc','freehand_o','slash_oc'].indexOf(balloon) !== -1 ) return true;

	return false;

}

function word_balloon_is_under_balloon( balloon ){

	if( ['lower','talk_u','talk_uc','freehand_u','slash_uc'].indexOf(balloon) !== -1 ) return true;

	return false;

}

function word_balloon_is_svg_balloon( balloon ){

	if( ['heart','wriggle','freehand','scream','think_2','freehand_o','freehand_u','slash','slash_oc','slash_uc','think_3'].indexOf(balloon) !== -1 ) return true;

	return false;

}

function word_balloon_is_center_balloon( balloon ){

	if( ['talk_oc','talk_uc','slash_oc','slash_uc'].indexOf(balloon) !== -1 ) return true;

	return false;

}

function word_balloon_is_alpha_balloon( balloon ){

	if( ['round','rpg_1','rpg_3','tail_2','geek'].indexOf(balloon) !== -1 ) return true;

	return false;

}

function word_balloon_is_over_under_balloon( balloon ){

	if( word_balloon_is_over_balloon( balloon ) || word_balloon_is_under_balloon( balloon ) ) return true;

	return false;

}





function word_balloon_get_balloon() {
	return word_balloon_get_select_option_value('w_b_choice_balloon');
}

function word_balloon_get_balloon_direction() {
	var balloon = word_balloon_get_balloon();
	if(word_balloon_is_over_balloon(balloon)) return 'O';
	if(word_balloon_is_under_balloon(balloon)) return 'U';
	if(word_balloon_get_avatar_position() === 'L') return 'L';
	return 'R';
}


function word_balloon_get_avatar_name_position_of_balloon(balloon,position) {

	return document.getElementById('custom_balloon_' + balloon + '_' + position).getAttribute('data-avatar_name_position_value');

}

function word_balloon_get_balloon_font_size(){

	return word_balloon_get_select_option_value('w_b_font_size');

}

function word_balloon_get_balloon_text_align(){

	return word_balloon_get_select_option_value('w_b_text_align');

}

function word_balloon_get_balloon_effect(){
	if( !document.getElementById('w_b_edit_balloon_effect') ) return '';
	return word_balloon_get_select_option_value('w_b_edit_balloon_effect');
}

function word_balloon_get_balloon_filter(){
	if( !document.getElementById('w_b_edit_balloon_filter') ) return '';
	return word_balloon_get_select_option_value('w_b_edit_balloon_filter');
}

function word_balloon_get_balloon_in_view(){
	if( !document.getElementById('w_b_edit_balloon_in_view') ) return '';
	return word_balloon_get_select_option_value('w_b_edit_balloon_in_view');
}


function word_balloon_set_quote_focus(){
	document.getElementById('w_b_post_text').focus();
}

function word_balloon_set_balloon_font_size(font_size){

	var e = document.getElementById('w_b_font_size');

	for( var i = 0; i < e.options.length; i++){
		if (e.options[i].value === font_size){
			e[i].selected = true;
			break;
		}
	}

}



function word_balloon_change_balloon_space() {

	var box = [],
	balloon = word_balloon_get_balloon(),
	name_size = word_balloon_get_avatar_name_size();

	
	box["padding_top"] = box["padding_bottom"] = box["avatar_padding_top"] = box["avatar_padding_bottom"] = "";
	box["name_margin"] = Math.floor( name_size * 1.4 );
	box["size"] = word_balloon_get_avatar_size();





	

	

	if(typeof balloon !== "undefined"){
		if( typeof window['word_balloon_change_balloon_space_' + balloon] === "function" ){
			
			box = eval('word_balloon_change_balloon_space_' + balloon + '(box)');
		}
	}

	var w_b_space_on_balloon = document.getElementById('w_b_space_on_balloon'),
	w_b_space_under_balloon =  document.getElementById('w_b_space_under_balloon'),
	w_b_ava_box =  document.getElementById('w_b_ava_box');

	w_b_space_on_balloon.style = '';
	w_b_space_under_balloon.style = '';
	w_b_ava_box.style.paddingTop = '';
	w_b_ava_box.style.paddingBottom = '';

	if(box["padding_top"] !== '') w_b_space_on_balloon.style.paddingTop = ( parseInt(box["padding_top"]) ) + 'px';

	if(box["padding_bottom"] !== '') w_b_space_under_balloon.style.paddingTop = ( parseInt(box["padding_bottom"]) ) + 'px';

	if(box["avatar_padding_top"] !== '') w_b_ava_box.style.paddingTop = ( parseInt(box["avatar_padding_top"]) ) + 'px';

	if(box["avatar_padding_bottom"] !== '') w_b_ava_box.style.paddingBottom = ( parseInt(box["avatar_padding_bottom"]) ) + 'px';

	

	

}


function word_balloon_change_balloon_shadow(){

	var w_b_bal = document.getElementById('w_b_bal');

	w_b_bal.classList.remove( 'w_b_shadow_L' , 'w_b_shadow_R' );

	if( document.getElementById( 'w_b_edit_balloon_shadow' ).checked )
		w_b_bal.classList.add( 'w_b_shadow_' + word_balloon_get_avatar_position() );

}

function word_balloon_change_balloon_vertical_writing(){

	if( document.getElementById( 'w_b_writing_mode' ).value !== "true" ) return;

	var w_b_quote = document.getElementById( 'w_b_quote' );
	var w_b_post_text = document.getElementById( 'w_b_post_text' );
	var w_b_post_text_ph = document.getElementById( 'w_b_post_text_ph' );
	var w_b_post_pre_text = document.getElementById( 'w_b_post_pre_text' );

	if ( document.getElementById( 'w_b_edit_balloon_vertical_writing' ).checked ) {

		w_b_post_text.classList.add( 'w_b_vertical_writing' );
		w_b_post_text_ph.classList.add( 'w_b_vertical_writing' );
		w_b_post_pre_text.classList.add( 'w_b_vertical_writing' );

		w_b_post_text.style.height = 'auto';
		w_b_post_text.style.width = w_b_post_pre_text.outerWidth + 'px';
		w_b_quote.style.width = w_b_post_pre_text.outerWidth + 'px';

		w_b_post_pre_text.style.maxHeight = w_b_post_text.scrollHeight + 'px';

		//jQuery('#w_b_overlay textarea.w_b_post_text').css('height', "auto");
		//jQuery('#w_b_overlay textarea.w_b_post_text').css('width', jQuery('#w_b_overlay div.w_b_post_pre_text').outerWidth()+"px");
		//jQuery('#w_b_overlay textarea.w_b_post_text_wrap').css('width',jQuery('#w_b_overlay div.w_b_post_pre_text').outerWidth()+"px");

		
		//jQuery('#w_b_overlay div.w_b_post_pre_text').css('max-height',e.target.scrollHeight + "px");




	}else{
		w_b_post_text.classList.remove( 'w_b_vertical_writing' );
		w_b_post_text_ph.classList.remove( 'w_b_vertical_writing' );
		w_b_post_pre_text.classList.remove( 'w_b_vertical_writing' );

		w_b_post_text.style.width = '100%';
		w_b_quote.style.width = 'auto';
		w_b_post_pre_text.style.maxHeight = 'none';

	}

}

function word_balloon_change_balloon() {

	

	var balloon = word_balloon_get_balloon(),
	side = word_balloon_get_avatar_position(),

	name_position = word_balloon_get_balloon_default_name_position(),
	size = word_balloon_get_avatar_size(),
	resize = word_balloon_get_avatar_custom_size(size),

	data = new Array(),

	Classes = new Array(),

	w_b_ava_box = document.getElementById('w_b_ava_box'),

	w_b_bal_box = document.getElementById('w_b_bal_box'),

	w_b_bal = document.getElementById('w_b_bal'),

	w_b_wrap = document.getElementById('w_b_wrap'),

	w_b_box = document.getElementById('w_b_box'),

	w_b_bal_outer = document.getElementById('w_b_bal_outer');

	



	document.getElementById('w_b_edit_balloon_text_color').value = '';
	document.getElementById('w_b_edit_balloon_background').value = '';
	document.getElementById('w_b_edit_balloon_background_alpha').value = '';
	document.getElementById('w_b_edit_balloon_border_color').value = '';
	document.getElementById('w_b_edit_balloon_shadow_color').value = '';
	document.getElementById('w_b_edit_balloon_border_width').value = '';
	//document.getElementById('w_b_edit_balloon_border_style').value = '';
	word_balloon_change_select_option( 'w_b_edit_balloon_border_style' , '');

	w_b_bal_box.className = '';

	Classes = [ 'w_b_bal_box' , 'w_b_order_2' , 'w_b_relative' , 'w_b_z2' ,'w_b_bal_' + side ];
	Classes.forEach(function(target) {
		w_b_bal_box.classList.add(target);
	});
	//w_b_bal_box.classList.add( 'w_b_bal_box' , 'w_b_order_2' , 'w_b_relative' , 'w_b_z2' ,'w_b_bal_' + side );

	w_b_bal.removeAttribute('style');
	w_b_bal.className = '';
	w_b_bal.classList.add( 'w_b_bal' );
	w_b_bal.classList.add( 'w_b_relative' );

	Classes = ['w_b_mta' , 'w_b_flex' , 'w_b_col' , 'w_b_jc_fe' , 'w_b_ai_fe' , 'w_b_z1' , 'w_b_z2' , 'w_b_order_1' , 'w_b_order_3'];
	Classes.forEach(function(target) {
		w_b_ava_box.classList.remove(target);
	});
	//w_b_ava_box.classList.remove( 'w_b_mta' , 'w_b_flex' , 'w_b_col' , 'w_b_jc_fe' , 'w_b_ai_fe' , 'w_b_z1' , 'w_b_z2' , 'w_b_order_1' , 'w_b_order_3' );

	w_b_bal_box.classList.add( 'w_b_z1' );
	w_b_ava_box.style.marginTop = '';
	w_b_ava_box.style.marginRight = '';
	w_b_ava_box.style.marginBottom = '';
	w_b_ava_box.style.marginLeft = '';



	w_b_wrap.className = '';
	Classes = [ 'w_b_wrap' , 'w_b_wrap_' + balloon , 'w_b_flex' , 'w_b_div' ];
	Classes.forEach(function(target) {
		w_b_wrap.classList.add(target);
	});

/*
	Classes = [ 'w_b_jc_fe' , 'w_b_col' , 'w_b_ai_fs' , 'w_b_ai_fe' , 'w_b_ai_c' ];
	Classes.forEach(function(target) {
		w_b_wrap.classList.remove(target);
	});
	*/

	//w_b_wrap.classList.remove( 'w_b_jc_fe' , 'w_b_col' , 'w_b_ai_fs' , 'w_b_ai_fe' , 'w_b_ai_c');

	Classes = [ 'w_b_jc_fe' ];
	Classes.forEach(function(target) {
		w_b_box.classList.remove(target);
	});
	//w_b_box.classList.remove( 'w_b_jc_fe' , 'w_b_rpg_3_ml14' , 'w_b_rpg_3_mr14');

	Classes = [ 'w_b_jc_c' , 'w_b_ai_c' ];
	Classes.forEach(function(target) {
		w_b_bal_outer.classList.remove(target);
	});

	var w_b_edit_balloon_background = document.getElementById('w_b_edit_balloon_background');



	document.getElementById('w_b_edit_balloon_background_wrap').style.display = 'none';
	document.getElementById('w_b_edit_balloon_background_alpha_wrap').style.display = 'none';
	document.getElementById('w_b_edit_balloon_text_color_wrap').style.display = 'none';
	document.getElementById('w_b_edit_balloon_border_color_wrap').style.display = 'none';
	document.getElementById('w_b_edit_balloon_shadow_color_wrap').style.display = 'none';
	document.getElementById('w_b_edit_balloon_border_style_wrap').style.display = 'none';
	document.getElementById('w_b_edit_balloon_border_width_wrap').style.display = 'none';
	document.getElementById('w_b_edit_border_wrap').style.display = 'none';
	document.getElementById('w_b_edit_border_label').style.display = 'none';

	

	if(!word_balloon_is_over_under_balloon(balloon)){
		if( side === 'L'){
			w_b_ava_box.classList.add('w_b_order_1')
		}else{
			w_b_ava_box.classList.add('w_b_order_3')
		}
	}


	
	word_balloon_delete_select_option('w_b_edit_avatar_name_position', 'side_avatar');
	if(  word_balloon_is_over_under_balloon( balloon ) && !word_balloon_is_center_balloon( balloon ) )
		word_balloon_add_select_option( 'w_b_edit_avatar_name_position' , translations_word_balloon.side_avatar , 'side_avatar' );

	word_balloon_delete_select_option('w_b_edit_avatar_name_position', 'on_balloon');
	if( !word_balloon_is_under_balloon( balloon ) )
		word_balloon_add_select_option( 'w_b_edit_avatar_name_position' , translations_word_balloon.on_balloon , 'on_balloon' );

	word_balloon_delete_select_option('w_b_edit_avatar_name_position', 'under_balloon');
	if( !word_balloon_is_over_balloon( balloon ) )
		word_balloon_add_select_option( 'w_b_edit_avatar_name_position' , translations_word_balloon.under_balloon , 'under_balloon' );



	word_balloon_set_avatar_name_positon( word_balloon_get_balloon_default_name_position() );

	
	if( side === 'R')
		w_b_box.classList.add( 'w_b_jc_fe' );


	Classes = [ 'w_b_' + balloon , 'w_b_' + balloon + '_' + side ];
	Classes.forEach(function(target) {
		w_b_bal.classList.add(target);
	});
	//w_b_bal.classList.add( 'w_b_' + balloon , 'w_b_' + balloon + '_' + side );



	data["balloon"] = balloon;
	data["size"] = size;
	data["resize"] = resize;
	data["side"] = side;
	data["name_position"] = name_position;

	var custom_balloon = document.getElementById('custom_balloon_' + balloon + '_' + side );

	data["color"] = custom_balloon.getAttribute('data-color_value');
	data["background"] = custom_balloon.getAttribute('data-background_value');
	data["border_color"] = custom_balloon.getAttribute('data-border_color_value');
	data["balloon_shadow_color"] = custom_balloon.getAttribute('data-balloon_shadow_color_value');
	data["border_width"] = custom_balloon.getAttribute('data-border_width_value');
	data["border_style"] = custom_balloon.getAttribute('data-border_style_value');

	if( document.querySelector('#w_b_edit_balloon_text_color_wrap button.wp-color-result') )
		document.querySelector('#w_b_edit_balloon_text_color_wrap button.wp-color-result').style.background = data["color"];


	if( document.querySelector('#w_b_edit_balloon_background_wrap button.wp-color-result') ){

		if( word_balloon_is_alpha_balloon(balloon) ){
			document.querySelector('#w_b_edit_balloon_background_alpha_wrap button.wp-color-result').style.background = data["background"];
		}else{
			document.querySelector('#w_b_edit_balloon_background_wrap button.wp-color-result').style.background = data["background"];
		}
	}


	if( document.querySelector('#w_b_edit_balloon_border_color_wrap button.wp-color-result') )
		document.querySelector('#w_b_edit_balloon_border_color_wrap button.wp-color-result').style.background = data["border_color"];

	if(data["color"] !== '')
		document.getElementById('w_b_edit_balloon_text_color' ).value = data["color"];

	if(data["background"] !== ''){
		if( word_balloon_is_alpha_balloon(balloon) ){
			document.getElementById('w_b_edit_balloon_background_alpha' ).value = data["background"];
		}else{
			document.getElementById('w_b_edit_balloon_background' ).value = data["background"];
		}
	}

	if(data["border_color"] !== '')
		document.getElementById('w_b_edit_balloon_border_color' ).value = data["border_color"];

	if(data["border_width"] !== ''){
		document.getElementById('w_b_edit_balloon_border_width' ).value = data["border_width"];
	}else{
		data["border_width"] = 0;
	}


	if(word_balloon_is_svg_balloon(balloon)){
		data["border_style"] = 'solid';
	}else{
		if(data["border_style"] !== ''){
			word_balloon_change_select_option( 'w_b_edit_balloon_border_style' , data["border_style"]);
		}else{
			data["border_style"] = 'none';
		}
	}

	
	if(typeof balloon !== "undefined" && typeof window['word_balloon_balloon_change_' + balloon] === "function")
		data = eval('word_balloon_balloon_change_' + balloon + '(data)');

	word_balloon_change_balloon_background_color(data["background"],side,balloon);
	word_balloon_change_balloon_border_color(data["border_color"],side,balloon);
	word_balloon_change_balloon_border_width(data["border_width"]);
	word_balloon_change_balloon_border_style(data["border_style"]);
	word_balloon_change_text_color(data["color"],side,balloon);

	if(typeof window[word_balloon_change_balloon_effect] == 'function')
		word_balloon_change_balloon_effect();

	if(typeof window[word_balloon_change_balloon_filter] == 'function')
		word_balloon_change_balloon_filter();

	
	
	word_balloon_change_balloon_hide();
	word_balloon_change_balloon_shadow();
	word_balloon_change_balloon_box_center();
	word_balloon_change_balloon_full_width();
	word_balloon_change_status_box();


}













function word_balloon_change_balloon_border_style(style) {

	var balloon = word_balloon_get_balloon();
	var side = word_balloon_get_avatar_position();

	var custom_balloon = document.getElementById('custom_balloon_' + balloon + '_' + side );
	if(style === ''){
		style = custom_balloon.getAttribute('data-border_style_value');
		if(style === '')style = 'none';
	}

	document.getElementById( 'w_b_bal' ).style.borderStyle = style;

}



function word_balloon_change_balloon_border_width(width) {

	document.getElementById('w_b_bal').style.borderWidth = width + 'px';

}


function word_balloon_reset_balloon() {

	word_balloon_change_balloon();
	word_balloon_change_balloon_space();
	word_balloon_set_avatar_name_positon( word_balloon_get_balloon_default_name_position() );
	word_balloon_change_avatar_name_position();
	word_balloon_change_balloon_hide();
	word_balloon_change_balloon_box_center();
	word_balloon_change_balloon_vertical_writing();
	word_balloon_change_balloon_shadow();
	word_balloon_change_status_box();


}


function word_balloon_change_balloon_text_align(text_align) {

	var w_b_post_text = document.getElementById( 'w_b_post_text' );

	if(text_align === 'L'){
		w_b_post_text.style.textAlign = 'left';
	}else if(text_align === 'C'){
		w_b_post_text.style.textAlign = 'center';
	}else if(text_align === 'R'){
		w_b_post_text.style.textAlign = 'right';
	}

}


function word_balloon_change_balloon_box_center() {

	var w_b_box = document.getElementById('w_b_box');

	w_b_box.classList.remove( 'w_b_jc_fe' );
	w_b_box.classList.remove( 'w_b_jc_c' );

	if( document.getElementById( 'w_b_edit_box_center' ).checked ){
		w_b_box.classList.add( 'w_b_jc_c' );
	}else{
		if( word_balloon_get_avatar_position() ==='R'){
			w_b_box.classList.add('w_b_jc_fe');
		}
	}

}


function word_balloon_change_balloon_full_width() {

	var w_b_bal = document.getElementById('w_b_bal');

	var w_b_wrap = document.getElementById('w_b_wrap');

	var w_b_bal_wrap = document.getElementById('w_b_bal_wrap');


	if( document.getElementById( 'w_b_balloon_full_width' ).checked ){

		w_b_wrap.style.width = '100%';
		w_b_wrap.style.maxWidth = '100%';

		w_b_bal_wrap.style.maxWidth = '100%';
		if( !document.getElementById( 'w_b_edit_balloon_hide' ).checked ){
			w_b_bal_wrap.style.width = '100%';
		}
		

		


		

		if(word_balloon_get_balloon() === 'rpg_3'){
			
			w_b_bal.style.width = '540px';
			w_b_bal.style.maxWidth = '540px';
		}else{
			w_b_bal.style.width = '100%';
			
		}

	}else{

		w_b_wrap.style.width = 'auto';
		w_b_wrap.style.maxWidth = 'none';
		w_b_bal_wrap.style.width = 'auto';
		w_b_bal_wrap.style.maxWidth = 'none';

		
		
		
		w_b_bal.style.width = 'auto';
		w_b_bal.style.maxWidth = 'none';
		
		

		
		

	}

}


function word_balloon_change_balloon_hide() {

	var w_b_bal_wrap = document.getElementById('w_b_bal_wrap');

	if( document.getElementById( 'w_b_edit_balloon_hide' ).checked ){
		w_b_bal_wrap.style.width = '0%';
		
		
		
		w_b_bal_wrap.style.display = 'none';
	}else{
		if( document.getElementById( 'w_b_balloon_full_width' ).checked ){
			w_b_bal_wrap.style.width = '100%';
		}else{
			w_b_bal_wrap.style.width = 'auto';
		}

		
		
		
		w_b_bal_wrap.style.display = '';
	}
}









function word_balloon_change_balloon_font_size(){

	var font_size = word_balloon_get_balloon_font_size();
	var w_b_post_text = document.getElementById( 'w_b_post_text' );
	var w_b_post_text_ph = document.getElementById( 'w_b_post_text_ph' );
	var w_b_post_pre_text = document.getElementById( 'w_b_post_pre_text' );

	if(font_size !== ""){
		w_b_post_text.style.fontSize = font_size + 'px';
		w_b_post_text_ph.style.fontSize = font_size + 'px';
		w_b_post_pre_text.style.fontSize = font_size + 'px';
	}else{
		w_b_post_text.style.fontSize = '16px';
		w_b_post_text_ph.style.fontSize = '16px';
		w_b_post_pre_text.style.fontSize = '16px';
	}

	

}











function word_balloon_make_balloon_svg(balloon,side) {

	var x = new XMLHttpRequest();
	x.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			
			document.getElementById('w_b_bal').style.borderImageSource = 'url("data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent( x.responseText ))) + '")';
		}
	};
	x.open("GET", document.getElementById('w_b_wordballoon_url').getAttribute('data-w_b_url') + 'css/skin/'+balloon+'_'+ side +'.svg' , true);
	x.send();

}


function word_balloon_reset_over_under_balloon(over_under) {

	var w_b_wrap = document.getElementById('w_b_wrap');
	var w_b_ava_box = document.getElementById('w_b_ava_box');
	var w_b_bal = document.getElementById('w_b_bal');

	w_b_wrap.classList.remove( 'w_b_ai_fs' );
	w_b_wrap.classList.remove( 'w_b_ai_fe' );
	w_b_wrap.classList.add( 'w_b_col' );

	if( over_under === 'over'){
		w_b_ava_box.classList.remove( 'w_b_order_1' );
		w_b_ava_box.classList.add( 'w_b_order_3' );
	}else{
		w_b_ava_box.classList.remove( 'w_b_order_3' );
		w_b_ava_box.classList.add( 'w_b_order_1' );
	}

	if(word_balloon_get_avatar_position() === 'L'){
		w_b_wrap.classList.add( 'w_b_ai_fs' );
	}else{
		w_b_wrap.classList.add( 'w_b_ai_fe' );
		if(document.getElementById( 'w_b_edit_box_center' ).checked)
			w_b_wrap.classList.remove("w_b_mla");
	}

}


