<?php

class WA_Content_Catch_2 extends WA_Content_Abstract {
	public $name = '子見出し';

	public function prepare( array &$contents, array $file_array ) {
		if ( ! IWF_Validation::not_empty( $contents['data'] ) ) {
			$contents['error'] = '必須入力です。';
		}
	}

	public function get_html( array $contents ) {
		ob_start();
		?>
		<h3><?php echo $contents['data'] ?></h3>
		<?php
		return ob_get_clean();
	}

	public function get_template() {
		ob_start();
		?>
		<script type="application/x-template" id="tmpl-catch-2">
			<div class="editable-content__item">
				<div class="editable-content__number"></div>
				<div class="editable-content__body">
					<div class="editable-content__title">
						<div class="editable-content__title-text">子見出し</div>
						<ul class="editable-content__controller">
							<li class="editable-content__controller-item"><a href="" class="move-top"></a></li>
							<li class="editable-content__controller-item"><a href="" class="move-bottom"></a></li>
							<li class="editable-content__controller-item"><a href="" class="destroy"></a></li>
						</ul>
					</div>
					<dl class="field-list">
						<dd class="field-list__content"><input type="text" name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][data]" value="<%= value || '' %>">
							<% if (error) { %>
							<p class="field-list__help -error"><%= error %></p>
							<% } %>
						</dd>
					</dl>
					<input type="hidden" name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][order]" class="order-number" value="<%= i %>">
					<input type="hidden" name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][type]" value="catch-2">
				</div>
			</div>
		</script>
		<?php
		return ob_get_clean();
	}
}