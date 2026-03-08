<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title><?php wp_title( '|', true, 'right' ) ?><?php bloginfo( 'name' ) ?></title>
<meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
<link rel="stylesheet" href="<?php echo WA_ASSETS_URL ?>bower_components/bootstrap/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="<?php echo WA_ASSETS_URL ?>bower_components/font-awesome/css/font-awesome.min.css">
<link rel="stylesheet" href="<?php echo WA_ASSETS_URL ?>bower_components/Ionicons/css/ionicons.min.css">
<link rel="stylesheet" href="<?php echo WA_ASSETS_URL ?>bower_components/select2/dist/css/select2.min.css">
<link rel="stylesheet" href="<?php echo WA_ASSETS_URL ?>plugins/write-scripts/css/writer-script.css">
<link rel="stylesheet" href="<?php echo WA_ASSETS_URL ?>plugins/iCheck/square/blue.css">
<link rel="stylesheet" href="<?php echo WA_ASSETS_URL ?>dist/css/skins/skin-black-light.min.css">
<link rel="stylesheet" href="<?php echo WA_ASSETS_URL ?>dist/css/AdminLTE.min.css">
<!-- Google Font -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700,300italic,400italic,600italic">
<?php do_action( 'wa/header' ) ?>
</head>
<body class="<?php echo apply_filters( 'wa/body_class', '' ) ?>">