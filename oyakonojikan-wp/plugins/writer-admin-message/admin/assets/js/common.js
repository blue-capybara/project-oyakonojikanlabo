(function ($) {
	$(function () {
		$('.wa-msg__item').click(function () {
			$(this).toggleClass('-collapsed');
		});

		$('.wa-msg__item a').click(function (e) {
			e.stopPropagation();
		});

		$('.js-select-writer').select2({
			allowClear: true,
			ajax: {
				url: ajaxurl,
				delay: 500,
				dataType: "json",
				data: function (params) {
					return {
						action: 'wa_user_get_writers',
						term: params.term
					}
				}
			}
		});
	});
})(jQuery);