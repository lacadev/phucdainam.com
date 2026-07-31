<?php
if (!defined('ABSPATH')) die('No direct access allowed');

if (!class_exists('WP_Optimize_Server_Compatibility')) :
/**
 * Adds compatibility for Servers.
 */
class WP_Optimize_Server_Compatibility {

	/**
	 * Returns singleton instance
	 *
	 * @return WP_Optimize_Server_Compatibility
	 */
	public static function get_instance() {
		static $instance = null;
		if (null === $instance) {
			$instance = new WP_Optimize_Server_Compatibility();
		}
		return $instance;
	}

	/**
	 * Detects whether the server handles cache. e.g. Nginx cache
	 *
	 * @return bool
	 */
	public function does_server_handle_cache(): bool {
		return $this->is_kinsta();
	}

	/**
	 * Detects whether the server supports table optimization.
	 *
	 * Some servers prevent table optimization
	 * because InnoDB engine does not optimize table
	 * instead it drops tables and recreates them,
	 * which results in elevated disk write operations
	 *
	 * @return bool
	 */
	public function does_server_allow_table_optimization(): bool {
		return !$this->is_kinsta();
	}

	/**
	 * Detects whether the server supports local webp conversion tools
	 *
	 * @return bool
	 */
	public function does_server_allow_local_webp_conversion(): bool {
		return !$this->is_kinsta();
	}

	/**
	 * Detects if the platform is Kinsta or not
	 *
	 * @return bool Returns true if it is a Kinsta platform, otherwise returns false
	 */
	private function is_kinsta(): bool {
		$is_kinsta = isset($_SERVER['KINSTA_CACHE_ZONE']);

		/**
		 * Filter whether the server is detected as Kinsta.
		 *
		 * Allows overriding the default detection logic in case
		 * Kinsta changes environment variables or for edge cases.
		 *
		 * @param bool $is_kinsta Detected Kinsta status.
		 */
		return (bool) apply_filters('wpo_is_kinsta_server', $is_kinsta);
	}

	/**
	 * Disable table optimization if the server does not allow it.
	 *
	 * @return void
	 */
	public function maybe_disable_unsupported_table_optimization(): void {

		if ($this->does_server_allow_table_optimization()) {
			return;
		}

		$options = WP_Optimize()->get_options();
		$auto_options = $options->get_option('auto');

		if (empty($auto_options) || !is_array($auto_options)) {
			return;
		}

		if (!empty($auto_options['optimize']) && 'true' === $auto_options['optimize']) {
			$auto_options['optimize'] = 'false';
			$options->update_option('auto', $auto_options);
		}
	}
}
endif;
