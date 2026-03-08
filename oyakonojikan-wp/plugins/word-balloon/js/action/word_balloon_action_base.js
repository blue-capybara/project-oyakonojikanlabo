
function word_balloon_getSelectionText() {
	if (window.getSelection) {
		try {
			
			
			

			var ta = document.getElementById('content');

			ta = ta.value.substring(ta.selectionStart, ta.selectionEnd);

			if(ta === ''){
				return tinyMCE.activeEditor.selection.getContent();
			}else{
				return ta;
			}

		} catch (e) {
			console.log('Can not get selection text')
		}
	}
	
	if (document.selection && document.selection.type != "Control") {
		return document.selection.createRange().text;
	}
}



function word_balloon_change_select_option(id, select_item){

	var e = document.getElementById(id);
	var f = e.options;

	for (var opt, i = 0; opt = f[i]; i++) {
		if (opt.value === select_item) {
			e.selectedIndex = i;
			break;
		}
	}
}

function word_balloon_delete_select_option(id, delete_item){

	var e = document.getElementById(id);
	var f = e.options;

	for (var opt, i = 0; opt = f[i]; i++) {
		if (opt.value === delete_item) {
			e.remove(i);
			break;
		}
	}
}

function word_balloon_add_select_option(id, add_item , val){

	var select = document.getElementById(id);
	select.options[select.options.length] = new Option( add_item , val );

}

function word_balloon_get_select_option_value(id){
	var e = document.getElementById(id);

	
	if( typeof e.options[e.selectedIndex] !== 'undefined'){
		return e.options[e.selectedIndex].value;
	}
	console.log('No item');
	return;
}

var word_balloon_timeoutID;



function word_balloon_stopTimeout() {
	var pop_up_message = document.getElementById('w_b_pop_up_message');
	pop_up_message.classList.add('inactive');
	clearTimeout(word_balloon_timeoutID);
	setTimeout(function() {
		pop_up_message.classList.remove('inactive');
	}, 100);

}

function word_balloon_pop_up_message( message , background_color) {
	if(typeof word_balloon_timeoutID !== 'undefined')
		word_balloon_stopTimeout();
	var pop_up_message = document.getElementById('w_b_pop_up_message');
	pop_up_message.style.backgroundColor = background_color;
	pop_up_message.style.color = word_balloon_BlackOrWhite(background_color);
	pop_up_message.classList.add('active');
	pop_up_message.innerHTML = message;
	word_balloon_timeoutID = setTimeout(function() {
		pop_up_message.classList.remove('active');
	}, 4000);
}

function word_balloon_encodeURI(obj) {
	var result = '',
	splitter = '';

	if (typeof obj === 'object') {
		Object.keys(obj).forEach(function (key) {
			result += splitter + key + '=' + encodeURIComponent(obj[key]);
			splitter = '&';
		});
	}
	return result;
}

function word_balloon_fadeOut(el){
	el.style.opacity = 1;

	(function fade() {
		if ((el.style.opacity -= .1) < 0) {
			el.style.display = "none";
		} else {
			requestAnimationFrame(fade);
		}
	})();
}

function word_balloon_fadeIn(el, display){
	el.style.opacity = 0;
	el.style.display = display || "block";

	(function fade() {
		var val = parseFloat(el.style.opacity);
		if (!((val += .1) > 1)) {
			el.style.opacity = val;
			requestAnimationFrame(fade);
		}
	})();
}

function word_balloon_in_loading(){
	var w_b_loading = document.getElementById('w_b_loading'),
	w_b_loading_bg = document.getElementById('w_b_loading_bg');
	word_balloon_fadeIn( w_b_loading );
	word_balloon_fadeIn( w_b_loading_bg );
}

function word_balloon_out_loading(){
	var w_b_loading = document.getElementById('w_b_loading'),
	w_b_loading_bg = document.getElementById('w_b_loading_bg');
	word_balloon_fadeOut( w_b_loading );
	word_balloon_fadeOut( w_b_loading_bg );
}

function word_balloon_BlackOrWhite ( hexcolor ) {
	var r = parseInt( hexcolor.substr( 1, 2 ), 16 ) ;
	var g = parseInt( hexcolor.substr( 3, 2 ), 16 ) ;
	var b = parseInt( hexcolor.substr( 5, 2 ), 16 ) ;

	return ( ( (r * 0.299) + (g * 0.587) + (b * 0.114) ) > 186 ) ? "#000000" : "#ffffff" ;
}