(function ($) {
	'use strict';

	var ws;

	window.WriterScript = ws = function WriterScript(args) {
		var defaults = {
			formElm: 'form',
			wrapperClass: '.writer-form',
			listClass: '.editable-content',
			itemClass: '.editable-content__item',
			handleClass: '.editable-content__title-text',
			numberClass: '.editable-content__number',
			numberFormClass: '.order-number',
			blockSelectClass: '.editable-content__select',
			appendBtnClass: '.editable-content__append',
			reviewData: []
		};

		this.options = $.extend(true, {}, defaults, args);
		this.totalContent = 0;
		this.saved = true;

		var _ws = this;

		$(_ws.options.wrapperClass).on('change keyup', 'input, textarea, select', function () {
			_ws.saved = false;
		});

		$(_ws.options.formElm).on("submit", function () {
			_ws.saved = true;
		});

		$(window).on("beforeunload", function () {
			if (!_ws.saved) {
				return "編集内容がまだ保存されていません。";
			}
		});

		$(_ws.options.listClass).sortable({
			axis: 'y',
			handle: _ws.options.handleClass + ', ' + _ws.options.numberClass,
			cursor: 'move',
			forcePlaceholderSize: true,
			update: function () {
				_ws.reloadNumber();
			}

		}).on('click', _ws.options.itemClass + ' .destroy', function () {
			var $container = $(this).parents(_ws.options.itemClass);

			if (confirm('本当に削除してもよろしいですか？')) {
				$container.fadeOut(200, function () {
					$(this).remove();
					_ws.reloadNumber();
				});

				_ws.saved = false;
			}

			_ws.reloadNumber();

			return false;

		}).on('click', _ws.options.itemClass + ' .move-top', function () {
			var $container = $(this).parents(_ws.options.itemClass);
			$container.after($container.prev(_ws.options.itemClass));
			_ws.saved = false;

			_ws.reloadNumber();

			return false;

		}).on('click', _ws.options.itemClass + ' .move-bottom', function () {
			var $container = $(this).parents(_ws.options.itemClass);
			$container.before($container.next(_ws.options.itemClass));
			_ws.saved = false;

			_ws.reloadNumber();

			return false;
		});

		$(_ws.options.appendBtnClass).on('click', function () {
			var addContentType = $(_ws.options.blockSelectClass).find(':selected').val();

			if (addContentType) {
				_ws.addContent(addContentType);
				_ws.saved = false;
			}

			return false;
		});

		if ($.isArray(_ws.options.contents)) {
			$.each(_ws.options.contents, function (i, value) {
				_ws.addContent(value.type || 'text', value.data || '', value.error || '');
			});
		}
	};

	ws.prototype.addContent = function (addContentType, value, error) {
		var _ws = this;
		var templateId = 'tmpl-' + addContentType;

		if ($('#' + templateId).size()) {
			var $html = $(template(templateId, {i: _ws.totalContent, value: value || '', error: error || ''})).hide();

			$(_ws.options.listClass).append($html);
			$html.fadeIn(200);

			_ws.totalContent++;
			_ws.reloadNumber();
		}
	};

	ws.prototype.reloadNumber = function () {
		var _ws = this;

		$(_ws.options.listClass).find(_ws.options.itemClass).each(function () {
			var index = $(this).index();
			$(this).find(_ws.options.numberClass).html(index + 1);
			$(this).find(_ws.options.numberFormClass).val(index);
		});
	};
})(jQuery);