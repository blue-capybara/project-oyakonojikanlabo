<?php

class WA_Content_Image extends WA_Content_Abstract {
	public $name = '画像';

	public function prepare( array &$contents, array $file_array ) {
		if ( ! empty( $file_array ) ) {
			if ( empty( $file_array['data']['image']['tmp_name'] ) && ! empty( $contents['data']['image_id'] ) ) {
				$attachment = get_post( $contents['data']['image_id'] );

				if ( $attachment && $attachment->post_type === 'attachment' && $attachment->post_author == get_current_user_id() ) {
					$contents['data']['image_file'] = get_attached_file( $contents['data']['image_id'] );
					$contents['data']['image_url']  = wp_get_attachment_url( $attachment->ID );
				}
			}

			if ( ! empty( $file_array['data']['image']['tmp_name'] ) ) {
				$result = WA_Post::upload_file( $file_array['data']['image'], array(
					'allowed_types'   => WA::get_config( 'form.image_types' ),
					'max_upload_size' => WA::get_config( 'form.max_file_size' ),
				) );

				if ( is_wp_error( $result ) ) {
					$contents['error']['image'] = $result->get_error_message();

				} else {
					$contents['data']['image_file'] = $result['file'];
					$contents['data']['image_url']  = $result['url'];
					$contents['data']['image_id']   = '';
				}

			} else if ( ! empty( $contents['data']['image_file'] ) ) {
				if ( ! is_file( $contents['data']['image_file'] ) ) {
					$contents['error']['image'] = 'ファイルアップロードに失敗しました。';

				} else if ( ! WA_Post::check_allowed_types( $contents['data']['image_file'], WA::get_config( 'form.image_types' ) ) ) {
					$contents['error']['image'] = 'ファイルは [' . implode( '] [', WA::get_config( 'form.image_types' ) ) . '] の何れかでアップロードしてください。';
				}

			} else {
				$contents['data']['image']  = '';
				$contents['error']['image'] = '必須入力です。';
			}
		}

		if ( IWF_Validation::not_empty( $contents['data']['site_url'] ) && ! IWF_Validation::valid_url( $contents['data']['site_url'] ) ) {
			$contents['error']['site_url'] = '正しいURLの形式で入力して下さい。';
		}
	}

	public function get_html( array $contents ) {
		ob_start();
		?>
		<div class="wp-caption">
			<img src="<?php echo $contents['data']['image_url'] ?>" alt="">
			<?php
			if ( $contents['data']['site_url'] ) {
				?>
				<p class="wp-caption-text">
					<a href="<?php echo $contents['data']['site_url'] ?>" target="_blank"><?php echo $contents['data']['site_name'] ?: $contents['data']['site_url'] ?></a>
				</p>
				<?php
			} else if ( $contents['data']['site_name'] ) {
				?>
				<p class="wp-caption-text">
					<?php echo $contents['data']['site_name'] ?>
				</p>
				<?php
			}
			?>
		</div>
		<?php
		return ob_get_clean();
	}

	public function get_template() {
		ob_start();
		?>
		<script type="application/x-template" id="tmpl-image">
			<div class="editable-content__item">
				<div class="editable-content__number"></div>
				<div class="editable-content__body">
					<div class="editable-content__title">
						<div class="editable-content__title-text">画像</div>
						<ul class="editable-content__controller">
							<li class="editable-content__controller-item"><a href="" class="move-top"></a></li>
							<li class="editable-content__controller-item"><a href="" class="move-bottom"></a></li>
							<li class="editable-content__controller-item"><a href="" class="destroy"></a></li>
						</ul>
					</div>
					<dl class="field-list">
						<dt class="field-list__title">画像</dt>
						<% if (value.image_file) { %>
						<dd class="field-list__content"><img src="<%=raw value.image_url %>" alt="" width="150"></dd>
						<input type="hidden" name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][data][image_url]" value="<%=raw value.image_url %>">
						<input type="hidden" name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][data][image_file]" value="<%=raw value.image_file %>">
						<input type="hidden" name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][data][image_id]" value="<%=raw value.image_id %>">
						<% } %>
						<dd class="field-list__content"><input name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][data][image]" data-name="image" type="file">
							<% if (error.image) { %>
							<p class="field-list__help -error"><%= error.image %></p>
							<% } %>
						</dd>
						<dt class="field-list__title">引用元名称</dt>
						<dd class="field-list__content"><input name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][data][site_name]" data-name="site_name" type="text" value="<%= value.site_name || '' %>">
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
					<input type="hidden" name="<?php echo WA_Content::get_field_key( true ) ?>[<%= i %>][type]" value="image">
				</div>
			</div>
		</script>
		<?php
		return ob_get_clean();
	}
}