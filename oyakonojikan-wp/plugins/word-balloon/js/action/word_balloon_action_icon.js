

function word_balloon_get_icon_type(){

	return word_balloon_get_select_option_value('w_b_edit_icon_type');

}

function word_balloon_get_icon_size(){

	return word_balloon_get_select_option_value('w_b_edit_icon_size');

}

function word_balloon_get_icon_position(){
	var e = document.getElementsByName( 'icon_position' ) ;

	for ( var icon_position = '' , i = e.length; i--; ) {
		if ( e[i].checked ) {
			icon_position = e[i].value ;
			break ;
		}
	}

	return icon_position;
}


function word_balloon_get_icon_flip() {
	if( document.getElementById( 'w_b_icon_flip_h' ).checked && document.getElementById( 'w_b_icon_flip_v' ).checked ){
		return 'hv';
	}else if( document.getElementById( "w_b_icon_flip_h" ).checked ){
		return 'h';
	}else if( document.getElementById( "w_b_icon_flip_v" ).checked ){
		return 'v';
	}
	return '';
}



function word_balloon_get_icon_effect(){
	if( !document.getElementById('w_b_edit_icon_effect') ) return '';
	return word_balloon_get_select_option_value('w_b_edit_icon_effect');
}

function word_balloon_get_icon_filter(){
	if( !document.getElementById('w_b_edit_icon_filter') ) return '';
	return word_balloon_get_select_option_value('w_b_edit_icon_filter');
}

function word_balloon_get_icon_in_view(){
	if( !document.getElementById('w_b_edit_icon_in_view') ) return '';
	return word_balloon_get_select_option_value('w_b_edit_icon_in_view');
}

function word_balloon_set_icon_type(){

	var icon = word_balloon_get_icon_type();

	if(icon !== ''){

		var x = new XMLHttpRequest();
		x.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {

				var svg = x.responseText;
				var icon = word_balloon_get_icon_type();

				var icon_data = document.getElementById('custom_icon_' + icon);


				
				
				var fill = icon_data.getAttribute('data-fill');
				var stroke = icon_data.getAttribute('data-stroke');
				var stroke_width = icon_data.getAttribute('data-stroke_width');

				if(	document.getElementById('w_b_restore_load').value === 'true'){
					var w_b_restore = document.getElementById('w_b_restore');
					if( w_b_restore.getAttribute('data-icon_fill') !== '' )
						fill = w_b_restore.getAttribute('data-icon_fill');

					if( w_b_restore.getAttribute('data-icon_stroke') !== '' )
						stroke = w_b_restore.getAttribute('data-icon_stroke');

					if( w_b_restore.getAttribute('data-icon_stroke_width') !== '' )
						stroke_width = w_b_restore.getAttribute('data-icon_stroke_width');
				}

				
				if( document.getElementById('w_b_edit_icon_fill_color') ){
					document.getElementById('w_b_edit_icon_fill_color').value = fill;
					document.querySelector('#w_b_edit_icon_fill_color_wrap button.wp-color-result').style.background = fill;
					document.getElementById('w_b_edit_icon_stroke_color').value = stroke;
					document.querySelector('#w_b_edit_icon_stroke_color_wrap button.wp-color-result').style.background = stroke;
					document.getElementById('w_b_edit_icon_stroke_width').value = stroke_width;
				}



				if('' !== fill && svg.indexOf( 'fill=' ) === -1 ){
					svg = word_balloon_block_svg_icon_add_component('fill',svg)
				}
				if('' !== stroke && svg.indexOf( 'stroke=' ) === -1){
					svg = word_balloon_block_svg_icon_add_component('stroke',svg)
				}
				if('' !== stroke_width && svg.indexOf( 'stroke-width=' ) === -1){
					svg = word_balloon_block_svg_icon_add_component('stroke-width',svg)
				}





				svg = svg.replace(/fill=".*?"/g, 'fill="'+fill+'"');
				svg = svg.replace(/stroke=".*?"/g, 'stroke="'+stroke+'"');
				svg = svg.replace(/stroke-width=".*?"/g, 'stroke-width="'+stroke_width+'"');

				document.getElementById('w_b_icon_svg').src = 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent( svg )));

				word_balloon_change_icon_size ();
				word_balloon_change_icon_position();

				word_balloon_change_icon_effect();
				word_balloon_change_icon_filter();
				word_balloon_change_icon_flip();


				if( document.getElementById('icon_effect_duration') ){
					word_balloon_effect_duration_change( 'icon' , document.getElementById('icon_effect_duration').value );
				}

			}
		};
		x.open("GET", document.getElementById('w_b_wordballoon_url').getAttribute('data-w_b_url') + '/icon/'+icon+'.svg' , true);
		x.send();

	}else{
		document.getElementById('w_b_icon_svg').src = '';

		
		if( document.getElementById('w_b_edit_icon_fill_color') ){
			document.getElementById('w_b_edit_icon_fill_color').value = '';
			document.querySelector('#w_b_edit_icon_fill_color_wrap button.wp-color-result').style.background = '';

			document.getElementById('w_b_edit_icon_stroke_color').value = '';
			document.querySelector('#w_b_edit_icon_stroke_color_wrap button.wp-color-result').style.background = '';

			document.getElementById('w_b_edit_icon_stroke_width').value = '';
		}

	}

}


function word_balloon_change_icon_size () {

	var w_b_icon = document.getElementById('w_b_icon');
	var icon_size = document.getElementById('w_b_icon_custom_size').getAttribute('data-size_' + word_balloon_get_icon_size() );

	w_b_icon.style.width = icon_size + '%';
	w_b_icon.style.height = icon_size + '%';

}



function word_balloon_change_icon_position(){

	var icon_position = word_balloon_get_icon_position();

	var w_b_icon = document.getElementById('w_b_icon');

	var Classes = new Array();
	Classes = [ 'w_b_icon_L' , 'w_b_icon_HC' , 'w_b_icon_VC' , 'w_b_icon_R' , 'w_b_icon_T' , 'w_b_icon_B' ];
	Classes.forEach(function(target) {
		w_b_icon.classList.remove(target);
	});

	if( icon_position === "top_left" || icon_position === "bottom_left" || icon_position === "center_left"){
		w_b_icon.classList.add("w_b_icon_L");
	}

	if( icon_position === "top_center" || icon_position === "bottom_center" || icon_position === "center"){
		w_b_icon.classList.add("w_b_icon_HC");
	}
	if( icon_position === "center_left" || icon_position === "center_right" || icon_position === "center"){
		w_b_icon.classList.add("w_b_icon_VC");
	}
	if( icon_position === "top_right" || icon_position === "bottom_right" || icon_position === "center_right"){
		w_b_icon.classList.add("w_b_icon_R");
	}
	if( icon_position === "top_left" || icon_position === "top_right" || icon_position === "top_center"){
		w_b_icon.classList.add("w_b_icon_T");
	}
	if( icon_position === "bottom_left" || icon_position === "bottom_right" || icon_position === "bottom_center"){
		w_b_icon.classList.add("w_b_icon_B");
	}

}


function word_balloon_change_icon_flip() {

	var w_b_icon_svg = document.getElementById('w_b_icon_svg');

	w_b_icon_svg.classList.remove( 'w_b_flip_h' );
	w_b_icon_svg.classList.remove( 'w_b_flip_v' );
	w_b_icon_svg.classList.remove( 'w_b_flip_hv' );

	if( document.getElementById('w_b_icon_flip_h').checked && document.getElementById('w_b_icon_flip_v').checked ){
		w_b_icon_svg.classList.add( 'w_b_flip_hv' );
	}else if( document.getElementById('w_b_icon_flip_h').checked ){
		w_b_icon_svg.classList.add( 'w_b_flip_h' );
	}else if( document.getElementById('w_b_icon_flip_v').checked ){
		w_b_icon_svg.classList.add( 'w_b_flip_v' );
	}
}

function word_balloon_change_icon_color(){

	var icon = word_balloon_get_icon_type();
	if(icon === '') return;

	var x = new XMLHttpRequest();
	x.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var svg = x.responseText;
			//var icon = word_balloon_get_icon_type();

			var icon_data = document.getElementById('custom_icon_' + icon);

			
			var fill = icon_data.getAttribute('data-fill');
			var stroke = icon_data.getAttribute('data-stroke');
			var stroke_width = icon_data.getAttribute('data-stroke_width');



			if( document.getElementById('w_b_edit_icon_fill_color') ){
				if( '' !== document.getElementById('w_b_edit_icon_fill_color').value)
					fill = document.getElementById('w_b_edit_icon_fill_color').value;

				if( '' !== document.getElementById('w_b_edit_icon_stroke_color').value)
					stroke = document.getElementById('w_b_edit_icon_stroke_color').value;

				if( '' !== document.getElementById('w_b_edit_icon_stroke_width').value)
					stroke_width = document.getElementById('w_b_edit_icon_stroke_width').value;
			}

			svg = svg.replace(/fill=".*?"/g, 'fill="'+fill+'"');
			svg = svg.replace(/stroke=".*?"/g, 'stroke="'+stroke+'"');
			svg = svg.replace(/stroke-width=".*?"/g, 'stroke-width="'+stroke_width+'"');

			document.getElementById('w_b_icon_svg').src = 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent( svg )));

		}
	};
	x.open("GET", document.getElementById('w_b_wordballoon_url').getAttribute('data-w_b_url') + '/icon/'+icon+'.svg' , true);
	x.send();

}


function word_balloon_add_icon_svg_component(type,svg) {

	svg = svg.replace(/<path/g, '<path '+type+'=""');
	svg = svg.replace(/<ellipse/g, '<ellipse '+type+'=""');
	return svg.replace(/<polygon/g, '<polygon '+type+'=""');

}
