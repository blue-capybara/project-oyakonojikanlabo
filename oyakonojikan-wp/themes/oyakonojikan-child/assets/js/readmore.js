let url = "https://oyako.oyakonojikanlabo.xyz/wp-content/themes/oyakonojikan-child/template-parts/ajax-item.php";
let postNumNow = 4;
let postNumAdd = 4;
let flag = false;
jQuery(document).on("click", ".entry-more", function () {
	if (!flag) {
		jQuery(".entry-more").addClass("is-hide");
		jQuery(".entry-loading").addClass("is-show");
		flag = true;
		jQuery.ajax({
			type: "POST",
			url: url,
			data: {
				post_num_now: postNumNow,
				post_num_add: postNumAdd
			},
			success: function (response) {
				data = JSON.parse(response);
				jQuery(".maincontents").append(data[0]);
				jQuery(".entry-loading").removeClass("is-show");
				if (data[1] > 0) {
					jQuery(".entry-more").removeClass("is-hide");
				}
				documentHeight = jQuery(document).height();
				postNumNow += postNumAdd;
				flag = false;
			}
		});
	}
});