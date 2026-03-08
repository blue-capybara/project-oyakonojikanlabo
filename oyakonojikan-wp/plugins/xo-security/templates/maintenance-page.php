<?php
/**
 * Maintenance page template.
 *
 * @package xo-security
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<!DOCTYPE html>
<html lang="<?php echo esc_attr( get_bloginfo( 'language' ) ); ?>">
<head>
	<meta charset="<?php echo esc_attr( get_bloginfo( 'charset' ) ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title><?php echo esc_html( get_bloginfo( 'name' ) ); ?></title>
	<style>
		#page{ padding: 20px; }
		.align-center { text-align: center; }
	</style>
</head>
<body class="maintenance">
	<div id="page" class="site">
		<header>
			<h1 class="align-center"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></h1>
		</header>
		<div id="content" class="site-content align-center">
			<h2 class="headline"><?php echo esc_html( __( 'Under maintenance', 'xo-security' ) ); ?></h2>
			<div class="description">
				<p><?php echo esc_html( __( 'Currently in maintenance. please wait a moment.', 'xo-security' ) ); ?></p>
			</div>
		</div>
	</div>
</body>
</html>
