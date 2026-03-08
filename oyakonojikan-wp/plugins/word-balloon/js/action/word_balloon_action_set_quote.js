if (document.getElementById('w_b_post_text')) {
    document.getElementById('w_b_post_text').addEventListener('input', function (e) {

        var w_b_post_text_ph = document.getElementById('w_b_post_text_ph');
        var w_b_post_pre_text = document.getElementById('w_b_post_pre_text');
        var w_b_quote = document.getElementById('w_b_quote');

        w_b_post_pre_text.innerHTML = e.target.value.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r?\n/g, '<br>') + '\u200b';

        if (e.target.value !== '') {
            w_b_post_text_ph.style.display = 'none';
            w_b_post_pre_text.style.display = 'block';
            w_b_quote.style.minWidth = 'auto'
        } else {
            w_b_post_text_ph.style.display = 'block';
            w_b_post_pre_text.style.display = 'none';
            w_b_quote.style.minWidth = '120px'
        }

    }, false);
}

