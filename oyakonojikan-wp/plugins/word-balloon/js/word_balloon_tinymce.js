(function() {
  // Register buttons
  tinymce.create('tinymce.plugins.Word_Balloon_Button', {
    init: function( editor, url ) {
      // Add button that inserts shortcode into the current position of the editor
      editor.addButton( 'word_balloon_button', {
        title: 'Word Ballon',
        icon: ' wb-comment-o',
        onclick: function() {
          document.getElementById('w_b_modal_open').onclick();
          //jQuery('.w_b_modal_open').click();
        }
      });
      editor.addButton( 'word_balloon_set_quote_button', {
        title: 'Set quote',
        icon: ' wb-commenting-o',
        onclick: function() {
          document.getElementById('w_b_set_quote').onclick();
          //jQuery('.w_b_modal_open').click();
        }
      });
      editor.addButton( 'word_balloon_restore_button', {
        title: 'Restore Balloon',
        icon: ' wb-undo',
        onclick: function() {
          document.getElementById('w_b_restore_copy').onclick();
        }
      });
    },
    createControl: function( n, cm ) {
      return null;
    }
  });
  // Add buttons
  tinymce.PluginManager.add( 'word_balloon_script', tinymce.plugins.Word_Balloon_Button );
  tinymce.PluginManager.requireLangPack('word_balloon_script', 'ja');
})();