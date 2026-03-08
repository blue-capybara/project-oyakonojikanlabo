jQuery( function( $ ) {

	var cnt = $( '.mw-wp-form-generator-form-options .mw-wp-form-generator-form-option' ).length;

	// ページ上の全フィールド
	$( '.mw-wp-form-generator-form-option' ).find( 'input, textarea, select' ).each( function( i, e ) {
		var name = $( e ).attr( 'name' );
		var field_type = $( e ).parents( '.mw-wp-form-generator-form-option' ).data( 'field' );
		if ( name === 'name' ) {
			$( e ).addClass( 'targetKey' );
		}
		if ( name && field_type ) {
			$( e )
				.attr( 'name', name.replace( /^(.+)$/, 'mw-wp-form-generator[_][' + field_type + '][$1]' ) );
		}
	} );

	// sortable
	$( '.mw-wp-form-generator-form-options' ).sortable( {
		items : '> .mw-wp-form-generator-form-option',
		handle: '.open-btn'
	} );

	// 隠しフィールドのみ
	$( '.mw-wp-form-generator-hidden-options .mw-wp-form-generator-form-option' )
		.find( 'input, textarea, select' ).each( function( i, e ) {
			$( e ).attr( 'disabled', 'disabled' );
		} );

	// 表示フィールド
	var saved_cnt = 0;
	$( '.mw-wp-form-generator-form-options .mw-wp-form-generator-form-option' ).each( function( i, e ) {
		$( e ).find( 'input, textarea, select' ).each( function( i, e ) {
			var name = $( e ).attr( 'name' );
			$( e ).attr( 'name', name.replace( /^(mw-wp-form-generator)\[_\]/, '$1[_' + saved_cnt + ']' ) );
		} );
		saved_cnt ++;
	} );


	// 基本は mw_wp_form_repeatable だけど、add は独自実装
	$( '.mw-wp-form-generator-form-options' ).mw_wp_form_repeatable();
	$( '.mw-wp-form-generator-hidden-options' ).mw_wp_form_repeatable();

	// add
	$( '.mw-wp-form-generator-add-btn .button' ).click( function() {
		cnt ++;
		var select = $( this ).parent().find( 'select' ).val();
		if ( select ) {
			var target = $( '.mw-wp-form-generator-hidden-options' ).find( '[data-field="' + select + '"]' );
			if ( target.length ) {
				var clone = target.clone( true, true ).hide();
				clone.find( '.repeatable-box-content' ).show();
				clone.find( 'input, textarea, select' ).each( function( i, e ) {
					var name = $( e ).attr( 'name' );
					$( e )
						.attr( 'name', name.replace( /^(mw-wp-form-generator)\[_\]/, '$1[_' + cnt + ']' ) )
						.removeAttr( 'disabled' );
				} );
				$( '.mw-wp-form-generator-form-options' ).append( clone.fadeIn() );
			}
		}
	} );
} );