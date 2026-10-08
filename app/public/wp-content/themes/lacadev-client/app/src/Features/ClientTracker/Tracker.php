<?php

namespace App\Features\ClientTracker;

/**
 * ClientTracker\Tracker
 *
 * Theo dõi thay đổi trên site client và báo cáo về server lacadev master qua Webhook.
 *
 * Sự kiện theo dõi:
 *  - Plugin được cài đặt / kích hoạt / vô hiệu hoá / xoá
 *  - Theme được cài đặt / chuyển đổi
 *  - File Integrity Monitoring (FIM): quét checksum toàn bộ source code
 *
 * Cấu hình:
 *  - URL webhook: lưu trong wp_options với key `laca_tracker_webhook_url`
 *  - Secret key:  lưu trong wp_options với key `laca_tracker_secret_key`
 *
 * Đăng ký:
 *  Gọi `(new Tracker())->init();` trong functions.php.
 */
class Tracker
{
    /** wp_options key chứa URL endpoint của lacadev master. */
    const OPTION_WEBHOOK_URL  = 'laca_tracker_webhook_url';

    /** wp_options key chứa secret key dùng để ký payload. */
    const OPTION_SECRET_KEY   = 'laca_tracker_secret_key';

    /** Hook name của cron job FIM. */
    const CRON_HOOK           = 'laca_fim_scan';

    /** Tần suất cron (mỗi 6 giờ một lần). */
    const CRON_INTERVAL       = 'sixhourly';

    /** wp_options key lưu trữ snapshot checksum của lần quét trước. */
    const OPTION_FIM_SNAPSHOT = 'laca_fim_snapshot';

    // =========================================================================
    // INIT
    // =========================================================================

    public function init(): void
    {
        // --- Theo dõi update / cài đặt plugin & theme ---
        add_action('upgrader_process_complete', [$this, 'onUpgraderComplete'], 10, 2);

        // --- Kích hoạt / vô hiệu hoá plugin ---
        add_action('activated_plugin',   [$this, 'onPluginActivated'],   10, 2);
        add_action('deactivated_plugin', [$this, 'onPluginDeactivated'], 10, 2);

        // --- Chuyển theme ---
        add_action('switch_theme', [$this, 'onSwitchTheme'], 10, 3);

        // --- Cron FIM ---
        add_filter('cron_schedules', [$this, 'addCronInterval']);
        add_action(self::CRON_HOOK, [$this, 'runFimScan']);

        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time(), self::CRON_INTERVAL, self::CRON_HOOK);
        }
    }

    // =========================================================================
    // PLUGIN / THEME CHANGE EVENTS
    // =========================================================================

    /**
     * Gọi sau khi upgrader hoàn thành (cài mới hoặc cập nhật plugin/theme).
     *
     * @param \WP_Upgrader $upgrader   Instance upgrader.
     * @param array        $hookExtra  Chứa type ('plugin'|'theme'), action ('install'|'update'), v.v.
     */
    public function onUpgraderComplete(\WP_Upgrader $upgrader, array $hookExtra): void
    {
        $type   = $hookExtra['type']   ?? 'unknown';
        $action = $hookExtra['action'] ?? 'unknown';

        $items = [];
        if ($type === 'plugin') {
            $items = (array) ($hookExtra['plugins'] ?? []);
        } elseif ($type === 'theme') {
            $items = (array) ($hookExtra['themes'] ?? []);
        }

        $this->sendWebhook('upgrader_complete', [
            'type'   => sanitize_text_field($type),
            'action' => sanitize_text_field($action),
            'items'  => array_map('sanitize_text_field', $items),
        ]);
    }

    /**
     * Khi plugin được kích hoạt.
     *
     * @param string $plugin      Đường dẫn plugin file (relative to plugins dir).
     * @param bool   $networkWide True nếu kích hoạt toàn mạng (multisite).
     */
    public function onPluginActivated(string $plugin, bool $networkWide): void
    {
        $this->sendWebhook('plugin_activated', [
            'plugin'       => sanitize_text_field($plugin),
            'network_wide' => $networkWide,
        ]);
    }

    /**
     * Khi plugin bị vô hiệu hoá.
     *
     * @param string $plugin      Đường dẫn plugin file.
     * @param bool   $networkWide True nếu vô hiệu hoá toàn mạng.
     */
    public function onPluginDeactivated(string $plugin, bool $networkWide): void
    {
        $this->sendWebhook('plugin_deactivated', [
            'plugin'       => sanitize_text_field($plugin),
            'network_wide' => $networkWide,
        ]);
    }

    /**
     * Khi theme được chuyển đổi.
     *
     * @param string    $newThemeName Tên theme mới.
     * @param \WP_Theme $newTheme     Object theme mới.
     * @param \WP_Theme $oldTheme     Object theme cũ.
     */
    public function onSwitchTheme(string $newThemeName, \WP_Theme $newTheme, \WP_Theme $oldTheme): void
    {
        $this->sendWebhook('theme_switched', [
            'new_theme' => sanitize_text_field($newThemeName),
            'old_theme' => sanitize_text_field($oldTheme->get('Name')),
        ]);
    }

    // =========================================================================
    // FILE INTEGRITY MONITORING (FIM)
    // =========================================================================

    /**
     * Thêm khoảng thời gian cron "mỗi 6 giờ" vào lịch WP-Cron.
     *
     * @param array $schedules Danh sách lịch cron hiện có.
     * @return array
     */
    public function addCronInterval(array $schedules): array
    {
        if (!isset($schedules[self::CRON_INTERVAL])) {
            $schedules[self::CRON_INTERVAL] = [
                'interval' => 6 * HOUR_IN_SECONDS,
                'display'  => __('Every 6 Hours', 'laca'),
            ];
        }
        return $schedules;
    }

    /**
     * Chạy quét toàn bộ source code từ ABSPATH, so sánh checksum với snapshot cũ,
     * rồi báo cáo các file thay đổi / thêm / xoá về lacadev master.
     */
    public function runFimScan(): void
    {
        $snapshot     = get_option(self::OPTION_FIM_SNAPSHOT, []);
        $currentState = $this->buildFileSnapshot(ABSPATH);
        $changes      = $this->diffSnapshots($snapshot, $currentState);

        // Luôn cập nhật snapshot mới nhất
        update_option(self::OPTION_FIM_SNAPSHOT, $currentState, false);

        // Chỉ gửi webhook nếu có thay đổi thực sự
        if (
            !empty($changes['added'])
            || !empty($changes['modified'])
            || !empty($changes['deleted'])
        ) {
            $this->sendWebhook('fim_changes', [
                'added'    => $changes['added'],
                'modified' => $changes['modified'],
                'deleted'  => $changes['deleted'],
            ]);
        }
    }

    // =========================================================================
    // INTERNAL HELPERS
    // =========================================================================

    /**
     * Xây dựng snapshot: map [ relative_path => md5_hash ] cho mọi file.
     *
     * Bỏ qua: các thư mục node_modules, .git, dist, cache và file cache/log.
     *
     * @param  string $rootDir Thư mục gốc bắt đầu quét.
     * @return array<string, string>
     */
    private function buildFileSnapshot(string $rootDir): array
    {
        $snapshot    = [];
        $skipDirs    = ['node_modules', '.git', 'dist', 'cache', '.cache', 'wp-content/cache'];
        $skipExts    = ['log', 'tmp'];

        try {
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator(
                    $rootDir,
                    \RecursiveDirectoryIterator::SKIP_DOTS
                ),
                \RecursiveIteratorIterator::SELF_FIRST
            );
        } catch (\Exception $e) {
            return $snapshot;
        }

        foreach ($iterator as $file) {
            if (!$file->isFile()) {
                continue;
            }

            $realPath = $file->getRealPath();

            // Bỏ qua thư mục được liệt kê
            foreach ($skipDirs as $skip) {
                if (str_contains($realPath, DIRECTORY_SEPARATOR . $skip . DIRECTORY_SEPARATOR)
                    || str_ends_with($realPath, DIRECTORY_SEPARATOR . $skip)) {
                    continue 2;
                }
            }

            // Bỏ qua extension không cần theo dõi
            if (in_array(strtolower($file->getExtension()), $skipExts, true)) {
                continue;
            }

            $relativePath           = str_replace($rootDir, '', $realPath);
            $snapshot[$relativePath] = md5_file($realPath) ?: '';
        }

        return $snapshot;
    }

    /**
     * So sánh snapshot cũ vs snapshot mới.
     *
     * @param  array $old Snapshot trước.
     * @param  array $new Snapshot hiện tại.
     * @return array{ added: string[], modified: string[], deleted: string[] }
     */
    private function diffSnapshots(array $old, array $new): array
    {
        $added    = array_keys(array_diff_key($new, $old));
        $deleted  = array_keys(array_diff_key($old, $new));
        $modified = [];

        foreach ($new as $path => $hash) {
            if (isset($old[$path]) && $old[$path] !== $hash) {
                $modified[] = $path;
            }
        }

        return compact('added', 'modified', 'deleted');
    }

    /**
     * Gửi payload lên endpoint webhook của lacadev master.
     *
     * Payload JSON:
     * {
     *   "event":      string,
     *   "site_url":   string,
     *   "site_name":  string,
     *   "timestamp":  int,
     *   "data":       object,
     *   "signature":  string  // HMAC-SHA256(payload_json, secret_key)
     * }
     *
     * @param string $event  Loại sự kiện.
     * @param array  $data   Dữ liệu kèm theo.
     */
    private function sendWebhook(string $event, array $data): void
    {
        $webhookUrl = get_option(self::OPTION_WEBHOOK_URL, '');

        if (empty($webhookUrl) || !filter_var($webhookUrl, FILTER_VALIDATE_URL)) {
            return; // Chưa cấu hình endpoint — im lặng bỏ qua
        }

        $secretKey = (string) get_option(self::OPTION_SECRET_KEY, '');

        $payload = wp_json_encode([
            'event'     => sanitize_text_field($event),
            'site_url'  => get_site_url(),
            'site_name' => get_bloginfo('name'),
            'timestamp' => time(),
            'data'      => $data,
        ]);

        if ($payload === false) {
            return;
        }

        // Ký payload để lacadev master xác thực nguồn gốc
        $signature = !empty($secretKey)
            ? hash_hmac('sha256', $payload, $secretKey)
            : '';

        wp_remote_post($webhookUrl, [
            'timeout'     => 10,
            'redirection' => 0,
            'blocking'    => false, // Fire-and-forget — không block page load
            'headers'     => [
                'Content-Type'      => 'application/json',
                'X-Laca-Event'      => sanitize_text_field($event),
                'X-Laca-Signature'  => $signature,
            ],
            'body' => $payload,
        ]);
    }
}
