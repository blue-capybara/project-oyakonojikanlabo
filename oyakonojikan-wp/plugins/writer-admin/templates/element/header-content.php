<?php
add_filter( 'wa/body_class', function () {
	return 'hold-transition skin-black-light sidebar-mini';
} )
?>
<?php include WA_TMPL_PATH . 'element/header.php' ?>
<div class="wrapper">
	<!-- Main Header -->
	<header class="main-header">
		<!-- Logo -->
		<a href="<?php echo WA_View::get_link( 'dashboard' ) ?>" class="logo">
			<!-- mini logo for sidebar mini 50x50 pixels -->
			<span class="logo-mini"><?php echo WA::get_config( 'title.short' ) ?></span>
			<!-- logo for regular state and mobile devices -->
			<span class="logo-lg"><?php echo WA::get_config( 'title.full' ) ?></span>
		</a>
		<!-- Header Navbar -->
		<nav class="navbar navbar-static-top" role="navigation">
			<!-- Sidebar toggle button-->
			<a href="#" class="sidebar-toggle" data-toggle="push-menu" role="button">
				<span class="sr-only">Toggle navigation</span>
			</a>
			<!-- Navbar Right Menu -->
			<div class="navbar-custom-menu">
				<ul class="nav navbar-nav">
					<!-- User Account Menu -->
					<li class="dropdown user">
						<!-- Menu Toggle Button -->
						<a href="#" class="dropdown-toggle" data-toggle="dropdown">
							<!-- hidden-xs hides the username on small devices so only the image appears. -->
							<span><?php echo WA_User::get_name() ?>さん <i class="fa fa-angle-down"></i></span>
						</a>
						<ul class="dropdown-menu" aria-labelledby="dropdownMenu1">
							<li><a href="<?php echo add_query_arg( 'wa_logout', 1 ) ?>">ログアウト</a></li>
							<li><a href="<?php echo WA_View::get_link( 'site' ) ?>" target="_blank">サイトを確認</a></li>
						</ul>
					</li>
				</ul>
			</div>
		</nav>
	</header>
	<!-- Left side column. contains the logo and sidebar -->
	<aside class="main-sidebar">
		<?php echo WA_View::get_sidebar() ?>
	</aside>
	<!-- Content Wrapper. Contains page content -->
	<div class="content-wrapper">
