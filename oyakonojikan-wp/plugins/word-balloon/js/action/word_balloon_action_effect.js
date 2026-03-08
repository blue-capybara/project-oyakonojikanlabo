



function word_balloon_change_avatar_effect(){
	word_balloon_reset_effect ('avatar' , 'w_b_ava_effect');
}

function word_balloon_change_balloon_effect(){
	word_balloon_reset_effect ('balloon' , 'w_b_bal_outer');
}

function word_balloon_change_icon_effect(){
	word_balloon_reset_effect ('icon' , 'w_b_icon_effect');
}

function word_balloon_reset_effect (type , target) {

	var effect = eval('word_balloon_get_' + type + '_effect()');

	target = document.getElementById(target);

	var arr = JSON.parse(document.getElementById('w_b_type_effect').dataset.type);

	for (var i = 0; i < arr.length; i++) {
		target.classList.remove( 'w_b_' + arr[i] );
	}

	if(effect !== ''){
		target.classList.add( 'w_b_' + effect );
	}

}

function word_balloon_effect_duration_change( type , val ){

	if( !document.getElementById( 'w_b_edit_' + type + '_effect_duration') ) return;

	var e = '';

	if(type === 'avatar'){
		e = document.getElementById('w_b_ava_effect');
	}else if(type === 'balloon'){
		e = document.getElementById('w_b_bal_outer');
	}else if(type === 'icon'){
		e = document.getElementById('w_b_icon_effect');
	}

	e.style.animationDuration = val+'s';

}

function word_balloon_effect_duration_clear( type ){

	if( !document.getElementById( 'w_b_edit_' + type + '_effect_duration') ) return;

	if(type === 'avatar'){
		document.getElementById('w_b_edit_avatar_effect_duration').value = '';
		e = document.getElementById('w_b_ava_effect');
	}else if(type === 'balloon'){
		document.getElementById('w_b_edit_balloon_effect_duration').value = '';
		e = document.getElementById('w_b_bal_outer');
	}else if(type === 'icon'){
		document.getElementById('w_b_edit_icon_effect_duration').value = '';
		e = document.getElementById('w_b_icon_effect');
	}

	e.style.animationDuration = '';

}
