window.addEventListener('load', function () {

  
  var syncerSounds = {
    flag: {},
    currentPlayID: null};

    
    (function(){

        

        var play = document.getElementsByClassName( 'w_b_play_sound' ) ;
        var stop = document.getElementsByClassName( 'w_b_stop_sound' ) ;





        
        for( var i=0,l=play.length ; l>i ; i++ ){

            
            play[i].onclick = function(){
                
                var file = this.getAttribute( 'data-audio_url' ) ;
                var id = this.getAttribute( 'data-audio_id' ) ;


                
                if( typeof( syncerSounds.flag[ id ] )=="undefined" || syncerSounds.flag[ id ] != 1 ){
                    
                    var audio = document.createElement( 'audio' ) ;

                    
                    audio.id = id ;
                    
                    audio.src = file ;

                    
                    document.body.appendChild( audio ) ;

                }

                
                stopCurrentSound() ;

                
                document.getElementById( id ).play() ;

                this.nextElementSibling.style.display = 'block';
                this.style.display = 'none';

                
                syncerSounds.currentPlayID = id ;

                
                
                syncerSounds.flag[ id ] = 1 ;

                endedCurrentSound(id);


                return false ;
            }
            
            stop[i].onclick = function(){

                stopCurrentSound() ;
                this.previousElementSibling.style.display = 'block';
                this.style.display = 'none';
                return false ;
            }
        }

        function display_play_sound_icon(id){

            var play_sound = document.querySelectorAll('div.w_b_play_sound[data-audio_id="'+ id +'"]');

            for (var i = 0; i < play_sound.length; i++) {
              play_sound[i].style.display = 'block';
          }

          var stop_sound = document.querySelectorAll('div.w_b_stop_sound[data-audio_id="'+ id +'"]');
          for (var i = 0; i < stop_sound.length; i++) {
            stop_sound[i].style.display = 'none';
        }

        return;
    }

    
    function endedCurrentSound(id){

        var audio = document.getElementById(id);

        audio.addEventListener("ended", function(e) {

            


            

            display_play_sound_icon(e.target.id);

            stopCurrentSound() ;

        });
    }
    
    function stopCurrentSound(){
        var currentSound = document.getElementById( syncerSounds.currentPlayID ) ;

        
        

        if( currentSound !== null ){

            display_play_sound_icon(syncerSounds.currentPlayID);

            currentSound.pause() ;
            currentSound.currentTime = 0;
        }

        syncerSounds.currentPlayID = null ;

    }

    
    
        
        
        
            
            
            

            var w_b_play_sound = document.getElementsByClassName('w_b_play_sound');
            for (var i = 0; i < w_b_play_sound.length; i++) {
                w_b_play_sound[i].addEventListener("mouseover",function(e){
                    e.target.classList.remove("w_b_flip_h");
                    e.target.src = e.target.parentNode.getAttribute( 'data-play' );
                });
                w_b_play_sound[i].addEventListener("mouseout",function(e){
                    var flip = e.target.parentNode.getAttribute( 'data-flip' );
                    if (flip !== ''){
                        e.target.classList.add( flip );
                    }
                    e.target.src = e.target.parentNode.getAttribute( 'data-speaker' );
                });
            }







        })();


    });