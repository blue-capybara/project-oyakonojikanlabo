=== XO Security ===
Contributors: ishitaka
Tags: security, login, two factor, brute force, maintenance
Requires at least: 4.9
Tested up to: 6.8
Requires PHP: 5.6
Stable tag: 3.10.4
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

XO Security is a plugin to enhance login related security.

== Description ==

XO Security is a plugin to enhance login related security.
This plugin does not write to .htaccess file. Besides Apache, LiteSpeed, Nginx and IIS also work.

= Functions =

* Record login log.
* Limit login attempts.
* Add Captcha to the login form and comment form.
* Change the URL of the login page.
* Enable two-factor authentication (2FA) for login.
* Login Alert.
* Disable login by mail address.
* Disable login by user name.
* Change login error message.
* Disable XML-RPC and XML-RPC Pingback.
* Disable REST API.
* Disable author archive page.
* Remove comment author class of comments list.
* Remove the username from the oEmbed response data.
* WooCommerce login page protection.
* Anti-spam comment.
* Hide WordPress version information.
* Edit the author slug.
* Disable RSS and Atom feeds.
* Activate maintenance mode.
* Delete the readme.html file.

= WordPress multisite considerations =

If you set the login page separately for the main site and the subsite, you will not be able to use the password loss function of the subsite. We recommend that you set the login page to be common to all sites.

== Installation ==

1. Upload the `XO-Security` folder to the `/wp-content/plugins/` directory.
2. Activate the plugin through the Plugins menu in WordPress.
3. Go to "Settings" -> "XO Security" and customize behaviour as needed.

== Screenshots ==

1. Login log page.
2. Status page.
3. Login setting page.
4. Profile page.

== Frequently Asked Questions ==

= Login page is not displayed. =

Please initialize the settings.

* In wp_options table, the value of the option_name field (column) is to remove the record of "xo_security_options".
* If you have set the login page, please delete the file.

= The CAPTCHA is not displayed. =

Please install mbstring and GD module.

== Changelog ==

= 3.10.4 =

* Supported WordPress 6.6.

= 3.10.3 =

* Supported CAPTCHA for login form using ajax.

= 3.10.2 =

* Fixed a mistake in version 3.10.1.

= 3.10.1 =

* Fixed a bug that sometimes prevented login with two-factor authentication.
* Enhanced the judgment of comment bots.

= 3.10.0 =

* Added option to change author base.
* Added option to select CAPTCHA type.
* Enhanced the judgment of comment bots.

= 3.9.1 =

* Fixed a bug where an error message was displayed on the admin screen in PHP 8.2 or higher.

= 3.9.0 =

* Added two-factor authentication function.
* Fixed a bug where the login page file created by changing the login page may not be deleted during uninstallation.
* The REST API URL change feature has been deprecated. If it is currently in use, you can continue to use it, but you cannot use it newly.

= 3.8.1 =

* Supported WordPress 6.5.
* Added ability to delete readme.html file.
* Tweaked wording on the admin page.
* Tweaked CSS on the admin page.

= 3.8.0 =

* Added maintenance mode.

--------

[See the previous changelogs here](https://xakuro.com/wordpress/xo-security/#changelog)
