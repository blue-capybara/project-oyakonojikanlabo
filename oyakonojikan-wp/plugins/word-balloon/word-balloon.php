<?php
/*
Plugin Name: Word Balloon
Plugin URI: https://dev.back2nature.jp/en/word-balloon/
Description: Support for Block editor(Gutenberg) & Classic Editor.You will easy to add speech balloon in your post.
Version: 4.18.5
Author: YAHMAN
Author URI: https://back2nature.jp/
License: GNU General Public License v3 or later
Text Domain: word-balloon
Domain Path: /languages/
*/

/*
    Word Balloon
    Copyright (C) 2018 YAHMAN

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

    defined( 'ABSPATH' ) || exit;
    
    
    $data = get_file_data( __FILE__, array( 'Version' ) );

    define( 'WORD_BALLOON_VERSION', $data[0] );
    define( 'WORD_BALLOON_DIR', trailingslashit( plugin_dir_path( __FILE__ ) ) );
    define( 'WORD_BALLOON_URI', trailingslashit( esc_url( plugin_dir_url( __FILE__ ) ) ) );
    define( 'WORD_BALLOON_PLUGIN_FILE', __FILE__ );

    
    function word_balloon_user_styles() {
    	wp_enqueue_style( 'word_balloon_user_style', WORD_BALLOON_URI . 'css/word_balloon_user.min.css' , array() , WORD_BALLOON_VERSION);
    }


    if(is_admin()){
    	
    	require_once WORD_BALLOON_DIR . 'inc/admin.php';
    }else{
    	
    	require_once WORD_BALLOON_DIR . 'inc/shortcode.php';
    }


