<?php

/*
 * load common and WordPress based resources
 *
 * @since 1.0.0
 */

class Advanced_Ads_Browser_Language {

        /**
	 *
	 */
	protected static $instance;

	public function __construct() {
		add_action( 'plugins_loaded', array( $this, 'wp_plugins_loaded' ) );
	}

	/**
         * load actions and filters
         *
         * @todo include more of the hooks used in public and admin class
         */
	public function wp_plugins_loaded() {
            // stop, if main plugin doesn’t exist or pro exists, because this is included there
	    if ( ! class_exists( 'Advanced_Ads', false ) || class_exists( 'Advanced_Ads_Pro', false ) ) {
                return ;
            }

	    add_filter( 'advanced-ads-visitor-conditions', array( $this, 'visitor_conditions' ) );
	}

	/**
	 * add visitor condition
	 *
	 * @since 1.0.0
	 * @param arr $conditions visitor conditions of the main plugin
	 * @return arr $conditions new global visitor conditions
	 */
	public function visitor_conditions( $conditions ){

		// browser lang
		$conditions['browser_lang'] = array(
			'label' => __( 'browser language', AABL_SLUG ),
			'description' => __( 'Display ads based on the visitors browser languag.', AABL_SLUG ),
			'metabox' => array( 'Advanced_Ads_Browser_Language', 'metabox_browser_lang' ), // callback to generate the metabox
			'check' => array( 'Advanced_Ads_Browser_Language', 'check_browser_lang' ) // callback for frontend check
		);

		return $conditions;
	}

	/**
	 * callback to display the "browser language" condition
	 *
	 * @param arr $options options of the condition
	 * @param int $index index of the condition
	 */
	static function metabox_browser_lang( $options, $index = 0 ){

	    if ( ! isset ( $options['type'] ) || '' === $options['type'] ) { return; }

	    $type_options = Advanced_Ads_Visitor_Conditions::get_instance()->conditions;

	    if ( ! isset( $type_options[ $options['type'] ] ) ) {
		    return;
	    }

	    // form name basis
	    $name = Advanced_Ads_Visitor_Conditions::FORM_NAME . '[' . $index . ']';

	    // options
	    $value = isset( $options['value'] ) ? $options['value'] : '';
	    $connector = isset( $options['connector'] ) ? $options['connector'] : 'and';

	    // load browser languages
	    include plugin_dir_path( __FILE__ ) . 'browser_langs.php';
	    if( isset( $advads_browser_langs )){
		asort( $advads_browser_langs );
	    }

	    ?><input type="hidden" name="<?php echo $name; ?>[type]" value="<?php echo $options['type']; ?>"/>
		<input type="hidden" name="<?php echo $name; ?>[connector]" value="<?php echo $connector; ?>"/>
		<select name="<?php echo $name; ?>[value]">
			<option><?php _e( '-- choose one --' ); ?></option>
			<?php if( isset( $advads_browser_langs )) :
			    foreach( $advads_browser_langs as $_key => $_title ) : ?>
				<option value="<?php echo $_key; ?>" <?php selected( $_key, $value ); ?>><?php echo $_title; ?></option>
			<?php endforeach;
			endif; ?>
		</select>
	    <p class="description"><?php echo $type_options[ $options['type'] ]['description']; ?></p><?php
	}


	/**
	 * check browser language
	 *
	 * @since 1.0.0
	 * @param arr $options options of the condition
	 * @return bool true if ad can be displayed
	 */
	static function check_browser_lang( $options = array() ){

		if ( ! isset( $options['value'] ) || '' === $options['value'] ){
			return true;
		}

		if ( ! isset( $_SERVER[ 'HTTP_ACCEPT_LANGUAGE' ] ) || '' === $_SERVER[ 'HTTP_ACCEPT_LANGUAGE' ] ) {
			return true;
		}

		// check if the browser lang is within the accepted language string
		$regex = "@\b" . $options['value'] . "\b@i"; // \b checks for "whole words"
		return preg_match($regex, $_SERVER[ 'HTTP_ACCEPT_LANGUAGE' ]) === 1;
	}
}

