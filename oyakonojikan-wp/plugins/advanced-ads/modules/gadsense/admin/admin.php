<?php

class Advanced_Ads_AdSense_Admin {

	private $data;
	private $nonce;
	private static $instance = null;
	protected $notice = null;
        private $settings_page_hook = 'advanced-ads-adsense-settings-page';
	
	const	ADSENSE_NEW_ACCOUNT_LINK = 'https://www.google.com/adsense/start/?utm_source=AdvancedAdsPlugIn&utm_medium=partnerships&utm_campaign=AdvancedAdsPartner1';

	private function __construct() {
		$this->data = Advanced_Ads_AdSense_Data::get_instance();

		add_action( 'admin_enqueue_scripts', array($this, 'enqueue_scripts') );
		add_action( 'admin_print_scripts', array($this, 'print_scripts') );
		add_filter( 'advanced-ads-list-ad-size', array($this, 'ad_details_column'), 10, 2 );
		add_filter( 'advanced-ads-ad-notices', array($this, 'ad_notices'), 10, 3 );
	}

	public function ad_details_column($size, $the_ad) {
		if ( 'adsense' == $the_ad->type ) {
			$content = json_decode( $the_ad->content );
			if ( $content && 'responsive' == $content->unitType ) { $size = __( 'Responsive', 'advanced-ads' ); }
		}
		return $size;
	}

	public function print_scripts() {
		global $pagenow, $post_type;
		if (
				('post-new.php' == $pagenow && Advanced_Ads::POST_TYPE_SLUG == $post_type) ||
				('post.php' == $pagenow && Advanced_Ads::POST_TYPE_SLUG == $post_type && isset($_GET['action']) && 'edit' == $_GET['action'])
		) {
			$db = Advanced_Ads_AdSense_Data::get_instance();
			$pub_id = $db->get_adsense_id();
			?>
			<script type="text/javascript">
				if ( 'undefined' == typeof gadsenseData ) {
                    window.gadsenseData = {};
                }
                gadsenseData['pagenow'] = '<?php echo $pagenow ?>';
			</script>
			<?php
		}
	}

	public function enqueue_scripts() {
		global $gadsense_globals, $pagenow, $post_type;
		$screen = get_current_screen();
		$plugin = Advanced_Ads_Admin::get_instance();
        
        if ( Advanced_Ads_Admin::screen_belongs_to_advanced_ads() ) {
            self::enqueue_connect_adsense();
        }
		if (
				('post-new.php' == $pagenow && Advanced_Ads::POST_TYPE_SLUG == $post_type) ||
				('post.php' == $pagenow && Advanced_Ads::POST_TYPE_SLUG == $post_type && isset($_GET['action']) && 'edit' == $_GET['action'])
		) {
			$scripts = array();

			// Allow modifications of script files to enqueue
			$scripts = apply_filters( 'advanced-ads-gadsense-ad-param-script', $scripts );

			foreach ( $scripts as $handle => $value ) {
				if ( empty($handle) ) {
					continue;
				}
				if ( ! empty($handle) && empty($value) ) {
					// Allow inclusion of WordPress's built-in script like jQuery
					wp_enqueue_script( $handle );
				} else {
					if ( ! isset($value['version']) ) { $value['version'] = null; }
					wp_enqueue_script( $handle, $value['path'], $value['dep'], $value['version'] );
				}
			}

			$styles = array();

			// Allow modifications of default style files to enqueue
			$styles = apply_filters( 'advanced-ads-gadsense-ad-param-style', $styles );

			foreach ( $styles as $handle => $value ) {
				if ( ! isset($value['path']) ||
						! isset($value['dep']) ||
						empty($handle)
				) {
					continue;
				}
				if ( ! isset($value['version']) ) {
					$value['version'] = null; }
				wp_enqueue_style( $handle, $value['path'], $value['dep'], $value['version'] );
			}
		}
	}

	public static function get_instance() {
		if ( null == self::$instance ) {
			self::$instance = new self;
		}
		return self::$instance;
	}
	
	/**
	 * show AdSense ad specific notices in parameters box
	 * 
	 * @since 1.7.22
	 */
	public function ad_notices( $notices, $box, $post ){
	    
	    $ad = new Advanced_Ads_Ad( $post->ID );
	    
	    // $content = json_decode( stripslashes( $ad->content ) );
	    
	    switch ($box['id']){
		case 'ad-parameters-box' :
			// add warning if this is a responsive ad unit without custom sizes and position is set to left or right
			// hidden by default and made visible with JS
			$notices[] = array(
				'text' => sprintf(__( 'Responsive AdSense ads don’t work reliably with <em>Position</em> set to left or right. Either switch the <em>Type</em> to "normal" or follow <a href="%s" target="_blank">this tutorial</a> if you want the ad to be wrapped in text.', 'advanced-ads' ), ADVADS_URL . 'adsense-responsive-custom-sizes/#utm_source=advanced-ads&utm_medium=link&utm_campaign=adsense-custom-sizes-tutorial' ),
				'class' => 'advads-ad-notice-responsive-position error hidden',
			);
			// show hint about AdSense In-feed add-on
			if( ! class_exists( 'Advanced_Ads_In_Feed', false ) ){
				$notices[] = array(
					'text' => sprintf(__( '<a href="%s" target="_blank">Install the free AdSense In-feed add-on</a> in order to place ads between posts.', 'advanced-ads' ), wp_nonce_url(self_admin_url('update.php?action=install-plugin&plugin=' . 'advanced-ads-adsense-in-feed'), 'install-plugin_' . 'advanced-ads-adsense-in-feed') ),
					'class' => 'advads-ad-notice-in-feed-add-on hidden',
				);
			}
			// show message about Responsive add-on
			if ( ! defined( 'AAR_SLUG' ) ) {
			    $notices[] = array(
				'text' => sprintf( __( 'Use the <a href="%s" target="_blank">Responsive add-on</a> in order to define the exact size for each browser width or choose between horizontal, vertical, or rectangle formats.', 'advanced-ads' ), ADVADS_URL . 'add-ons/responsive-ads/#utm_source=advanced-ads&utm_medium=link&utm_campaign=edit-adsense' ),
				'class' => 'advads-ad-notice-responsive-add-on',
			    );
			}
			
			// show hint about Content ad, Link unit or Matched content being defined in AdSense account
			// disabled since it might no longer be needed with the new ad types
			/* if( 'adsense' === $ad->type ){
			    $notices[] = array(
				    'text' => sprintf( __( 'The type of your AdSense ad unit (content unit, link unit or matched content) needs to be defined in <a href="%s" target="_blank">your AdSense account</a>.', 'advanced-ads' ), 'https://www.google.com/adsense' ),
				    'class' => 'advads-ad-notice-adsense-ad-unit-type',
			    );
			}*/
		    break;
	    }
	    
	    
	    return $notices;
	}

    /**
     * Enqueue AdSense connection script.
     */
    public static function enqueue_connect_adsense() {
        if ( ! wp_script_is( 'advads/connect-adsense', $list = 'registered' ) ) {
            wp_enqueue_script( 'advads/connect-adsense', GADSENSE_BASE_URL . 'admin/assets/js/connect-adsense.js', array( 'jquery' ), '0.8' );
        }
        if ( ! has_action( 'admin_footer', array( 'Advanced_Ads_AdSense_Admin', 'print_connect_adsense' ) ) ) {
            add_action( 'admin_footer', array( 'Advanced_Ads_AdSense_Admin', 'print_connect_adsense' ) );
        }
    }
    
    /**
     * Prints AdSense connection markup.
     */
    public static function print_connect_adsense() {
        require_once GADSENSE_BASE_PATH . 'admin/views/connect-adsense.php';
    }
    
	/**
	 * Get Auto Ads messages.
	 */
	public static function get_auto_ads_messages() {
		return array(
			'enabled' => sprintf(__( 'The AdSense verification and Auto ads code is already activated in the <a href="%s">AdSense settings</a>.', 'advanced-ads' ), 
				admin_url( 'admin.php?page=advanced-ads-settings#top#adsense' ) )
		    . ' ' . __( 'No need to add the code manually here, unless you want to include it into certain pages only.', 'advanced-ads' ),
			'disabled' => sprintf( '%s <button id="adsense_enable_pla" type="button" class="button">%s</button>',
				sprintf ( __( 'The AdSense verification and Auto ads code should be set up in the <a href="%s">AdSense settings</a>. Click on the following button to enable it now.', 'advanced-ads' ), admin_url( 'admin.php?page=advanced-ads-settings#top#adsense' ) ),
				esc_attr__( 'Activate', 'advanced-ads' ) )
		);
	}

    /**
     * Get the ad selecto markup
     * 
     * @param type $hide_idle Whether to hide idle ads.
     */
    public static function get_mapi_ad_selector( $hide_idle_ads = true ) {
        global $closeable, $use_dashicons, $network, $ad_units, $display_slot_id;
        $closeable = true;
        $use_dashicons = false;
        $network = Advanced_Ads_Network_Adsense::get_instance();
        $ad_units = $network->get_external_ad_units();
        $display_slot_id = true;
        $pub_id = Advanced_Ads_AdSense_Data::get_instance()->get_adsense_id();

        require_once GADSENSE_BASE_PATH . 'admin/views/external-ads-list.php';
        // require_once GADSENSE_BASE_PATH . 'admin/views/external-ads-adsense.php';
    }
}
