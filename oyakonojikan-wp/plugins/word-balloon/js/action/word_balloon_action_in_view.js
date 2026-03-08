

function word_balloon_change_avatar_in_view(){
	word_balloon_in_view_reset ('avatar' , 'w_b_ava_wrap');
}

function word_balloon_change_balloon_in_view(){
	word_balloon_in_view_reset ('balloon' , 'w_b_bal_box');
}

function word_balloon_change_icon_in_view(){
	word_balloon_in_view_reset ('icon' , 'w_b_icon');
}

function word_balloon_in_view_reset (type , box) {

	var Classes = new Array();

	var in_view =  eval('word_balloon_get_' + type + '_in_view()');

	box = document.getElementById(box);

	Classes = [ 'w_b_inview_solo' , 'w_b_outview' , 'w_b_outclass' , 'w_b_inview' , 'w_b_inclass' , 'w_b_direction_U' , 'w_b_direction_O' , 'w_b_direction_L' , 'w_b_direction_R' ];

	Classes.forEach(function(target) {
		box.classList.remove(target);
	});

	var arr = JSON.parse(document.getElementById('w_b_type_in_view').dataset.type);

	for (var i = 0; i < arr.length; i++) {
		box.classList.remove( 'w_b_inview_' + arr[i] );
	}

	if(in_view !== ''){
		Classes = [ 'w_b_inview_' + in_view , 'w_b_inview_solo' , 'w_b_outview' , 'w_b_outclass' , 'w_b_direction_'  + word_balloon_get_balloon_direction() ];
		Classes.forEach(function(target) {
			box.classList.add(target);
		});

		setTimeout(function(){
			box.classList.remove('w_b_outclass');
			box.classList.add('w_b_inview');
			box.classList.add('w_b_inclass');
		},1000);
	}
}

function word_balloon_in_view_duration_change( type , val ){

	if( !document.getElementById( 'w_b_edit_' + type + '_in_view_duration') ) return;

	var e = '';

	if(type === 'avatar'){
		e = document.getElementById('w_b_ava_wrap');
	}else if(type === 'balloon'){
		e = document.getElementById('w_b_bal_box');
	}else if(type === 'icon'){
		e = document.getElementById('w_b_icon');
	}

	e.style.animationDuration = val+'s';

}

function word_balloon_in_view_duration_clear( type ){

	if( !document.getElementById( 'w_b_edit_' + type + '_in_view_duration') ) return;

	if(type === 'avatar'){
		document.getElementById('w_b_edit_avatar_in_view_duration').value = '';
		e = document.getElementById('w_b_ava_wrap');
	}else if(type === 'balloon'){
		document.getElementById('w_b_edit_balloon_in_view_duration').value = '';
		e = document.getElementById('w_b_bal_box');
	}else if(type === 'icon'){
		document.getElementById('w_b_edit_icon_in_view_duration').value = '';
		e = document.getElementById('w_b_icon');
	}

	e.style.animationDuration = '';

}
