



window.addEventListener('load', function(){
  var w_b_loading = document.getElementById('w_b_loading'),
  w_b_loading_bg = document.getElementById('w_b_loading_bg');

  word_balloon_fadeOut( w_b_loading );
  word_balloon_fadeOut( w_b_loading_bg );

  if(document.getElementById('w_b_avatar_submit')){

    document.getElementById('w_b_avatar_submit').onclick = function() {
      word_balloon_fadeIn( w_b_loading );
      word_balloon_fadeIn( w_b_loading_bg );
      document.w_b_avatar_new_edit_form.submit();
    };

  }

  if(document.getElementById('w_b_favorite_submit')){

    document.getElementById('w_b_favorite_submit').onclick = function() {
      word_balloon_fadeIn( w_b_loading );
      word_balloon_fadeIn( w_b_loading_bg );
      document.w_b_avatar_favorite_form.submit();
    };

  }


},false);

