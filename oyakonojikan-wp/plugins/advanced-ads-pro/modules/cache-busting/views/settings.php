<?php
$options = Advanced_Ads_Pro::get_instance()->get_options();
$module_enabled = isset( $options['cache-busting']['enabled'] ) && $options['cache-busting']['enabled'];
$method = ( $module_enabled &&
	( ! isset( $options['cache-busting']['default_auto_method'] ) || $options['cache-busting']['default_auto_method'] === 'ajax' ) 
) ? 'ajax' : 'passive';
$fallback_method = ! empty( $options['cache-busting']['default_fallback_method'] ) ? $options['cache-busting']['default_fallback_method'] : 'ajax';
$passive_all = ! empty( $options['cache-busting']['passive_all'] );
$vc_cache_reset = ! empty( $options['cache-busting']['vc_cache_reset'] ) ? absint( $options['cache-busting']['vc_cache_reset'] ) : 0;
$vc_cache_reset_on_login = ! empty( $options['cache-busting']['vc_cache_reset_actions']['login'] );
?>
<input name="<?php echo Advanced_Ads_Pro::OPTION_KEY; ?>[cache-busting][enabled]" id="advanced-ads-pro-cache-busting-enabled" type="checkbox" value="1" <?php checked( $module_enabled ); ?> />
<label for="advanced-ads-pro-cache-busting-enabled" class="description"><?php _e( 'Activate <em>cache busting</em> module.', 'advanced-ads-pro' ); ?></label>

<div style="display: <?php echo $module_enabled ? 'block' : 'none'; ?>;">

	<p class="description"><?php _e( 'Choose which method to use when cache-busting is set to “auto”.', 'advanced-ads-pro' ); ?></p>
	<label>
		<input name="<?php echo Advanced_Ads_Pro::OPTION_KEY; ?>[cache-busting][default_auto_method]" type="radio" value="passive" <?php
		checked( $method, 'passive' ); ?>/><?php _e( 'passive', 'advanced-ads-pro' ); ?>
	</label><br/>
	<label>
		<input name="<?php echo Advanced_Ads_Pro::OPTION_KEY; ?>[cache-busting][default_auto_method]" type="radio" value="ajax" <?php
		checked( $method, 'ajax' ); ?>/><?php _e( 'AJAX', 'advanced-ads-pro' ); ?>
	</label>

	<p class="description"><?php _e( 'Choose the fallback if “passive“ cache-busting is not possible.', 'advanced-ads-pro' ); ?></p>
	<label>
		<input name="<?php echo Advanced_Ads_Pro::OPTION_KEY; ?>[cache-busting][default_fallback_method]" type="radio" value="ajax" <?php
		checked( $fallback_method, 'ajax' ); ?>/><?php _e( 'Use AJAX', 'advanced-ads-pro' ); ?>
	</label><br/>
	<label>
		<input name="<?php echo Advanced_Ads_Pro::OPTION_KEY; ?>[cache-busting][default_fallback_method]" type="radio" value="disable" <?php
		checked( $fallback_method, 'disable' ); ?>/><?php _e( 'No cache-busting', 'advanced-ads-pro' ); ?>
	</label><br /><br />
	<label>
		<input name="<?php echo Advanced_Ads_Pro::OPTION_KEY; ?>[cache-busting][passive_all]" type="checkbox" value="1" <?php 
		checked( $passive_all, 1 ); ?> />
		<?php _e( 'Enable passive cache-busting for all ads and groups which are not delivered through a placement, if possible.', 'advanced-ads-pro' ); ?>
	</label><br /><br />

	<input id="advads-pro-vc-hash" name="<?php echo Advanced_Ads_Pro::OPTION_KEY; ?>[cache-busting][vc_cache_reset]" type="hidden" value="<?php
		echo esc_attr( $vc_cache_reset ); ?>" />
	<h4><?php _e( 'Visitor profile', 'advanced-ads-pro' ); ?></h4>
	<p class="description"><?php 
		_e( 'Advanced Ads stores some user information in the user’s browser to limit the number of AJAX requests for cache-busting.', 'advanced-ads-pro' );
		?>&nbsp;<?php
		printf(
			// translators: $1%s is an opening a tag; $2%s is the closing one
			__( 'Learn more about this %1$shere%2$s.', 'advanced-ads-pro' ), '<a href="'. ADVADS_URL . 'manual/cache-busting/?utm_source=advanced-ads&utm_medium=link&utm_campaign=visitor-profile#Visitor_profile'.'" target="_blank">', '</a>');
	?></p>
	<br/><button type="button" id="advads-pro-vc-hash-change" class="button-secondary"><?php _e( 'Update visitor profile', 'advanced-ads' ); ?></button>
	<p id="advads-pro-vc-hash-change-ok" class="advads-success-message" style="display:none;"><?php _e( 'Updated', 'advanced-ads-pro' ); ?>
	    <span class="description"><?php _e( 'You might need to update the page cache if you are using one.', 'advanced-ads-pro' ); ?></span>
	</p>
	<p id="advads-pro-vc-hash-change-error" class="advads-error-message" style="display:none;"><?php _e( 'An error occured', 'advanced-ads-pro' ); ?></p>
	    <input type="hidden" id="advads-pro-reset-vc-cache-nonce" value="<?php echo wp_create_nonce( 'advads-pro-reset-vc-cache-nonce' ); ?>" />
	<p><label>
		<input name="<?php echo Advanced_Ads_Pro::OPTION_KEY; ?>[cache-busting][vc_cache_reset_actions][login]" type="checkbox" value="1" <?php
	checked( $vc_cache_reset_on_login, 1 ); ?> />
		<?php _e( 'Update visitor profile when user logs in or out', 'advanced-ads-pro' ); ?>
	    </label></p>
</div>
<!--
<br/><p><?php printf(__( 'Please note that cache-busting only works through <a href="%s">placements</a>.', 'advanced-ads-pro' ), admin_url('admin.php?page=advanced-ads-placements') ); ?></p>-->
