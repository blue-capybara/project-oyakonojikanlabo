<?php

class WA_Content_Pinterest extends WA_Content_Abstract {
	public $name = 'Pinterest';

	public function prepare( array &$contents, array $file_array ) {
		if ( ! IWF_Validation::not_empty( $contents['data'] ) ) {
			$contents['error'] = '必須入力です。';

		} else if ( ! preg_match( '#https?://.+?\.pinterest\.(?:com|jp)/pin/[\d]+?/?#i', $contents['data'] ) ) {
			$contents['error'] = '正しいピンのURLを入力してください。';
		}
	}

	public function get_html( array $contents ) {
		ob_start();
		?>
		<div class="pinterest">
			<a href="<?php echo $contents['url'] ?>" data-pin-do="embedPin" data-pin-lang="ja" data-pin-width="large"></a>
		</div>
		<?php
		return ob_get_clean();
	}

	public function get_template() {
		ob_start();
		?>
		<script type="application/x-template" id="tmpl-pinterest">
			<div class="editable-content__item">
				<div class="editable-content__number"></div>
				<div class="editable-content__body">
					<div class="editable-content__title">
						<div class="editable-content__title-text">Pinterest</div>
						<ul class="editable-content__controller">
							<li class="editable-content__controller-item"><a href="" class="move-top"></a></li>
							<li class="editable-content__controller-item"><a href="" class="move-bottom"></a></li>
							<li class="editable-content__controller-item"><a href="" class="destroy"></a></li>
						</ul>
					</div>
					<dl class="field-list">
						<dd class="field-list__content"><input name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][data]" type="text" value="<%= value || '' %>" placeholder="ピンのURLを貼り付けてください。">
							<% if (error) { %>
							<p class="field-list__help -error"><%= error %></p>
							<% } %>
						</dd>
					</dl>
					<input type="hidden" name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][order]" class="order-number" value="<%= i %>">
					<input type="hidden" name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][type]" value="pinterest">
				</div>
			</div>
		</script>
		<?php
		return ob_get_clean();
	}
}