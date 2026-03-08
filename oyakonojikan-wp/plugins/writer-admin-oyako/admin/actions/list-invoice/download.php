<?php
$id = filter_input( INPUT_GET, 'id' );
check_admin_referer( 'download' . $id );

if ( ! WA_Oyako_Invoice::is_valid( $id ) ) {
	wp_redirect( remove_query_arg( array( 'action', 'id', '_wpnonce' ) ) );
	exit();
}

$invoice = get_post( $id );
$user    = get_userdata( $invoice->post_author );

try {
	$book       = PHPExcel_IOFactory::load( WA_OYAKO_PATH . 'misc/invoice_template_2.xlsx' );
	$base_sheet = $book->getActiveSheet();

	// ベースシートを元に企業宛のシートを生成
	$sheet = $base_sheet->copy();

	// タイトル
	$sheet->setTitle( "請求書" );

	// 日付
	$sheet->setCellValue( 'A2', date( 'Y年n月j日' ) );

	// 住所
	$address = '〒' . get_field( 'zip', $user ) . ' ' . get_field( 'address', $user );

	$sheet->setCellValue( 'A11', $address );

	// 名前
	$full_name = $user->last_name . ' ' . $user->first_name;

	$sheet->setCellValue( 'A13', $full_name );

	// 支払い日
	$limit = mktime( 0, 0, 0, date( 'n' ) + 2, 15, date( 'Y' ) );

	$sheet->setCellValue( 'H25', mysql2date( '但し、業務委託料n月分', $invoice->post_date ) );
	$sheet->setCellValue( 'A22', 'なお、下記のご送金欄記載の金額を' . date( 'Y年n月j日', $limit ) . 'までに' );

	// 業務委託料：金額
	$l29 = get_post_meta( $invoice->ID, 'billed_amount', true );

	$sheet->setCellValue( 'L29', number_format( $l29 ) );

	// 業務委託料：税金額
	$l31 = round( $l29 * 0.08 );

	$sheet->setCellValue( 'L31', number_format( $l31 ) );

	// 業務委託料：合計金額
	$l33 = $l29 + $l31;

	$sheet->setCellValue( 'L33', number_format( $l33 ) );

	// 業務委託料：復興特別税
	$l35 = round( $l29 * 0.1021 );

	$sheet->setCellValue( 'L35', number_format( $l35 ) );

	// 業務委託料：支払金額
	$l37 = $l33 - $l35;

	$sheet->setCellValue( 'L37', number_format( $l37 ) );
	$sheet->setCellValue( 'K15', "￥" . number_format( $l33 ) );

	// 記事数
	$sheet->setCellValue( 'T29', number_format( count( get_post_meta( $invoice->ID, 'billed_posts', true ) ) ) );

	// 振り込み先
	$payment_bank   = get_field( 'payment_bank', $user );
	$payment_branch = get_field( 'payment_branch', $user );
	$payment_number = get_field( 'payment_number', $user );
	$payment_name   = get_field( 'payment_name', $user );

	$bank_detail = $payment_bank . ' ' . $payment_branch . ' 普通口座 口座番号 ' . $payment_number;
	$bank_name   = '口座名義 ' . $payment_name;

	$sheet->setCellValue( 'A46', $bank_detail );
	$sheet->setCellValue( 'A47', $bank_name );

	$book->addSheet( $sheet );
	$book->removeSheetByIndex( $book->getIndex( $base_sheet ) );

} catch ( Exception $exception ) {
	exit( 'Excelファイルの生成時にエラーが発生しました。 - ' . $exception->getMessage() );
}

header( 'Content-Type: application/octet-stream' );
header( 'Content-Disposition: attachment;filename="invoice_' . $invoice->ID . '.xlsx"' );
header( 'Cache-Control: max-age=0' );

$writer = PHPExcel_IOFactory::createWriter( $book, 'Excel2007' );
$writer->save( 'php://output' );
exit();