<?php
class Advanced_Ads_Network_Adsense extends Advanced_Ads_Ad_Network{
    /**
     * @var array an array containing all the AdSense status codes that flag an {$link Advanced_Ads_Ad_Network_Ad_Unit} ad unit as active
     * for downward compatibility with PHP < 5.6 the const had to be changed to static field. you can revert to const when PHP5 support is FINALLY dropped
     */
//    const STATUS_CODES_ACTIVE = array("ACTIVE", "NEW");
    private static $STATUS_CODES_ACTIVE = array("ACTIVE", "NEW");

    /**
     * @var Advanced_Ads_Ad_Type_Adsense a globally usable instance, that will be created when calling {$link Advanced_Ads_Ad_Network#get_instance) for the first time
     */
    private static $instance;

    public static final function get_instance(){
        if (! self::$instance) self::$instance = new Advanced_Ads_Network_Adsense();
        return self::$instance;
    }

    public function __construct()
    {
        parent::__construct('adsense', 'AdSense');
        $this->data = Advanced_Ads_AdSense_Data::get_instance();

        //adsense does not use the default generated settings section id. overwrite it with the old value.
        $this->settings_section_id = 'advanced_ads_adsense_setting_section';
    }

    protected function register_settings($hook, $section_id)
    {
        // add setting field to disable ads
        add_settings_field(
            'adsense-id',
            __( 'AdSense account', 'advanced-ads' ),
            array($this, 'render_settings_adsense_id'),
            $hook,
            $section_id
        );

        // activate AdSense verification code and Auto ads (previously Page-Level ads)
        add_settings_field(
            'adsense-page-level',
            __( 'Verification code & Auto ads', 'advanced-ads' ),
            array($this, 'render_settings_adsense_page_level'),
            $hook,
            $section_id
        );

		// AdSense anchor ad on top of pages.
		// Only show this field if selected, otherwise use new auto ads code.
		if ( isset( $this->data->get_options()['top-anchor-ad'] ) ) {
			add_settings_field(
				'top_anchor_ad',
				__( 'Auto ads', 'advanced-ads' ) . ':&nbsp;' . __( 'Disable top anchor ad', 'advanced-ads' ),
				array( $this, 'render_settings_adsense_top_anchor_ad' ),
				$hook,
				$section_id
			);
		}

        // hide AdSense stats in the backend
        add_settings_field(
            'hide_stats',
            __( 'Disable stats', 'advanced-ads' ),
            array( $this, 'render_settings_adsense_hide_stats' ),
            $hook,
            $section_id
        );

        // add setting field for adsense limit
        // deprecated of January, 2019; will be removed one year later
        $limit_per_page = $this->data->get_limit_per_page();
        if( $limit_per_page ){
            add_settings_field(
                'adsense-limit',
                __( 'Limit to 3 ads', 'advanced-ads' ),
                array($this, 'render_settings_adsense_limit'),
                $hook,
                $section_id
            );
        };

        // disable AdSense violation warnings
        add_settings_field(
            'adsense-warnings-disable',
            __( 'Disable violation warnings', 'advanced-ads' ),
            array($this, 'render_settings_adsense_warnings_disable'),
            $hook,
            $section_id
        );

        add_settings_field(
            'adsense-background',
            __( 'Transparent background', 'advanced-ads' ),
            array( $this, 'render_settings_adsense_background' ),
            $hook,
            $section_id
        );

        add_settings_field(
            'adsense-full-width',
            __( 'Full width responsive ads on mobile', 'advanced-ads' ),
            array( $this, 'render_settings_adsense_fullwidth' ),
            $hook,
            'advanced_ads_adsense_setting_section'
        );
    }



    /**
     * render AdSense settings section
     *
     * @since 1.5.1
     */
    public function render_settings_section_callback(){
        // for whatever purpose there might come
    }

    /**
     * render AdSense management api setting
     */
    public function render_settings_management_api() {
        require_once GADSENSE_BASE_PATH . 'admin/views/mapi-settings.php';
    }

    /**
     * render AdSense id setting
     *
     * @since 1.5.1
     */
    public function render_settings_adsense_id(){
        require_once GADSENSE_BASE_PATH . 'admin/views/adsense-account.php';
    }

    /**
     * render AdSense limit setting
     *
     * @since 1.5.1
     * @deprecated January, 2019 – let’s give users one year until we remove the whole logic completely
     */
    public function render_settings_adsense_limit(){
        $limit_per_page = $this->data->get_limit_per_page();

        ?><label><input type="checkbox" name="<?php echo GADSENSE_OPT_NAME; ?>[limit-per-page]" value="1" <?php checked( $limit_per_page ); ?> />
        <?php printf( __( 'Limit to %d AdSense ads', 'advanced-ads' ), 3 ); ?></label>
        <p class="description">
            <?php
            printf(
                __( 'There is no explicit limit for AdSense ads anymore, but you can still use this setting to prevent too many AdSense ads to show accidentally on your site.', 'advanced-ads' ),
                esc_url( 'https://www.google.com/adsense/terms' )
            ); ?></p>
        <?php if( defined( 'AAP_VERSION' ) ) : /* give warning when cache-busting in Pro is active */ ?>
            <p class="advads-error-message"><?php _e( 'Due to technical restrictions, the limit does not work on placements with cache-busting enabled.', 'advanced-ads' ); ?></p>
        <?php endif;
    }

    /**
     * Render top anchor ad setting
     */
    public function render_settings_adsense_top_anchor_ad() {
        $options = $this->data->get_options();
        $anchor_ad = isset( $options['top-anchor-ad'] )? $options['top-anchor-ad'] : ''; ?>
        <label>
            <input type="checkbox" name="<?php echo GADSENSE_OPT_NAME; ?>[top-anchor-ad]" value="1" <?php checked( $anchor_ad ); ?> />
            <?php esc_html_e( 'Enable this box if you don’t want Google Auto ads to place anchor ads at the top of your page.', 'advanced-ads' ); ?>
        </label>
        <?php
    }

    /**
     * Render setting to hide AdSense stats showing in the backend
     */
    public function render_settings_adsense_hide_stats() {
        $options = $this->data->get_options();
        $hide_stats = isset( $options['hide-stats'] )? true : false; ?>
        <label>
            <input type="checkbox" name="<?php echo GADSENSE_OPT_NAME; ?>[hide-stats]" value="1" <?php checked( $hide_stats ); ?> />
            <?php esc_html_e( 'Enable this option to stop loading stats from AdSense into your WordPress backend.', 'advanced-ads' ); ?>
        </label>
        <?php
    }

    /**
     * render page-level ads setting
     *
     * @since 1.6.9
     */
    public function render_settings_adsense_page_level(){
        $options = $this->data->get_options();
        $page_level = $options['page-level-enabled'];

        ?><label><input type="checkbox" name="<?php echo GADSENSE_OPT_NAME; ?>[page-level-enabled]" value="1" <?php checked( $page_level ); ?> />
        <?php esc_attr_e( 'Insert the AdSense header code used for verification and the Auto Ads feature.', 'advanced-ads' );
        if( !empty( $options['adsense-id'] ) ) :
            ?>&nbsp;<a href="https://www.google.com/adsense/new/u/0/<?php echo $options['adsense-id']; ?>/myads/auto-ads" target="_blank"><?php /**
             * translators: this is the text for a link to a sub-page in an AdSense account
             */
            esc_attr_e( 'Adjust Auto ads options', 'advanced-ads' ); ?></a>
        <?php endif; ?>
        </label><p class="description"><?php printf(__( 'Please read <a href="%s" target="_blank">this article</a> if <strong>ads appear in random places</strong>.', 'advanced-ads' ), ADVADS_URL . 'adsense-in-random-positions-auto-ads/#utm_source=advanced-ads&utm_medium=link&utm_campaign=backend-autoads-ads' ); ?></p>
        <p class="description"><a href="<?php echo ADVADS_URL . 'adsense-auto-ads-wordpress/#Display_Auto_Ads_only_on_specific_pages'; ?>" target="_blank"><?php esc_attr_e( 'Display Auto ads only on specific pages', 'advanced-ads' ); ?></a></p>
        <p class="description"><a href="<?php echo ADVADS_URL . 'adsense-auto-ads-wordpress/#AMP_Auto_Ads'; ?>" target="_blank"><?php esc_attr_e( 'Auto ads on AMP pages', 'advanced-ads' ); ?></a></p><?php
    }

    /**
     * render AdSense violation warnings setting
     *
     * @since 1.6.9
     */
    public function render_settings_adsense_warnings_disable(){
        $options = $this->data->get_options();
        $disable_violation_warnings = isset( $options['violation-warnings-disable'] ) ? 1 : 0;

        ?><label><input type="checkbox" name="<?php echo GADSENSE_OPT_NAME; ?>[violation-warnings-disable]" value="1" <?php checked( 1, $disable_violation_warnings ); ?> />
        <?php _e( 'Disable warnings about potential violations of the AdSense terms.', 'advanced-ads' ); ?></label>
        <p class="description"><?php printf(__( 'Our <a href="%s" target="_blank">Ad Health</a> feature monitors if AdSense is implemented correctly on your site. It also considers ads not managed with Advanced Ads. Enable this option to remove these checks', 'advanced-ads' ), ADVADS_URL . 'manual/ad-health/#utm_source=advanced-ads&utm_medium=link&utm_campaign=backend-autoads-ads' ); ?></p><?php
    }

    /**
     * Render transparent background setting.
     */
    public function render_settings_adsense_background() {
        $options = $this->data->get_options();
        $background = $options['background'];

        ?><label><input type="checkbox" name="<?php echo GADSENSE_OPT_NAME; ?>[background]" value="1" <?php checked( $background ); ?> />
        <?php _e( 'Enable this option in case your theme adds an unfortunate background color to AdSense ads.', 'advanced-ads' ); ?></label><?php
    }

    /**
     * Render full width ads setting.
     */
    public function render_settings_adsense_fullwidth() {
        $options = $this->data->get_options();
        $fw = !empty( $options['fullwidth-ads'] ) ? $options['fullwidth-ads'] : 'default';
        ?>
        <select name="<?php echo GADSENSE_OPT_NAME; ?>[fullwidth-ads]">
            <option value="default" <?php selected( $fw, 'default' ); ?>><?php esc_html_e( 'default', 'advanced-ads' ) ?></option>
            <option value="enable" <?php selected( $fw, 'enable' ); ?>><?php esc_html_e( 'enable', 'advanced-ads' ) ?></option>
            <option value="disable" <?php selected( $fw, 'disable' ); ?>><?php esc_html_e( 'disable', 'advanced-ads' ) ?></option>
        </select>
        <p class="description"><?php
            echo wp_kses(
                sprintf(
                    __( "Whether your responsive ad unit may expand to <a href='%s' target='blank'>use the full width</a> of your visitor's mobile device screen", 'advanced-ads' ),
                    esc_url( 'https://support.google.com/adsense/answer/7445870' )
                ),
                array( 'a' => array( 'href' => true, 'target' => true ) )
            ); ?></p>
        <?php
    }

    /**
     * sanitize AdSense settings
     *
     * @since 1.5.1
     * @param array $options all the options
     */
    protected function sanitize_settings($options){
        // sanitize whatever option one wants to sanitize
        if(isset($options['adsense-id']) && $options['adsense-id'] != ''){
            // remove "ca-" prefix if it was added by the user
            if( 0 === strpos( $options['adsense-id'], 'ca-' ) ){
                $options['adsense-id'] = str_replace( 'ca-', '', $options['adsense-id'] );
            }

            // trim publisher id
            $options['adsense-id'] = trim($options['adsense-id']);
        }
        return $options;
    }

    /**
     * sanitize ad settings
     *  save publisher id from new ad unit if not given in main options
     *
     * @since 1.6.2
     * @param arr $ad_settings_post
     * @return arr $ad_settings_post
     */
    public function sanitize_ad_settings( $ad_settings_post ){
        // check ad type
        if( ! isset( $ad_settings_post['type'] ) ||  'adsense' !== $ad_settings_post['type'] ){
            return $ad_settings_post;
        }

        // save AdSense publisher ID if there is no one stored yet
        if ( ! empty($ad_settings_post['output']['adsense-pub-id']) ) {
            // get options
            $adsense_options = get_option( 'advanced-ads-adsense', array() );

            if ( empty( $adsense_options['adsense-id'] ) ) {
                $adsense_options['adsense-id'] = $ad_settings_post['output']['adsense-pub-id'];
                update_option( 'advanced-ads-adsense', $adsense_options );
            }
        }
        unset( $ad_settings_post['output']['adsense-pub-id'] );
        return $ad_settings_post;
    }

    public function get_ad_type()
    {
        return new Advanced_Ads_Ad_Type_Adsense();
    }

    public function get_external_ad_units()
    {
        $db = Advanced_Ads_AdSense_Data::get_instance();
        $adsense_id = trim( $db->get_adsense_id() );

        $units = array();
        $mapi_options = Advanced_Ads_AdSense_MAPI::get_option();

        if (isset($mapi_options['ad_codes'])
                && isset($mapi_options['accounts'])
                && isset($mapi_options['accounts'][$adsense_id])
                && isset($mapi_options['accounts'][$adsense_id]['ad_units'])){
            $ad_codes = $mapi_options['ad_codes'];
            foreach ($mapi_options['accounts'][$adsense_id]['ad_units'] as $id => $raw){
                $ad_unit = new Advanced_Ads_Ad_Network_Ad_Unit($raw);
                $ad_unit->id = $id;
                $ad_unit->slot_id = isset($raw['code']) ? $raw['code'] : '-';
                $ad_unit->name = isset($raw['name']) ? $raw['name'] : '-';
                $ad_unit->active = isset($raw['status']) && in_array($raw['status'], self::$STATUS_CODES_ACTIVE);

                if (isset($ad_codes[$id])) {
                    $ad_unit->code = $ad_codes[$id];
                }
                if (isset ($raw['contentAdsSettings'])){
					if ( isset( $raw['contentAdsSettings']['type'] ) ) {
						$ad_unit->display_type = $raw['contentAdsSettings']['type'];
						$ad_unit->display_type = Advanced_Ads_AdSense_MAPI::format_ad_data( $ad_unit, 'type' );
					}
					if ( isset( $raw['contentAdsSettings']['size'] ) ) {
						$ad_unit->display_size = $raw['contentAdsSettings']['size'];
						$ad_unit->display_size = Advanced_Ads_AdSense_MAPI::format_ad_data( $ad_unit, 'size' );
					}
                }
                $units[] = $ad_unit;
            }
        }
        return $units;
    }

    public function print_external_ads_list($hide_idle_ads = true, $ad_unit_id = null)
    {
        Advanced_Ads_AdSense_Admin::get_mapi_ad_selector($hide_idle_ads);
    }

	public function is_supported( $ad_unit ) {
		$mapi_options = Advanced_Ads_AdSense_MAPI::get_option();
		$supported    = ! array_key_exists( $ad_unit->id, $mapi_options['unsupported_units'] );
		if ( ! $supported ) {
			$supported = array_key_exists( $ad_unit->id, $mapi_options['ad_codes'] );
		}

		return $supported;
	}

    public function update_external_ad_units()
    {
        Advanced_Ads_AdSense_MAPI::get_instance()->ajax_get_adUnits();
    }

    public function is_account_connected()
    {
        return Advanced_Ads_AdSense_Data::get_instance()->is_setup();
    }

    public function get_javascript_base_path()
    {
        return GADSENSE_BASE_URL . 'admin/assets/js/adsense.js';
    }

	/**
	 * @inheritDoc
	 */
	public function append_javascript_data( &$data ) {
		$pub_id            = Advanced_Ads_AdSense_Data::get_instance()->get_adsense_id();
		$data['pubId']     = $pub_id;
		$data['connected'] = $this->is_account_connected();
		$data['ad_types']  = array(
			'matched_content' => _x( 'Matched Content', 'AdSense ad type', 'advanced-ads' ),
			'in_article'      => _x( 'In-article', 'AdSense ad type', 'advanced-ads' ),
			'in_feed'         => _x( 'In-feed', 'AdSense ad type', 'advanced-ads' ),
			'display'         => _x( 'Display', 'AdSense ad type', 'advanced-ads' ),
			'link'            => _x( 'Link', 'AdSense ad type', 'advanced-ads' ),
		);

		return $data;
	}

    public function supports_manual_ad_setup()
    {
        return true;
    }
}
