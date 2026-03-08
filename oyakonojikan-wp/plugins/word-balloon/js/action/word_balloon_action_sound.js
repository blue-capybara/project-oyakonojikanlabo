document.addEventListener("DOMContentLoaded", function() {

    if( !document.getElementById('w_b_sound_icon_wrap') ) return;

    
    var syncerSounds = {flag: {},currentPlayID: null};

    
    document.getElementById('w_b_sound_icon_wrap').onclick = function(){

        var sound_data = document.getElementById('w_b_sound_icon_wrap');

        if( sound_data.getAttribute( 'data-current' ) === 'play' ){
            word_balloon_stopCurrentSound();
            word_balloon_change_status_sound_icon_reset();
            word_balloon_change_status_box();
            return false ;
        }

        var icon = document.getElementById('w_b_sound_icon');
        var play = sound_data.getAttribute('data-play');
        var stop = sound_data.getAttribute('data-stop');
        var speaker = sound_data.getAttribute('data-speaker');

        
        var file = sound_data.getAttribute( 'data-audio_url' ) ;
        var id = sound_data.getAttribute( 'data-audio_id' ) ;

        
        if( typeof( syncerSounds.flag[ id ] ) === "undefined" || syncerSounds.flag[ id ] !== 1 ){
            
            var audio = document.createElement( 'audio' ) ;

            
            audio.id = id ;
            
            audio.src = file ;

            
            document.body.appendChild( audio ) ;

        }

        
        word_balloon_stopCurrentSound() ;

        
        document.getElementById( id ).play() ;

        icon.src = stop;
        sound_data.setAttribute('data-current' , 'play');
        
        syncerSounds.currentPlayID = id ;

        
        
        syncerSounds.flag[ id ] = 1 ;

        word_balloon_endedCurrentSound(id);


        return false ;
    }

    
    document.getElementById('w_b_status_sound_clear').onclick = function(){
        word_balloon_stopCurrentSound();
        word_balloon_change_status_sound_icon_reset();

        document.getElementById('w_b_status_sound_filename').value = '';
        document.getElementById('w_b_status_sound_id').value = '';
        document.getElementById('w_b_status_sound_url').value = '';

        word_balloon_change_status_box();
        return false ;
    }


    
    function word_balloon_endedCurrentSound(id){

        var audio = document.getElementById(id);

        audio.addEventListener("ended", function(e) {

            word_balloon_change_status_sound_icon_reset();
            word_balloon_stopCurrentSound() ;

        });
    }
    
    function word_balloon_stopCurrentSound(){
        var currentSound = document.getElementById( syncerSounds.currentPlayID ) ;



        if( currentSound != null ){
            currentSound.pause() ;
            currentSound.currentTime = 0;
        }
        syncerSounds.currentPlayID = null ;

    }




});






function word_balloon_change_status_sound_icon_reset(){
    var sound_data = document.getElementById('w_b_sound_icon_wrap');
    var icon = document.getElementById('w_b_sound_icon');
    var side = word_balloon_get_avatar_position();

    icon.src = sound_data.getAttribute('data-speaker');
    sound_data.setAttribute('data-current' , 'stop');
    if(side === 'R'){
        icon.classList.add( 'w_b_flip_h' );
    }else{
        icon.classList.remove( 'w_b_flip_h' );
    }


}









function word_balloon_hover_status_sound_icon(action){

    var sound_data = document.getElementById('w_b_sound_icon_wrap');
    var icon = document.getElementById('w_b_sound_icon');
    var side = word_balloon_get_avatar_position();

    if(action === 'enter'){

        if( sound_data.getAttribute('data-current') === 'play' ){

            icon.src = sound_data.getAttribute('data-stop');

        }else{
            if(side === 'R'){
                icon.classList.remove( 'w_b_flip_h' );
            }
            icon.src = sound_data.getAttribute('data-play');
        }

    }else{

        if( sound_data.getAttribute('data-current') === 'play' ){

            icon.src = sound_data.getAttribute('data-stop');

        }else{
            if(side === 'R'){
                icon.classList.add( 'w_b_flip_h' );
            }
            icon.src = sound_data.getAttribute('data-speaker');
        }

    }

}






function word_balloon_set_status_sound(e){
    var custom_uploader;
    e.preventDefault();
    if (custom_uploader) {
        custom_uploader.open();
        return;
    }
    custom_uploader = wp.media({
        title: translations_word_balloon.select_a_sound,
        library: {
            type: "audio"
        },
        button: {
            text: translations_word_balloon.select
        },
        multiple: false
    });
    custom_uploader.on("select", function() {
        var audio = custom_uploader.state().get("selection");

        audio.each(function(file){

            document.getElementById('w_b_status_sound_filename').value = file.attributes.filename
            document.getElementById('w_b_status_sound_id').value = file.attributes.id
            document.getElementById('w_b_status_sound_url').value = file.attributes.url

            word_balloon_change_status_box();
        });
    });
    custom_uploader.open();
}

