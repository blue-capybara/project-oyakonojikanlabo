jQuery(function ($) {
	$(".openbtn1").click(function () {
		$(this).toggleClass('active');
		$("#g-nav").toggleClass('panelactive');
	});
	$("#g-nav a").click(function () {
		$(".openbtn1").removeClass('active');
		$("#g-nav").removeClass('panelactive');
	});
	$(function () {
		const ua = navigator.userAgent;
		if (ua.indexOf('iPhone') > -1 || (ua.indexOf('Android') > -1 && ua.indexOf('Mobile') > -1)) {
			$(".ads").css("display", "flex");
			$(".bottom-togglebtn").click(function () {
				$(".ads").slideToggle("fast");
				$(this).toggleClass('down');
			})
		} else if (ua.indexOf('iPad') > -1 || ua.indexOf('Android') > -1) {
			$(".bottom-togglebtn").click(function () {
				$(".ads").slideToggle("fast");
			})
		} else {
		}
	})

});
