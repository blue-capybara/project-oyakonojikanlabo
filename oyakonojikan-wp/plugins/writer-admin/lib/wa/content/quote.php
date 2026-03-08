<?php

class WA_Content_Quote extends WA_Content_Abstract {
	public $name = '引用';

	public function prepare( array &$contents, array $file_array ) {
		if ( ! IWF_Validation::not_empty( $contents['data']['quote'] ) ) {
			$contents['error']['quote'] = '必須入力です。';
		}

		if ( IWF_Validation::not_empty( $contents['data']['site_url'] ) && ! IWF_Validation::valid_url( $contents['data']['site_url'] ) ) {
			$contents['error']['site_url'] = '正しいURLの形式で入力して下さい。';
		}
	}

	public function get_html( array $contents ) {
		ob_start();
		?>
		<blockquote>
			<p><?php echo nl2br( $contents['data']['quote'] ) ?></p>
			<?php
			if ( $contents['data']['site_url'] ) {
				?>
				<cite><a href="<?php echo $contents['data']['site_url'] ?>" target="_blank"><?php echo $contents['data']['site_name'] ?: $contents['data']['site_url'] ?></a></cite>
				<?php
			} else if ( $contents['data']['site_name'] ) {
				?>
				<cite><?php echo $contents['data']['site_name'] ?></cite>
				<?php
			}
			?>
		</blockquote>
		<?php
		return ob_get_clean();
	}

	public function get_template() {
		ob_start();
		?>
		<script type="application/x-template" id="tmpl-quote">
			<div class="editable-content__item">
				<div class="editable-content__number"></div>
				<div class="editable-content__body">
					<div class="editable-content__title">
						<div class="editable-content__title-text">引用</div>
						<ul class="editable-content__controller">
							<li class="editable-content__controller-item"><a href="" class="move-top"></a></li>
							<li class="editable-content__controller-item"><a href="" class="move-bottom"></a></li>
							<li class="editable-content__controller-item"><a href="" class="destroy"></a></li>
						</ul>
					</div>
					<dl class="field-list">
						<dt class="field-list__title">引用テキスト</dt>
						<dd class="field-list__content"><textarea name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][data][quote]" data-name="quote" rows="6"><%= value.quote || '' %></textarea>
							<% if (error.quote) { %>
							<p class="field-list__help -error"><%= error.quote %></p>
							<% } %>
						</dd>
						<dt class="field-list__title">引用元名称</dt>
						<dd class="field-list__content"><input name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][data][site_name]" data-name="site_url" type="text" value="<%= value.site_name || '' %>">
							<% if (error.site_name) { %>
							<p class="field-list__help -error"><%= error.site_name %></p>
							<% } %>
						</dd>
						<dt class="field-list__title">引用元URL</dt>
						<dd class="field-list__content"><input name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][data][site_url]" data-name="site_url" type="text" value="<%= value.site_url || '' %>">
							<% if (error.site_url) { %>
							<p class="field-list__help -error"><%= error.site_url %></p>
							<% } %>
						</dd>
					</dl>
					<input type="hidden" name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][order]" class="order-number" value="<%= i %>">
					<input type="hidden" name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][type]" value="quote">
				</div>
			</div>
		</script>
		<?php
		return ob_get_clean();
	}
}