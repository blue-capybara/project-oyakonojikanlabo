

if (document.getElementById('w_b_avatar_clear')) {

  document.getElementById('w_b_avatar_clear').addEventListener('click', function (e) {

    document.getElementById('w_b_avatar_clear').style.visibility = 'hidden';
    document.getElementById('w_b_register_avatar_img').src = document.getElementById('w_b_mystery_men_url').value;
    document.getElementById('w_b_avatar_src').value = '';
    document.getElementById('w_b_avatar_src_id').value = '';

  });

}

document.addEventListener("DOMContentLoaded", function () {

  if (document.querySelector('.next-page.button')) {
    document.querySelector('.next-page.button').onclick = function () {
      word_balloon_in_loading();
    };
  }
  if (document.querySelector('.last-page.button')) {
    document.querySelector('.last-page.button').onclick = function () {
      word_balloon_in_loading();
    };
  }
  if (document.querySelector('.prev-page.button')) {
    document.querySelector('.prev-page.button').onclick = function () {
      word_balloon_in_loading();
    };
  }
  if (document.querySelector('.first-page.button')) {
    document.querySelector('.first-page.button').onclick = function () {
      word_balloon_in_loading();
    };
  }



});




(function () {


  
  var frame = wp.media({
    title: translations_word_balloon.select_an_avatar,
    
    library: {
      type: "image"
    },
    button: {
      text: translations_word_balloon.select
    },
    
    multiple: false
  });

  var custom_uploader;

  function word_balloon_regist_avatar(e, fn) {

    e.preventDefault();

    if (custom_uploader) {
      custom_uploader.open();
      return;
    }
    custom_uploader = frame;

    custom_uploader.on("select", function () {
      var images = custom_uploader.state().get("selection");

      
      images.each(function (file) {

        var select_image_avatar_url;

        var max_size = 512;

        if (document.getElementById('w_b_max_avatar_dimensions')) {
          max_size = Number(document.getElementById('w_b_max_avatar_dimensions').value);
        }

        if (file.attributes.width <= max_size) {
          select_image_avatar_url = file.attributes.sizes.full.url;
        } else if (typeof file.attributes.sizes.large != "undefined" && file.attributes.sizes.large.width <= max_size) {
          select_image_avatar_url = file.attributes.sizes.large.url;
        } else if (typeof file.attributes.sizes.medium != "undefined" && file.attributes.sizes.medium.width <= max_size) {
          select_image_avatar_url = file.attributes.sizes.medium.url;
        } else if (typeof file.attributes.sizes.thumbnail != "undefined" && file.attributes.sizes.medium.width <= max_size) {
          select_image_avatar_url = file.attributes.sizes.thumbnail.url;
        } else {
          select_image_avatar_url = file.attributes.sizes.full.url;
        }

        document.getElementById('w_b_avatar_src_id').value = file.attributes.id;

        eval(fn + '(select_image_avatar_url)');

      });
    });
    custom_uploader.open();
  }


  document.addEventListener("DOMContentLoaded", function () {
    var select_avatar = document.querySelectorAll('.w_b_select_avatar_image_button');

    
    for (var i = 0; i < select_avatar.length; i++) {

      select_avatar[i].addEventListener('click', function (e) {
        word_balloon_regist_avatar(e, 'word_balloon_registered_avatar');
      });
    }
  });





  function word_balloon_registered_avatar(e) {

    document.getElementById('w_b_avatar_src').value = e;

    document.getElementById('w_b_register_avatar_img').src = e;

    document.getElementById('w_b_avatar_clear').style.visibility = 'visible';

  }


  function word_balloon_re_registered_avatar(e) {

    document.getElementById('w_b_re_avatar_src').value = e;

  }



  
  
  

  
  var w_b_delete_link_list = document.querySelectorAll('.delete_link');
  for (var i = 0; i < w_b_delete_link_list.length; i++) {
    w_b_delete_link_list[i].addEventListener('click', function (e) {
      if (!confirm(translations_word_balloon.do_you_want_to_delete)) {
        e.preventDefault();
      } else {
        word_balloon_in_loading();
      }

    });
  }

  
  document.getElementById('avatars-filter').addEventListener('submit', word_balloon_bulk_delete);

  function word_balloon_bulk_delete(e) {

    var s;

    if (e.submitter.id === 'doaction') {

      s = document.getElementById('bulk-action-selector-top');

    } else if (e.submitter.id === 'doaction2') {

      s = document.getElementById('bulk-action-selector-bottom');

    }

    
    s = s.options[s.selectedIndex].value;

    if (s !== 'delete-selected') {
      e.preventDefault();
      word_balloon_pop_up_message(translations_word_balloon.pop_up_select_bulk_action, '#ffc107');
      return;
    }

    var answer = false

    var w_b_avatar_delete_lists = document.querySelectorAll('.w_b_avatar_delete_lists');
    for (var i = 0; i < w_b_avatar_delete_lists.length; i++) {
      if (w_b_avatar_delete_lists[i].checked)
        answer = true
    }

    if (answer) {
      if (!confirm(translations_word_balloon.really_remove_avatar)) {
        e.preventDefault();
        return;
      } else {
        word_balloon_in_loading();
      }

    } else {
      e.preventDefault();
      word_balloon_pop_up_message(translations_word_balloon.pop_up_select_avatar_checkbox, '#ffc107');
      return;
    }



  }




  
  jQuery(function ($) {
    var original_tr, original_td, renewal_html;

    
    var w_b_tr_close = function () {
      original_tr.removeClass('w_b_tr_selected');
      jQuery('.w_b_edit_selected').remove();
      jQuery('.hidden').remove();
      original_tr.css('display', 'table-row');
    };

    
    jQuery('#the-list').on('click', 'a.w_b_editinline', function () {
      if (jQuery('#the-list').children().hasClass('w_b_edit_selected')) {
        
        w_b_tr_close();
      }

      
      original_tr = jQuery(this).closest('tr');

      
      original_td = original_tr.find('td');

      
      if (typeof window['word_balloon_pro_avatar_change_registered_data'] === 'function') {
        renewal_html = word_balloon_pro_avatar_change_registered_data(original_tr, original_td);
      } else {
        renewal_html = '<tr class="hidden"></tr><tr class="w_b_edit_selected"><th scope="row" class="check-column"></th><td colspan="5"><fieldset class="w_b_inline-edit-col-left"><legend class="inline-edit-legend">' + translations_word_balloon.edit_avatar + '</legend><div class="inline-edit-col"><label><span class="title">ID</span><span class="input-text-wrap"><input type="number" name="w_b_avatar_id_re" class="ptitle w_b_avatar_id_re w_b_inline_edit_input_submit" value="' + original_tr.find('input').val() + '" min="1" max="9999" required></span></label><label><span class="title">' + translations_word_balloon.edit_avatar_name + '</span><span class="input-text-wrap"><input type="text" name="w_b_avatar_name_re" class="ptitle w_b_inline_edit_input_submit" value="' + original_td.find('span.column_avatar_name').text() + '" maxlength="50"></span></label><label><span class="title">' + translations_word_balloon.edit_avatar_note + '</span><span class="input-text-wrap"><input type="text" name="w_b_avatar_text_re" class="ptitle w_b_inline_edit_input_submit" value="' + original_td.find('span.column_avatar_text').text() + '" maxlength="100" /></span></label><input type="hidden" name="w_b_avatar_priority_re" value="' + parseInt(original_tr.find('td.priority.column-priority').text()) + '" /><input type="hidden" name="w_b_avatar_src_re" value="' + original_tr.find('img.w_b_avatar_list_img').attr("src") + '" /><input type="hidden" name="w_b_avatar_id_original" class="ptitle" value="' + original_tr.find('input').val() + '" /><div class="w_b_save_cancel_box"><button type="button" class="button cancel alignleft">' + translations_word_balloon.edit_avatar_cancel + '</button> <button type="button" class="button button-primary save alignright">' + translations_word_balloon.edit_avatar_update + '</button> <span class="w_b_loader"></span></div></div></fieldset></td></tr>';
      }

      original_tr.addClass('w_b_tr_selected');
      original_tr.after(renewal_html);
      original_tr.css('display', 'none');

      if (document.getElementById('w_b_re_avatar')) {
        document.getElementById('w_b_re_avatar').addEventListener('click', function (e) {

          word_balloon_regist_avatar(e, 'word_balloon_re_registered_avatar');

        });
      }


    });


    
    jQuery('#the-list').on('click', 'button.cancel', function () {
      
      w_b_tr_close();
    });

    
    jQuery(document).on('click', 'button.save', function () {

      word_balloon_update_avatar();

    });


    function word_balloon_update_avatar() {

      var datauri = false;

      if (document.querySelector('input[name="w_b_avatar_data_uri_re"]')) {
        datauri = document.querySelector('input[name="w_b_avatar_data_uri_re"]').checked;
      }

      var send_data = {
        
        action: word_balloon_nonce_ajax_object.action,
        
        nonce: word_balloon_nonce_ajax_object.nonce,
        
        text: document.querySelector('input[name="w_b_avatar_text_re"]').value,
        url: document.querySelector('input[name="w_b_avatar_src_re"]').value,
        id: document.querySelector('input[name="w_b_avatar_id_re"]').value,
        datauri: datauri,
        priority: document.querySelector('input[name="w_b_avatar_priority_re"]').value,
        name: document.querySelector('input[name="w_b_avatar_name_re"]').value,
        originalid: document.querySelector('input[name="w_b_avatar_id_original"]').value,
      };

      
      var xhr = new XMLHttpRequest();
      var w_b_loader = document.getElementsByClassName('w_b_loader');
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          
          
          
          var w_b_json_data = JSON.parse(xhr.response);
          w_b_loader[0].classList.remove('is-active');
          if (xhr.status === 200) {
            
            
            
            if (w_b_json_data['status'] === 200) {
              word_balloon_pop_up_message(w_b_json_data['message'], '#28a745');
              original_tr[0].innerHTML = w_b_json_data['column'];
              w_b_tr_close();
            } else {
              word_balloon_pop_up_message(translations_word_balloon.pop_up_failed + '<br>' + w_b_json_data['message'], '#dc3848');
            }
          } else {
            
            word_balloon_pop_up_message(w_b_json_data['message'], '#dc3848');
          }
        } else {
          
          w_b_loader[0].classList.add('is-active');
          word_balloon_pop_up_message(translations_word_balloon.pop_up_updating, '#868e96');
        }
      };

      xhr.open("POST", word_balloon_nonce_ajax_object.ajax_url, true);
      xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

      xhr.send(word_balloon_encodeURI(send_data));

    }


    
    jQuery(document).on('input', '.w_b_avatar_text_re', function (e) {
      
      var halfVal = jQuery(this).val().replace(/[！-～]/g,
        function (tmpStr) {
          
          return String.fromCharCode(tmpStr.charCodeAt(0) - 0xFEE0);
        }
      );
      
      jQuery(this).val(halfVal.replace(/[^0-9]/g, ''));
      
      if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);
    });

    
    jQuery(document).on('input', '.w_b_avatar_priority_re', function (e) {
      
      var halfVal = jQuery(this).val().replace(/[！-～]/g,
        function (tmpStr) {
          
          return String.fromCharCode(tmpStr.charCodeAt(0) - 0xFEE0);
        }
      );
      
      jQuery(this).val(halfVal.replace(/[^0-9]/g, ''));
      
      if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);
    });

    
    jQuery(document).on("keypress", "input:not(.allow_submit)", function (event) {
      return event.which !== 13;
    });

  });

})();