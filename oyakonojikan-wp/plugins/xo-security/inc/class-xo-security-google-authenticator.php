<?php
/**
 * XO Security Google Authenticator.
 *
 * @package xo-security
 * @since 3.9.1
 *
 * Copyright (c) 2012, Michael Kliewe All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation and/or
 * other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Originally forked from
 * https://github.com/PHPGangsta/GoogleAuthenticator/blob/master/PHPGangsta/GoogleAuthenticator.php
 */

/**
 * XO Security Google Authenticator class.
 *
 * @since 3.9.1
 */
class XO_Security_Google_Authenticator {
	/**
	 * Code length.
	 *
	 * @since 3.9.1
	 *
	 * @var int
	 */
	protected $code_ength = 6;

	/**
	 * Create new secret.
	 *
	 * @since 3.9.1
	 *
	 * @param int $secret_length Secret length.
	 * @return string
	 */
	public function create_secret( $secret_length = 16 ) {
		$valid_chars = $this->get_base32_lookup_table();

		$secret = '';

		// Valid secret lengths are 80 to 640 bits.
		if ( $secret_length < 16 || $secret_length > 128 ) {
			return $secret;
		}

		$rnd = false;
		if ( function_exists( 'random_bytes' ) ) {
			$rnd = random_bytes( $secret_length );
		} elseif ( function_exists( 'openssl_random_pseudo_bytes' ) ) {
			$rnd = openssl_random_pseudo_bytes( $secret_length, $crypto_strong );
			if ( ! $crypto_strong ) {
				$rnd = false;
			}
		}
		if ( false !== $rnd ) {
			for ( $i = 0; $i < $secret_length; ++$i ) {
				$secret .= $valid_chars[ ord( $rnd[ $i ] ) & 31 ];
			}
		}

		return $secret;
	}

	/**
	 * Get QR-Code URL for image, from google charts.
	 *
	 * @since 3.9.1
	 *
	 * @param string $name   Name.
	 * @param string $secret Secret.
	 * @param string $title  Title.
	 * @param array  $params Parameters.
	 * @return string
	 */
	public function get_qrcode_google_url( $name, $secret, $title = null, $params = array() ) {
		$width  = ! empty( $params['width'] ) && (int) $params['width'] > 0 ? (int) $params['width'] : 200;
		$height = ! empty( $params['height'] ) && (int) $params['height'] > 0 ? (int) $params['height'] : 200;
		$level  = ! empty( $params['level'] ) && array_search( $params['level'], array( 'L', 'M', 'Q', 'H' ), true ) !== false ? $params['level'] : 'M';

		$urlencoded = rawurlencode( 'otpauth://totp/' . $name . '?secret=' . $secret . '' );
		if ( isset( $title ) ) {
			$urlencoded .= rawurlencode( '&issuer=' . rawurlencode( $title ) );
		}

		return "https://api.qrserver.com/v1/create-qr-code/?data=$urlencoded&size={$width}x{$height}&ecc=$level";
	}

	/**
	 * Calculate the code, with given secret and point in time.
	 *
	 * @since 3.9.1
	 *
	 * @param string   $secret     Secret.
	 * @param int|null $time_slice Time slice.
	 * @return string
	 */
	public function get_code( $secret, $time_slice = null ) {
		if ( null === $time_slice ) {
			$time_slice = floor( time() / 30 );
		}

		$secret_key = $this->decode_base32( $secret );

		// Pack time into binary string.
		$time = chr( 0 ) . chr( 0 ) . chr( 0 ) . chr( 0 ) . pack( 'N*', $time_slice );
		// Hash it with users secret key.
		$hm = hash_hmac( 'SHA1', $time, $secret_key, true );
		// Use last nipple of result as index/offset.
		$offset = ord( substr( $hm, -1 ) ) & 0x0F;
		// grab 4 bytes of the result.
		$hashpart = substr( $hm, $offset, 4 );

		// Unpak binary value.
		$value = unpack( 'N', $hashpart );
		$value = $value[1];
		// Only 32 bits.
		$value = $value & 0x7FFFFFFF;

		$modulo = pow( 10, $this->code_ength );

		return str_pad( $value % $modulo, $this->code_ength, '0', STR_PAD_LEFT );
	}

	/**
	 * Check if the code is correct. This will accept codes starting from $discrepancy*30sec ago to $discrepancy*30sec from now.
	 *
	 * @since 3.9.1
	 *
	 * @param string   $secret             Secret.
	 * @param string   $code               Code.
	 * @param int      $discrepancy        This is the allowed time drift in 30 second units (8 means 4 minutes before or after).
	 * @param int|null $current_time_slice time slice if we want use other that time().
	 * @return bool
	 */
	public function verify_code( $secret, $code, $discrepancy = 1, $current_time_slice = null ) {
		if ( null === $current_time_slice ) {
			$current_time_slice = floor( time() / 30 );
		}

		if ( strlen( $code ) !== 6 ) {
			return false;
		}

		for ( $i = -$discrepancy; $i <= $discrepancy; ++$i ) {
			$calculated_code = $this->get_code( $secret, $current_time_slice + $i );
			if ( $this->timing_safe_equals( $calculated_code, $code ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Set the code length, should be >=6.
	 *
	 * @since 3.9.1
	 *
	 * @param int $length Length.
	 * @return XO_Security_Google_Authenticator
	 */
	public function set_code_length( $length ) {
		$this->code_ength = $length;
		return $this;
	}

	/**
	 * Helper class to decode base32.
	 *
	 * @since 3.9.1
	 *
	 * @param string $secret Secret.
	 * @return bool|string
	 */
	protected function decode_base32( $secret ) {
		if ( empty( $secret ) ) {
			return '';
		}

		$base32chars         = $this->get_base32_lookup_table();
		$base32chars_flipped = array_flip( $base32chars );

		$padding_char_count = substr_count( $secret, $base32chars[32] );
		$allowed_values     = array( 6, 4, 3, 1, 0 );
		if ( ! in_array( $padding_char_count, $allowed_values, true ) ) {
			return false;
		}
		for ( $i = 0; $i < 4; ++$i ) {
			if (
				$padding_char_count === $allowed_values[ $i ]
				&& substr( $secret, - ( $allowed_values[ $i ] ) ) !== str_repeat( $base32chars[32], $allowed_values[ $i ] )
			) {
				return false;
			}
		}
		$secret        = str_replace( '=', '', $secret );
		$secret        = str_split( $secret );
		$binary_string = '';
		$secret_length = count( $secret );

		for ( $i = 0; $i < $secret_length; $i = $i + 8 ) {
			$x = '';
			if ( ! in_array( $secret[ $i ], $base32chars, true ) ) {
				return false;
			}
			for ( $j = 0; $j < 8; ++$j ) {
				if ( isset( $secret[ $i + $j ] ) && isset( $base32chars_flipped[ $secret[ $i + $j ] ] ) ) {
					$x .= str_pad( base_convert( $base32chars_flipped[ $secret[ $i + $j ] ], 10, 2 ), 5, '0', STR_PAD_LEFT );
				} else {
					$x .= '00000';
				}
			}
			$eight_bits        = str_split( $x, 8 );
			$eight_bits_length = count( $eight_bits );
			for ( $z = 0; $z < $eight_bits_length; ++$z ) {
				$y              = chr( base_convert( $eight_bits[ $z ], 2, 10 ) );
				$binary_string .= ( ( $y ) || ord( $y ) === 48 ) ? $y : '';
			}
		}

		return $binary_string;
	}

	/**
	 * Get array with all 32 characters for decoding from/encoding to base32.
	 *
	 * @since 3.9.1
	 *
	 * @return array
	 */
	protected function get_base32_lookup_table() {
		return array(
			// phpcs:disable
			'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', //  7
			'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', // 15
			'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', // 23
			'Y', 'Z', '2', '3', '4', '5', '6', '7', // 31
			'=',  // padding char.
			// phpcs:enable
		);
	}

	/**
	 * A timing safe equals comparison
	 * more info here: http://blog.ircmaxell.com/2014/11/its-all-about-time.html.
	 *
	 * @since 3.9.1
	 *
	 * @param string $safe_string The internal (safe) value to be checked.
	 * @param string $user_string The user submitted (unsafe) value.
	 * @return bool True if the two strings are identical.
	 */
	private function timing_safe_equals( $safe_string, $user_string ) {
		if ( function_exists( 'hash_equals' ) ) {
			return hash_equals( $safe_string, $user_string );
		}

		$safe_len = strlen( $safe_string );
		$user_len = strlen( $user_string );

		if ( $user_len !== $safe_len ) {
			return false;
		}

		$result = 0;

		for ( $i = 0; $i < $user_len; ++$i ) {
			$result |= ( ord( $safe_string[ $i ] ) ^ ord( $user_string[ $i ] ) );
		}

		// They are only identical strings if $result is exactly 0...
		return 0 === $result;
	}
}
