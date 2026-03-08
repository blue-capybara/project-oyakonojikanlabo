<?php
/**
 * Plugin Name: MW WP Form Generator
 * Plugin URI: http://plugins.2inc.org/mw-wp-form/
 * Description: Premium add-on of MW WP Form. This plugin add form generator gui in form creating page of MW WP Form. This plugin needs MW WP Form version 2.6.1 or later.
 * Version: 1.6.1
 * Author: Takashi Kitajima
 * Author URI: http://2inc.org
 * Text Domain: mw-wp-form-generator
 * Domain Path: /languages/
 * Created : November 6, 2014
 * Modified: November 6, 2019
 * License: GPLv2
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 */
class MW_WP_Form_Generator {

	/**
	 * NAME
	 */
	const NAME = 'mw-wp-form-generator';

	/**
	 * $form_fields
	 */
	protected $form_fields = array();

	/**
	 * $styles
	 */
	protected $styles = array();

	/**
	 * __construct
	 */
	public function __construct() {
		include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
		if ( is_plugin_active( 'mw-wp-form/mw-wp-form.php' ) ) {
			include_once( plugin_dir_path( __FILE__ ) . 'classes/class.template.php' );
			add_action( 'plugins_loaded' , array( $this, 'plugins_loaded' ) );
		}
	}

	/**
	 * plugins_loaded
	 */
	public function plugins_loaded() {
		load_plugin_textdomain( 'mw-wp-form-generator', false, basename( dirname( __FILE__ ) ) . '/languages' );

		if ( !class_exists( 'ATPU_Plugin' ) ) {
			include_once( plugin_dir_path( __FILE__ ) . 'modules/plugin-update.php' );
		}
		new ATPU_Plugin( 'http://plugins.2inc.org/mw-wp-form/api/', 'mw-wp-form-generator' );

		add_action( 'init', array( $this, 'remove_editor' ), 9999 );
		add_action( 'admin_menu', array( $this, 'add_form_generator' ) );
		add_filter( 'mwform_form_fields', array( $this, 'mwform_form_fields' ), 9999 );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
		add_action( 'save_post', array( $this, 'save_post' ) );
		add_filter( 'mwform_styles', array( $this, 'mwform_styles' ) );
		add_filter( 'mw-wp-form-generator-templates', array( $this, 'templates' ) );
		$forms = get_posts( array(
			'post_type'      => 'mw-wp-form',
			'posts_per_page' => -1,
		) );
		foreach ( $forms as $form ) {
			add_filter( 'mwform_post_content_mw-wp-form-' . $form->ID, array( $this, 'mwform_post_content' ) );
		}

		// デフォルトのフォームスタイルの定義
		$this->styles = array(
			'g-naked' => array(
				'css'      => plugin_dir_url( __FILE__ )  . 'styles/g-naked/style.css',
				'template' => plugin_dir_path( __FILE__ ) . 'styles/g-naked/template.php',
			),
			'g-standard' => array(
				'css'      => plugin_dir_url( __FILE__ )  . 'styles/g-standard/style.css',
				'template' => plugin_dir_path( __FILE__ ) . 'styles/g-standard/template.php',
			),
			'g-enquete' => array(
				'css'      => plugin_dir_url( __FILE__ )  . 'styles/g-enquete/style.css',
				'template' => plugin_dir_path( __FILE__ ) . 'styles/g-enquete/template.php',
			),
		);
	}

	/**
	 * admin_enqueue_scripts
	 */
	public function admin_enqueue_scripts( $page ) {
		if ( get_post_type() === 'mw-wp-form' && in_array( $page, array( 'post-new.php', 'post.php' ) ) ) {
			$url = plugin_dir_url( __FILE__ );
			wp_enqueue_script( self::NAME . '-editor', $url . './js/editor.js', array( 'jquery-ui-sortable', 'mw-wp-form-repeatable' ) );
			wp_enqueue_style( self::NAME . '-editor', $url . './css/editor.css' );
			wp_enqueue_script( 'jquery-ui-sortable' );
		}
	}

	/**
	 * remove_editor
	 */
	public function remove_editor() {
		remove_post_type_support( 'mw-wp-form', 'editor' );
	}

	/**
	 * add_form_generator
	 */
	public function add_form_generator() {
		add_meta_box(
			self::NAME . '-form-tag-generator',
			__( 'Form Generator', 'mw-wp-form-generator' ),
			array( $this, 'display_form_generator' ),
			'mw-wp-form',
			'normal',
			'high'
		);
	}

	/**
	 * mwform_form_fields
	 * @param array $form_fields
	 */
	public function mwform_form_fields( $form_fields ) {
		$this->form_fields = $form_fields;
		return $form_fields;
	}

	/**
	 * mwform_post_content
	 * @param string $content 本文
	 * @return string $content
	 */
	public function mwform_post_content( $content ) {
		$items = array();
		$other_items = array();

		// MW WP Form Generator による設定を取得
		$settings = get_post_meta( get_the_ID(), self::NAME, true );
		if ( !is_array( $settings ) ) {
			$settings = array();
		}

		// MW WP Form の設定を取得
		$templates = apply_filters( self::NAME . '-templates', array() );
		$mwform_settings = get_post_meta( get_the_ID(), 'mw-wp-form', true );

		// style
		$style = ( isset( $mwform_settings['style'] ) ) ? $mwform_settings['style'] : '';
		$template = '';
		if ( !empty( $style ) && !empty( $templates[$style] ) && file_exists( $templates[$style] ) ) {
			$template = $templates[$style];
			include_once( $template );
		}

		// 必須項目の一覧
		$validations = ( isset( $mwform_settings['validation'] ) ) ? $mwform_settings['validation'] : array();
		$requires = array();
		foreach ( $validations as $key => $validation ) {
			if ( !empty( $validation['noempty'] ) || !empty( $validation['required' ] ) ) {
				$requires[] = $validation['target'];
			}
		}

		foreach ( $settings as $form_setting ) {
			foreach ( $form_setting as $form_field_name => $options ) {
				$attributes = array();
				foreach ( $options as $option_name => $option_value ) {
					$option_value = preg_replace( "/\r\n|\r/","\n", $option_value );
					$option_value = str_replace( "\n", ',', $option_value );
					$option_value = str_replace( '"', '\'', $option_value );
					if ( $option_value !== '' ) {
						$attributes[] = sprintf(
							'%s="%s"',
							$option_name,
							$option_value
						);
					}
				}
				$attributes = implode( ' ', $attributes );

				$display_name = '';
				if ( !empty( $options[self::NAME . '-display-name'] ) ) {
					$display_name = $options[self::NAME . '-display-name'];
				}

				$description = '';
				if ( !empty( $options[self::NAME . '-description'] ) ) {
					$description = $options[self::NAME . '-description'];
				}

				$notes = '';
				if ( !empty( $options[self::NAME . '-notes'] ) ) {
					$notes = $options[self::NAME . '-notes'];
				}

				$shortcode = sprintf( '[%s %s]', esc_attr( $form_field_name ), $attributes );

				// display_name がないものは最後にまとめる（Error、hidden 等を想定）
				// name 属性があるものは display_name もあるべきなので、ないものは表示しない
				if ( $display_name ) {
					$require = false;
					if ( in_array( $options['name'], $requires ) ) {
						$require = true;
					}
					$items[] = array(
						'display_name' => $display_name,
						'shortcode'    => $shortcode,
						'require'      => $require,
						'description'  => $description,
						'notes'        => $notes,
					);
				} elseif ( !isset( $options['name'] ) || $form_field_name === 'mwform_hidden' ) {
					$other_items[] = $shortcode;
				}
			}
		}

		$content = apply_filters( self::NAME . '-content', $content, $items, $other_items );
		return $content;
	}

	/**
	 * display_form_generator
	 */
	public function display_form_generator() {
		?>
		<div class="<?php echo esc_attr( self::NAME ); ?>-form-options">
			<?php
			$settings = get_post_meta( get_the_ID(), self::NAME, true );
			if ( !empty( $settings ) && is_array( $settings ) ) {
				foreach ( $settings as $number => $field_setting ) {
					foreach ( $field_setting as $field_name => $options ) {
						if ( isset( $this->form_fields[$field_name] ) ) {
							$this->display_form_option( $field_name, $this->form_fields[$field_name], $options );
						}
					}
				}
			}
			?>
		<!-- end .form-options --></div>

		<?php
		$types = array(
			'input'        => 'input',
			'select'       => 'select',
			'button'       => 'button',
			'input_button' => 'input_button',
			'error'        => 'error',
			'other'        => 'other',
		);
		$group = apply_filters( 'mwform_tag_generator_group', $types );

		$labels = array(
			'input'        => __( 'Input fields', MWF_Config::DOMAIN ),
			'select'       => __( 'Select fields', MWF_Config::DOMAIN ),
			'button'       => __( 'Button fields (button)', MWF_Config::DOMAIN ),
			'input_button' => __( 'Button fields (input)', MWF_Config::DOMAIN ),
			'error'        => __( 'Error fields', MWF_Config::DOMAIN ),
			'other'        => __( 'Other fields', MWF_Config::DOMAIN ),
		);
		$labels = apply_filters( 'mwform_tag_generator_labels', $labels );
		?>
		<div class="<?php echo esc_attr( self::NAME ); ?>-add-btn">
			<select>
				<option value=""><?php echo esc_html_e( 'Select this.', MWF_Config::DOMAIN ); ?></option>
				<?php foreach ( $group as $type ) : ?>
					<?php
					$label = isset( $labels[ $type ] ) ? $labels[ $type ] : $type;
					$tag   = 'other' === $type ? 'mwform_tag_generator_option' : 'mwform_tag_generator_' . $type . '_option';
					?>
					<optgroup label="<?php echo esc_attr( $label ); ?>">
						<?php do_action( $tag ); ?>
					</optgroup>
				<?php endforeach; ?>
			</select>
			<span class="button"><?php esc_html_e( 'Add form tag', MWF_Config::DOMAIN ); ?></span>
		<!-- end .add-btn --></div>

		<div class="<?php echo esc_attr( self::NAME ); ?>-hidden-options repeatable-boxes">
			<?php
			foreach ( $this->form_fields as $form_field_name => $form_field ) {
				$this->display_form_option( $form_field_name, $form_field );
			}
			wp_nonce_field( self::NAME . '-options', self::NAME . '-options-nonce' );
		?>
		<!-- end .hidden-options --></div>
		<?php
	}

	/**
	 * display_form_option
	 * フォームジェネレーター用に各フォーム項目の設定パネルを出力
	 * @param string $form_field_name フォーム項目名
	 * @param MW_WP_Form_Abstract_Form_Field $form_field
	 * @param array $values 設定値
	 */
	public function display_form_option( $form_field_name, MW_WP_Form_Abstract_Form_Field $form_field, array $values = array() ) {
		?>
		<div class="<?php echo esc_attr( self::NAME ); ?>-form-option repeatable-box"
			data-field="<?php echo esc_attr( $form_field_name ); ?>">
			<div class="remove-btn"><b>×</b></div>
			<div class="open-btn"><span><?php echo esc_html( $this->get_value_for_generator( $form_field, 'name', $values ) ); ?></span> ( <?php echo esc_html( $form_field->get_display_name() ); ?> )<b>▼</b></div>
			<div class="repeatable-box-content">
				<?php if ( !is_null( $this->get_value_for_generator( $form_field, 'name', $values ) ) ) : ?>
				<p>
					<strong><?php esc_html_e( 'Display name', 'mw-wp-form-generator' ); ?></strong>
					<?php $display_name = $this->get_value_for_generator( $form_field, self::NAME . '-display-name', $values ); ?>
					<input type="text" name="<?php echo self::NAME; ?>-display-name" value="<?php echo esc_attr( $display_name ); ?>" /><br />
					<span class="mwf_note"><?php echo esc_html_e( 'If you don\'t input display name, this form item don\'t display.', 'mw-wp-form-generator' ); ?></span>
				</p>
				<?php endif; ?>
				<?php
				$form_field->mwform_tag_generator_dialog( $values );
				?>
				<?php if ( !is_null( $this->get_value_for_generator( $form_field, 'name', $values ) ) ) : ?>
				<p>
					<strong><?php esc_html_e( 'Description', 'mw-wp-form-generator' ); ?></strong>
					<?php $description = $this->get_value_for_generator( $form_field, self::NAME . '-description', $values ); ?>
					<textarea name="<?php echo self::NAME; ?>-description"><?php echo esc_textarea( $description ); ?></textarea>
					<span class="mwf_note"><?php echo esc_html_e( 'Html available', 'mw-wp-form-generator' ); ?></span>
				</p>
				<p>
					<strong><?php esc_html_e( 'Notes', 'mw-wp-form-generator' ); ?></strong>
					<?php $notes = $this->get_value_for_generator( $form_field, self::NAME . '-notes', $values ); ?>
					<input type="text" name="<?php echo self::NAME; ?>-notes" value="<?php echo esc_attr( $notes ); ?>" />
				</p>
				<?php endif; ?>
			<!-- end .repeatable-box-content --></div>
		<!-- end .repeatable-box --></div>
		<?php
	}

	/**
	 * save_post
	 * @param int $post_id
	 */
	public function save_post( $post_id ) {
		if ( !isset( $_POST[self::NAME] ) ) {
			return;
		}
		if ( !wp_verify_nonce( $_POST[self::NAME . '-options-nonce'], self::NAME . '-options' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ){
			return;
		}
		delete_post_meta( $post_id, self::NAME );
		$options = array();
		foreach ( $_POST[self::NAME] as $number => $form_field ) {
			foreach ( $form_field as $field_name => $values ) {
				$fields_not_need_name = array( 'mwform_error', 'mwform_akismet_error' );
				if ( !empty( $values['name'] ) || in_array( $field_name, $fields_not_need_name ) ) {
					$options[$number][$field_name] = $values;
				}
			}
		}
		update_post_meta( $post_id, self::NAME, $options );
	}

	/**
	 * mwform_styles
	 * @param array $styles
	 * @return array $styles
	 */
	public function mwform_styles( $styles ) {
		foreach ( $this->styles as $style_name => $style ) {
			$styles[$style_name] = $style['css'];
		}
		return $styles;
	}

	/**
	 * templates
	 * @param array $templates
	 * @return array $templates
	 */
	public function templates( $templates ) {
		foreach ( $this->styles as $style_name => $style ) {
			$templates[$style_name] = $style['template'];
		}
		return $templates;
	}

	/**
	 * get_value_for_generator
	 *
	 * @param MW_WP_Form_Abstract_Form_Field $form_field
	 * @param string $key
	 * @param array $options
	 * @return string|null
	 */
	protected function get_value_for_generator( MW_WP_Form_Abstract_Form_Field $form_field, $key, $options ) {
		$value = $form_field->get_value_for_generator( $key, $options );

		$attributes = array(
			self::NAME . '-display-name',
			self::NAME . '-notes',
			self::NAME . '-description',
		);
		$attributes = array_flip( $attributes );

		if ( isset( $attributes[$key] ) && is_null( $value ) ) {
			if ( isset( $options[$key] ) ) {
				return $options[$key];
			}
		}
		return $value;
	}
}
$MW_WP_Form_Generator = new MW_WP_Form_Generator();
