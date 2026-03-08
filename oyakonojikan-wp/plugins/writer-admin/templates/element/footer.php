<script src="<?php echo WA_ASSETS_URL ?>bower_components/jquery/dist/jquery.min.js"></script>
<script src="<?php echo WA_ASSETS_URL ?>bower_components/jquery-ui/jquery-ui.min.js"></script>
<script src="<?php echo WA_ASSETS_URL ?>bower_components/bootstrap/dist/js/bootstrap.min.js"></script>
<script src="<?php echo WA_ASSETS_URL ?>bower_components/select2/dist/js/select2.full.min.js"></script>
<script src="<?php echo WA_ASSETS_URL ?>plugins/micro-template/micro-template.js"></script>
<script src="<?php echo WA_ASSETS_URL ?>plugins/write-scripts/js/writer-scripts.js"></script>
<script src="<?php echo WA_ASSETS_URL ?>plugins/iCheck/icheck.min.js"></script>
<script src="<?php echo WA_ASSETS_URL ?>dist/js/adminlte.min.js"></script>
<script>
	$(function () {
		$('.select2').select2();
		$('input').iCheck({
			checkboxClass: 'icheckbox_square-blue',
			radioClass: 'iradio_square-blue',
			increaseArea: '20%' // optional
		});
	});
</script>
<?php do_action( 'wa/footer' ) ?>
</body>
</html>