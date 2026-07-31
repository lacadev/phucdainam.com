<?php

if (!defined('ABSPATH')) die('No direct access allowed');

if (!class_exists('WPO_KD_Submissions_Compatibility')) :

/**
 * Class to handle compatibility with KD Submissions plugin
 */
class WPO_KD_Submissions_Compatibility {

	/**
	 * Constructor
	 */
	private function __construct() {
		add_filter('wp_optimize_get_tables', array($this, 'check_kd_submissions_tables'));
	}

	/**
	 * Checks if KD Submissions tables should be marked as Elementor tables. If Elementor Pro is installed or active and KD Submissions tables are not marked as Elementor tables, then mark them as Elementor tables. This is needed to make sure that if Elementor Pro is installed, then KD Submissions tables are optimized with Elementor tables.
	 *
	 * @param array $tables
	 * @return array
	 */
	public function check_kd_submissions_tables($tables) {
		$is_elementor_pro_installed_or_active = $this->is_elementor_pro_installed_or_active();
		$elementor_pro_status = $this->get_elementor_pro_status();

		foreach ($tables as $key => $table) {
			if (preg_match('/e_submissions_actions_log$/', $table->Name) || (false !== strpos($table->Name, '_e_') && $this->has_plugin_in_list('kd-submissions', $table->plugin_status))) {
				if ($is_elementor_pro_installed_or_active && !$this->has_plugin_in_list('elementor-pro', $table->plugin_status)) {
					$tables[$key]->plugin_status[] = array(
						'plugin' => 'elementor-pro',
						'status' => $elementor_pro_status,
					);
				}
			}
		}

		return $tables;
	}

	/**
	 * Checks plugin status array and checks if selected plugin is already in the list.
	 *
	 * @param string $plugin
	 * @param array $plugin_status
	 * [
	 * 	[
	 *  	[plugin] => woocommerce
	 *      [status] => Array
	 *                        (
	 *                        	[installed] => (bool)
	 *                        	[active] => (bool)
	 *                        )
	 * @return bool
	 */
	private function has_plugin_in_list($plugin, $plugin_status) {
		foreach ($plugin_status as $plugin_info) {
			if ($plugin === $plugin_info['plugin']) return true;
		}

		return false;
	}

	/**
	 * Checks if Elementor Pro is installed or active. This is needed to check if KD Submissions tables should be marked as Elementor tables.
	 *
	 * @return boolean
	 */
	private function is_elementor_pro_installed_or_active() {
		$status = $this->get_elementor_pro_status();

		return $status['installed'] || $status['active'];
	}

	/**
	 * Get Elementor Pro status
	 *
	 * @return array
	 */
	private function get_elementor_pro_status() {
		return WP_Optimize_Database_Information::instance()->get_plugin_status('elementor-pro');
	}

	/**
	 * Returns singleton instance
	 *
	 * @return WPO_KD_Submissions_Compatibility
	 */
	public static function instance() {
		static $_instance = null;
		if (null === $_instance) {
			$_instance = new self();
		}
		return $_instance;
	}
}

endif;
