<?php
/*
  Plugin Name: DeMomentSomTres Export
  Plugin URI: http://DeMomentSomTres.com/english/wordpress-plugin-export
  Description: DeMomentSomTres Export was build because DeMomentSomTres had a customer with a very big blog that had to be imported without only the required attachment files.
  Version: 20200610
  Author: DeMomentSomTres
  Author URI: http://DeMomentSomTres.com
  License: GPLv2 or later
 */

/** Load WordPress export API */
require_once( ABSPATH . 'wp-admin/includes/export.php' );

$dms3export = new DeMomentSomTresExport();

class DeMomentSomTresExport {

    private $pluginURL;
    private $pluginPath;
    private $langDir;

    function __construct() {
        $this->pluginURL  = plugin_dir_url(__FILE__);
        $this->pluginPath = plugin_dir_path(__FILE__);
        $this->langDir    = dirname(plugin_basename(__FILE__)) . '/languages';

        add_action('admin_init', array($this, "admin_init"));
        add_action('export_wp', array($this, 'export_wp'));
        add_action('admin_menu', array($this, 'create_menus'), 999);
        add_action('admin_head', array($this, 'export_add_js'));
    }

    function create_menus() {
        remove_submenu_page('tools.php', 'export.php');
        add_management_page(
                __("DeMomentSomTres Export"), __("DeMomentSomTres Export"), "export", "dms3export", array($this, "admin_page")
        );
    }

    /**
     * Create the date options fields for exporting a given post type.
     *
     * @global wpdb      $wpdb      WordPress database abstraction object.
     * @global WP_Locale $wp_locale Date and Time Locale object.
     *
     * @since 3.1.0
     *
     * @param string $post_type The post type. Default 'post'.
     */
    function export_date_options($post_type = 'post') {
        global $wpdb, $wp_locale;

        $months = $wpdb->get_results($wpdb->prepare("
		SELECT DISTINCT YEAR( post_date ) AS year, MONTH( post_date ) AS month
		FROM $wpdb->posts
		WHERE post_type = %s AND post_status != 'auto-draft'
		ORDER BY post_date DESC
	", $post_type));

        $month_count = count($months);
        if (!$month_count || ( 1 == $month_count && 0 == $months[0]->month ))
            return;

        foreach ($months as $date) {
            if (0 == $date->year)
                continue;

            $month = zeroise($date->month, 2);
            echo '<option value="' . $date->year . '-' . $month . '">' . $wp_locale->get_month($month) . ' ' . $date->year . '</option>';
        }
    }

    /**
     * Display JavaScript on the page.
     *
     * @since 3.5.0
     */
    function export_add_js() {
        ?>
        <script type="text/javascript">
            jQuery(document).ready(function ($) {
                var form = $('#export-filters'),
                filters = form.find('.export-filters');
                filters.hide();
                form.find('input:radio[name="content"]').change(function () {
                    filters.slideUp('fast');
                    var dms3pt = "#" + $(this).val() + "-filters";
                    $(dms3pt).slideDown();
                });
                filters2 = form.find('.pagination-filters');
                filters2.hide();
                form.find('input:radio[name="pagination"]').change(function () {
                    filters2.slideUp('fast');
                    var dms3pt = "#" + $(this).val() + "-filters";
                    $(dms3pt).slideDown();
                });
                form.submit(function (event) {
                    event.preventDefault();
                    var params = $(this).serializeArray();
                    var urlparams = params.reduce(function (total, currentValue, currentIndex, arr) {
                        var ara = "";
                        if (currentValue["value"] != 0) {
                            ara = ara + currentValue["name"] + "=" + currentValue["value"];
                        }
                        if (currentIndex != 0 && ara != "") {
                            return total + "&" + ara;
                        }
                        return total + ara;
                    }, "");
                    var url = window.location.protocol + "//"
                            + window.location.hostname
                            + window.location.pathname + "?"
                            + urlparams;
                    window.location.assign(url);
//                    window.open(url,"_blank");
                });
            });
        </script>
        <?php
    }

    function admin_page() {
        global $wpdb;
        get_current_screen()->add_help_tab(array(
            'id'      => 'overview',
            'title'   => __('Overview'),
            'content' => '<p>' . __('You can export a file of your site&#8217;s content in order to import it into another installation or platform. The export file will be an XML file format called WXR. Posts, pages, comments, custom fields, categories, and tags can be included. You can choose for the WXR file to include only certain posts or pages by setting the dropdown filters to limit the export by category, author, date range by month, or publishing status.') . '</p>' .
            '<p>' . __('Once generated, your WXR file can be imported by another WordPress site or by another blogging platform able to access this format.') . '</p>',
        ));

        get_current_screen()->set_help_sidebar(
                '<p><strong>' . __('For more information:') . '</strong></p>' .
                '<p>' . __('<a href="https://codex.wordpress.org/Tools_Export_Screen" target="_blank">Documentation on Export</a>') . '</p>' .
                '<p>' . __('<a href="https://wordpress.org/support/" target="_blank">Support Forums</a>') . '</p>'
        );

        $title = __('Export');

        //require_once( ABSPATH . 'wp-admin/admin-header.php' );
        ?>

        <div class="wrap">
            <h1><?php echo esc_html($title); ?></h1>

            <p><?php _e('When you click the button below WordPress will create an XML file for you to save to your computer.'); ?></p>
            <p><?php _e('This format, which we call WordPress eXtended RSS or WXR, will contain your posts, pages, comments, custom fields, categories, and tags.'); ?></p>
            <p><?php _e('Once you&#8217;ve saved the download file, you can use the Import function in another WordPress installation to import the content from this site.'); ?></p>

            <h2><?php _e('Choose what to export'); ?></h2>
            <form method="get" id="export-filters" action="tools.php">
                <fieldset>
                    <legend class="screen-reader-text"><?php _e('Content to export'); ?></legend>
                    <input type="hidden" name="page" value="dms3export" />
                    <input type="hidden" name="dms3export" value="true" />
                    <p><label><input type="radio" name="content" value="all" checked="checked" aria-describedby="all-content-desc" /> <?php _e('All content'); ?></label></p>
                    <p class="description" id="all-content-desc"><?php _e('This will contain all of your posts, pages, comments, custom fields, terms, navigation menus, and custom posts.'); ?></p>

                    <p><label><input type="radio" name="content" value="posts" /> <?php _e('Posts'); ?></label></p>
                    <ul id="posts-filters" class="export-filters">
                        <li>
                            <label><span class="label-responsive"><?php _e('Categories:'); ?></span>
                                <?php wp_dropdown_categories(array('show_option_all' => __('All'))); ?>
                            </label>
                        </li>
                        <li>
                            <label><span class="label-responsive"><?php _e('Authors:'); ?></span>
                                <?php
                                $authors    = $wpdb->get_col("SELECT DISTINCT post_author FROM {$wpdb->posts} WHERE post_type = 'post'");
                                wp_dropdown_users(array(
                                    'include'         => $authors,
                                    'name'            => 'post_author',
                                    'multi'           => true,
                                    'show_option_all' => __('All'),
                                    'show'            => 'display_name_with_login',
                                ));
                                ?>
                            </label>
                        </li>
                        <li>
                            <fieldset>
                                <legend class="screen-reader-text"><?php _e('Date range:'); ?></legend>
                                <label for="post-start-date" class="label-responsive"><?php _e('Start date:'); ?></label>
                                <select name="post_start_date" id="post-start-date">
                                    <option value="0"><?php _e('&mdash; Select &mdash;'); ?></option>
                                    <?php $this->export_date_options(); ?>
                                </select>
                                <label for="post-end-date" class="label-responsive"><?php _e('End date:'); ?></label>
                                <select name="post_end_date" id="post-end-date">
                                    <option value="0"><?php _e('&mdash; Select &mdash;'); ?></option>
                                    <?php $this->export_date_options(); ?>
                                </select>
                            </fieldset>
                        </li>
                        <li>
                            <label for="post-status" class="label-responsive"><?php _e('Status:'); ?></label>
                            <select name="post_status" id="post-status">
                                <option value="0"><?php _e('All'); ?></option>
                                <?php
                                $post_stati = get_post_stati(array('internal' => false), 'objects');
                                foreach ($post_stati as $status) :
                                    ?>
                                    <option value="<?php echo esc_attr($status->name); ?>"><?php echo esc_html($status->label); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </li>
                    </ul>

                    <p><label><input type="radio" name="content" value="pages" /> <?php _e('Pages'); ?></label></p>
                    <ul id="pages-filters" class="export-filters">
                        <li>
                            <label><span class="label-responsive"><?php _e('Authors:'); ?></span>
                                <?php
                                $authors = $wpdb->get_col("SELECT DISTINCT post_author FROM {$wpdb->posts} WHERE post_type = 'page'");
                                wp_dropdown_users(array(
                                    'include'         => $authors,
                                    'name'            => 'page_author',
                                    'multi'           => true,
                                    'show_option_all' => __('All'),
                                    'show'            => 'display_name_with_login',
                                ));
                                ?>
                            </label>
                        </li>
                        <li>
                            <fieldset>
                                <legend class="screen-reader-text"><?php _e('Date range:'); ?></legend>
                                <label for="page-start-date" class="label-responsive"><?php _e('Start date:'); ?></label>
                                <select name="page_start_date" id="page-start-date">
                                    <option value="0"><?php _e('&mdash; Select &mdash;'); ?></option>
                                    <?php $this->export_date_options('page'); ?>
                                </select>
                                <label for="page-end-date" class="label-responsive"><?php _e('End date:'); ?></label>
                                <select name="page_end_date" id="page-end-date">
                                    <option value="0"><?php _e('&mdash; Select &mdash;'); ?></option>
                                    <?php $this->export_date_options('page'); ?>
                                </select>
                            </fieldset>
                        </li>
                        <li>
                            <label for="page-status" class="label-responsive"><?php _e('Status:'); ?></label>
                            <select name="page_status" id="page-status">
                                <option value="0"><?php _e('All'); ?></option>
                                <?php foreach ($post_stati as $status) : ?>
                                    <option value="<?php echo esc_attr($status->name); ?>"><?php echo esc_html($status->label); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </li>
                    </ul>

                    <?php foreach (get_post_types(array('_builtin' => false, 'can_export' => true), 'objects') as $post_type) : ?>
                        <p><label><input type="radio" name="content" value="<?php echo esc_attr($post_type->name); ?>" /> <?php echo esc_html($post_type->label); ?></label></p>
                        <ul id="<?php echo $post_type->name; ?>-filters" class="export-filters">
                            <li>
                                <label><span class="label-responsive"><?php _e('Authors:'); ?></span>
                                    <?php
                                    $authors = $wpdb->get_col("SELECT DISTINCT post_author FROM {$wpdb->posts} WHERE post_type = '{$post_type->name}'");
                                    wp_dropdown_users(array(
                                        'include'         => $authors,
                                        'name'            => $post_type->name . '_author',
                                        'multi'           => true,
                                        'show_option_all' => __('All'),
                                        'show'            => 'display_name_with_login',
                                    ));
                                    ?>
                                </label>
                            </li>
                            <li>
                                <fieldset>
                                    <legend class="screen-reader-text"><?php _e('Date range:'); ?></legend>
                                    <label for="<?php echo $post_type->name; ?>-start-date" class="label-responsive"><?php _e('Start date:'); ?></label>
                                    <select name="<?php echo $post_type->name; ?>_start_date" id="<?php echo $post_type->name; ?>-start-date">
                                        <option value="0"><?php _e('&mdash; Select &mdash;'); ?></option>
                                        <?php $this->export_date_options($post_type->name); ?>
                                    </select>
                                    <label for="<?php echo $post_type->name; ?>-end-date" class="label-responsive"><?php _e('End date:'); ?></label>
                                    <select name="<?php echo $post_type->name; ?>_end_date" id="<?php echo $post_type->name; ?>-end-date">
                                        <option value="0"><?php _e('&mdash; Select &mdash;'); ?></option>
                                        <?php $this->export_date_options($post_type->name); ?>
                                    </select>
                                </fieldset>
                            </li>
                            <li>
                                <label for="<?php echo $post_type->name; ?>-status" class="label-responsive"><?php _e('Status:'); ?></label>
                                <select name="<?php echo $post_type->name; ?>_status" id="<?php echo $post_type->name; ?>-status">
                                    <option value="0"><?php _e('All'); ?></option>
                                    <?php foreach ($post_stati as $status) : ?>
                                        <option value="<?php echo esc_attr($status->name); ?>"><?php echo esc_html($status->label); ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </li>
                        </ul>
                    <?php endforeach; ?>

                    <p><label><input type="radio" name="content" value="attachment" /> <?php _e('Media'); ?></label></p>
                    <ul id="attachment-filters" class="export-filters">
                        <li>
                            <fieldset>
                                <legend class="screen-reader-text"><?php _e('Date range:'); ?></legend>
                                <label for="attachment-start-date" class="label-responsive"><?php _e('Start date:'); ?></label>
                                <select name="attachment_start_date" id="attachment-start-date">
                                    <option value="0"><?php _e('&mdash; Select &mdash;'); ?></option>
                                    <?php $this->export_date_options('attachment'); ?>
                                </select>
                                <label for="attachment-end-date" class="label-responsive"><?php _e('End date:'); ?></label>
                                <select name="attachment_end_date" id="attachment-end-date">
                                    <option value="0"><?php _e('&mdash; Select &mdash;'); ?></option>
                                    <?php $this->export_date_options('attachment'); ?>
                                </select>
                            </fieldset>
                        </li>
                    </ul>

                </fieldset>
                <h2><?php _e('Choose if content is paged'); ?></h2>
                <fieldset>
                    <p><label><input type="radio" name="pagination" value="unpaged" checked="checked" /> <?php _e("Without Pagination");?></p>
                    <p><label><input type="radio" name="pagination" value="paged" /> <?php _e("Paginated");?></p>
                    <ul id="paged-filters" class="pagination-filters" >
                        <li>
                            <fieldset>
                                <label for="xpage" class="label-responsive"><?php _e('Posts'); ?></label>
                                <input type="number" name="xpage" id="xpage" value="25"/>
                                <label for="pagen" class="label-responsive"><?php _e('Offset'); ?></label>
                                <input type="number" name="offset" id="offset" value="0"/>
                            </fieldset>
                        </li>
                    </ul>
                </fieldset>
                <?php
                /**
                 * Fires at the end of the export filters form.
                 *
                 * @since 3.5.0
                 */
                do_action('export_filters');
                ?>

                <?php submit_button(__('Download Export File')); ?>
            </form>
        </div>

        <?php
        //include( ABSPATH . 'wp-admin/admin-footer.php' );
    }

    // add attachment used in posts if not selected all contents // START
    function demomentsomtres_add_attachments($post_ids) {
        $attachments = array();
        foreach ($post_ids as $post_id):
            //****************************
            //post isnt always parent for a featured image - based on megamurmulis idea
            $value = get_post_meta($post_id, '_thumbnail_id', true);
            if ($value):
                $attachments = array_merge($attachments, array($value));
            endif;
            //****************************

            $attachArgs  = array(
                'post_parent'  => $post_id,
                'post_type'    => 'attachment',
                'numberposts'  => -1,
                'post__not_in' => $attachments, //To skip duplicates
            );
            $attachList  = get_children($attachArgs, ARRAY_A);
            $attachments = array_merge($attachments, array_keys($attachList));
        endforeach;
        return array_merge($attachments, $post_ids);
    }

    /**
     * Generates the WXR export file for download 
     * Based on 2.5.0 Export API version
     *
     * @since 1.0
     *
     * @param array $args Filters defining what should be included in the export
     */
    function export_wp() {
        global $wpdb, $post;

        // $args are passed throught $_GET
        $args = array();

        if (!isset($_GET['content']) || 'all' == $_GET['content']) {
            $args['content'] = 'all';
        }
        else if ('posts' == $_GET['content']) {
            $args['content']  = 'post';
            if ($_GET['cat'])
                $args['category'] = (int) $_GET['cat'];
            if ($_GET['post_author'])
                $args['author']   = (int) $_GET['post_author'];
            if ($_GET['post_start_date'] || $_GET['post_end_date']) {
                $args['start_date'] = $_GET['post_start_date'];
                $args['end_date']   = $_GET['post_end_date'];
            }
            if ($_GET['post_status'])
                $args['status'] = $_GET['post_status'];
        } else if ('pages' == $_GET['content']) {
            $args['content'] = 'page';
            if ($_GET['page_author'])
                $args['author']  = (int) $_GET['page_author'];
            if ($_GET['page_start_date'] || $_GET['page_end_date']) {
                $args['start_date'] = $_GET['page_start_date'];
                $args['end_date']   = $_GET['page_end_date'];
            }
            if ($_GET['page_status'])
                $args['status'] = $_GET['page_status'];
        } else if ('attachment' == $_GET['content']) {
            $args['content'] = 'attachment';
            if ($_GET['attachment_start_date'] || $_GET['attachment_end_date']) {
                $args['start_date'] = $_GET['attachment_start_date'];
                $args['end_date']   = $_GET['attachment_end_date'];
            }
        }
        else {
            $args['content'] = $_GET['content'];
            if ($_GET[$args['content'].'_start_date'] || $_GET[$args['content'].'_end_date']) {
                $args['start_date'] = $_GET[$args['content'].'_start_date'];
                $args['end_date']   = $_GET[$args['content'].'_end_date'];
            }
            if ($_GET[$args['content'].'_author'])
                $args['author']  = (int) $_GET[$args['content'].'_author'];
            if ($_GET[$args['content'].'_status'])
                $args['status'] = $_GET[$args['content'].'_status'];
        }
        if($_GET['pagination']=="paged"):
            if ($_GET[xpage])
                $args['posts_per_page']  = (int) $_GET['xpage'];
            if ($_GET['offset'])
                $args['offset'] = $_GET['offset'];
        endif;

        $args = apply_filters('export_args', $args);

        $defaults = array(
            'content'           => 'all',
            'author'            => false,
            'category'          => false,
            'start_date'        => false,
            'end_date'          => false,
            'status'            => false,
            'paged'             => false,
            'posts_per_page'    => -1,
            'offset'            => 0,
        );
        $args     = wp_parse_args($args, $defaults);

        $sitename = sanitize_key(get_bloginfo('name'));
        if (!empty($sitename))
            $sitename .= '.';
        $filename = $sitename . 'wordpress.' . date('Y-m-d') . '.xml';

        header('Content-Description: File Transfer');
        header('Content-Disposition: attachment; filename=' . $filename);
        header('Content-Type: text/xml; charset=' . get_option('blog_charset'), true);

        if ('all' != $args['content'] && post_type_exists($args['content'])) {
            $ptype           = get_post_type_object($args['content']);
            if (!$ptype->can_export)
                $args['content'] = 'post';
            $where           = $wpdb->prepare("{$wpdb->posts}.post_type = %s", $args['content']);
        } else {
            $post_types = get_post_types(array('can_export' => true));
            $esses      = array_fill(0, count($post_types), '%s');
            $where      = $wpdb->prepare("{$wpdb->posts}.post_type IN (" . implode(',', $esses) . ')', $post_types);
        }

        if ($args['status'])
            $where .= $wpdb->prepare(" AND {$wpdb->posts}.post_status = %s", $args['status']);
        else
            $where .= " AND {$wpdb->posts}.post_status != 'auto-draft'";

        $join = '';
        if ($args['category'] && 'post' == $args['content']) {
            if ($term = term_exists($args['category'], 'category')) {
                $join  = "INNER JOIN {$wpdb->term_relationships} ON ({$wpdb->posts}.ID = {$wpdb->term_relationships}.object_id)";
                $where .= $wpdb->prepare(" AND {$wpdb->term_relationships}.term_taxonomy_id = %d", $term['term_taxonomy_id']);
            }
        }

        if ($args['author'])
            $where .= $wpdb->prepare(" AND {$wpdb->posts}.post_author = %d", $args['author']);

        if ($args['start_date'])
            $where .= $wpdb->prepare(" AND {$wpdb->posts}.post_date >= %s", date('Y-m-d', strtotime($args['start_date'])));

        if ($args['end_date'])
            $where .= $wpdb->prepare(" AND {$wpdb->posts}.post_date < %s", date('Y-m-d', strtotime('+1 month', strtotime($args['end_date']))));

        $limit="";
        if($args['posts_per_page']!==-1):
            $limit .= $wpdb->prepare("ORDER BY ID ASC LIMIT %d OFFSET %d ",$args["posts_per_page"],$args["offset"]);
        endif;
        // grab a snapshot of post IDs, just in case it changes during the export
        $post_ids = $wpdb->get_col("SELECT ID FROM {$wpdb->posts} $join WHERE $where $limit");
        
        // get the requested terms ready, empty unless posts filtered by category or all content
        $cats  = $tags  = $terms = array();
        if (isset($term) && $term) {
            $cat  = get_term($term['term_id'], 'category');
            $cats = array($cat->term_id => $cat);
            unset($term, $cat);
        }
        else if ('all' == $args['content']) {
            $categories = (array) get_categories(array('get' => 'all'));
            $tags       = (array) get_tags(array('get' => 'all'));

            $custom_taxonomies = get_taxonomies(array('_builtin' => false));
            $custom_terms      = (array) get_terms($custom_taxonomies, array('get' => 'all'));

            // put categories in order with no child going before its parent
            while ($cat = array_shift($categories)) {
                if ($cat->parent == 0 || isset($cats[$cat->parent]))
                    $cats[$cat->term_id] = $cat;
                else
                    $categories[]        = $cat;
            }

            // put terms in order with no child going before its parent
            while ($t = array_shift($custom_terms)) {
                if ($t->parent == 0 || isset($terms[$t->parent]))
                    $terms[$t->term_id] = $t;
                else
                    $custom_terms[]     = $t;
            }

            unset($categories, $custom_taxonomies, $custom_terms);
        }

        if ('all' != $args['content']):
            $post_ids = $this->demomentsomtres_add_attachments($post_ids);
        endif;
        // add attachments used in post if not selected all contents // END

        add_filter('wxr_export_skip_postmeta', array($this, 'wxr_filter_postmeta'), 10, 2);

        echo '<?xml version="1.0" encoding="' . get_bloginfo('charset') . "\" ?>\n";
        ?>
<!-- This is a WordPress eXtended RSS file generated by WordPress as an export of your site. -->
<!-- It contains information about your site's posts, pages, comments, categories, and other content. -->
<!-- You may use this file to transfer that content from one site to another. -->
<!-- This file is not intended to serve as a complete backup of your site. -->

<!-- To import this information into a WordPress site follow these steps: -->
<!-- 1. Log in to that site as an administrator. -->
<!-- 2. Go to Tools: Import in the WordPress admin panel. -->
<!-- 3. Install the "WordPress" importer from the list. -->
<!-- 4. Activate & Run Importer. -->
<!-- 5. Upload this file using the form provided on that page. -->
<!-- 6. You will first be asked to map the authors in this export file to users -->
<!--    on the site. For each author, you may choose to map to an -->
<!--    existing user on the site or to create a new user. -->
<!-- 7. WordPress will then import each of the posts, pages, comments, categories, etc. -->
<!--    contained in this file into your site. -->

<?php the_generator('export'); ?>
<rss version="2.0"
     xmlns:excerpt="http://wordpress.org/export/<?php echo WXR_VERSION; ?>/excerpt/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:wfw="http://wellformedweb.org/CommentAPI/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:wp="http://wordpress.org/export/<?php echo WXR_VERSION; ?>/"
 >
<channel>
    <title><?php bloginfo_rss('name'); ?></title>
    <link><?php bloginfo_rss('url'); ?></link>
    <description><?php bloginfo_rss('description'); ?></description>
    <pubDate><?php echo date('D, d M Y H:i:s +0000'); ?></pubDate>
    <language><?php bloginfo_rss('language'); ?></language>
    <wp:wxr_version><?php echo WXR_VERSION; ?></wp:wxr_version>
    <wp:base_site_url><?php echo $this->wxr_site_url(); ?></wp:base_site_url>
    <wp:base_blog_url><?php bloginfo_rss('url'); ?></wp:base_blog_url>
    
<?php $this->wxr_authors_list($post_ids); ?>

<?php foreach ($cats as $c) : ?>
    <wp:category>
        <wp:term_id><?php echo $c->term_id ?></wp:term_id>
        <wp:category_nicename><?php echo $c->slug; ?></wp:category_nicename>
        <wp:category_parent><?php echo $c->parent ? $cats[$c->parent]->slug : ''; ?></wp:category_parent>
        <?php $this->wxr_cat_name($c); ?>
        <?php $this->wxr_category_description($c); ?>
    </wp:category>
<?php endforeach; ?>
<?php foreach ($tags as $t) : ?>
    <wp:tag>
        <wp:term_id><?php echo $t->term_id ?></wp:term_id>
        <wp:tag_slug><?php echo $t->slug; ?></wp:tag_slug>
        <?php $this->wxr_tag_name($t); ?>
        <?php $this->wxr_tag_description($t); ?>
    </wp:tag>
<?php endforeach; ?>
<?php foreach ($terms as $t) : ?>
    <wp:term>
        <wp:term_id><?php echo $t->term_id ?></wp:term_id>
        <wp:term_taxonomy><?php echo $t->taxonomy; ?></wp:term_taxonomy>
        <wp:term_slug><?php echo $t->slug; ?></wp:term_slug>
        <wp:term_parent><?php echo $t->parent ? $terms[$t->parent]->slug : ''; ?></wp:term_parent>
        <?php $this->wxr_term_name($t); ?>
        <?php $this->wxr_term_description($t); ?>
    </wp:term>
<?php endforeach; ?>
<?php if ('all' == $args['content']) $this->wxr_nav_menu_terms(); ?>

	<?php 
	do_action('rss2_head'); 
	?>
	
<?php if ($post_ids) {
    global $wp_query;
    
    $wp_query->in_the_loop = true; // Fake being in the loop.
    
    // fetch 20 posts at a time rather than loading the entire table into memory
    while ($next_posts            = array_splice($post_ids, 0, 20)) {
    $where = 'WHERE ID IN (' . join(',', $next_posts) . ')';
    $posts = $wpdb->get_results("SELECT * FROM {$wpdb->posts} $where");

    // Begin Loop
    foreach ($posts as $post) {
        setup_postdata($post);
        $is_sticky = is_sticky($post->ID) ? 1 : 0;
?>
    <item>
        <title><?php echo apply_filters('the_title_rss', $post->post_title); ?></title>
        <link><?php the_permalink_rss() ?></link>
        <pubDate><?php echo mysql2date('D, d M Y H:i:s +0000', get_post_time('Y-m-d H:i:s', true), false); ?></pubDate>
        <dc:creator><?php echo get_the_author_meta('login'); ?></dc:creator>
        <guid isPermaLink="false"><?php esc_url(the_guid()); ?></guid>
        <description></description>
        <content:encoded><?php 
        	echo $this->wxr_cdata(apply_filters('the_content_export', $post->post_content)); ?>
    	</content:encoded>
        <excerpt:encoded><?php 
        	echo $this->wxr_cdata(apply_filters('the_excerpt_export', $post->post_excerpt)); 
    	?></excerpt:encoded>
        <wp:post_id><?php echo $post->ID; ?></wp:post_id>
        <wp:post_date><?php echo $post->post_date; ?></wp:post_date>
        <wp:post_date_gmt><?php echo $post->post_date_gmt; ?></wp:post_date_gmt>
        <wp:comment_status><?php echo $post->comment_status; ?></wp:comment_status>
        <wp:ping_status><?php echo $post->ping_status; ?></wp:ping_status>
        <wp:post_name><?php echo $post->post_name; ?></wp:post_name>
        <wp:status><?php echo $post->post_status; ?></wp:status>
        <wp:post_parent><?php echo $post->post_parent; ?></wp:post_parent>
        <wp:menu_order><?php echo $post->menu_order; ?></wp:menu_order>
        <wp:post_type><?php echo $post->post_type; ?></wp:post_type>
        <wp:post_password><?php echo $post->post_password; ?></wp:post_password>
        <wp:is_sticky><?php echo $is_sticky; ?></wp:is_sticky>
<?php if ($post->post_type == 'attachment') : ?>
        <wp:attachment_url><?php echo wp_get_attachment_url($post->ID); ?></wp:attachment_url>
<?php endif; ?>
<?php $this->wxr_post_taxonomy(); ?>
<?php $postmeta = $wpdb->get_results($wpdb->prepare("SELECT * FROM $wpdb->postmeta WHERE post_id = %d", $post->ID));
        foreach ($postmeta as $meta) :
            if (apply_filters('wxr_export_skip_postmeta', false, $meta->meta_key, $meta))
                    continue;
            ?>
        	<wp:postmeta>
                <wp:meta_key><?php echo $meta->meta_key; ?></wp:meta_key>
                <wp:meta_value><?php echo $this->wxr_cdata($meta->meta_value); ?></wp:meta_value>
            </wp:postmeta>
<?php endforeach;

			$_comments = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $wpdb->comments WHERE comment_post_ID = %d AND comment_approved <> 'spam'", $post->ID ) );
			$comments = array_map( 'get_comment', $_comments );
            foreach ($comments as $c) : ?>
            <wp:comment>
                <wp:comment_id><?php echo $c->comment_ID; ?></wp:comment_id>
                <wp:comment_author><?php echo $this->wxr_cdata($c->comment_author); ?></wp:comment_author>
                <wp:comment_author_email><?php echo $c->comment_author_email; ?></wp:comment_author_email>
                <wp:comment_author_url><?php echo esc_url_raw($c->comment_author_url); ?></wp:comment_author_url>
                <wp:comment_author_IP><?php echo $c->comment_author_IP; ?></wp:comment_author_IP>
                <wp:comment_date><?php echo $c->comment_date; ?></wp:comment_date>
                <wp:comment_date_gmt><?php echo $c->comment_date_gmt; ?></wp:comment_date_gmt>
                <wp:comment_content><?php echo $this->wxr_cdata($c->comment_content) ?></wp:comment_content>
                <wp:comment_approved><?php echo $c->comment_approved; ?></wp:comment_approved>
                <wp:comment_type><?php echo $c->comment_type; ?></wp:comment_type>
                <wp:comment_parent><?php echo $c->comment_parent; ?></wp:comment_parent>
                <wp:comment_user_id><?php echo $c->user_id; ?></wp:comment_user_id>
<?php	        $c_meta = $wpdb->get_results($wpdb->prepare("SELECT * FROM $wpdb->commentmeta WHERE comment_id = %d", $c->comment_ID));
            	foreach ($c_meta as $meta) :
					if ( apply_filters( 'wxr_export_skip_commentmeta', false, $meta->meta_key, $meta ) ) {
						continue;
					}		
                ?>
            	<wp:commentmeta>
                    <wp:meta_key><?php echo $meta->meta_key; ?></wp:meta_key>
                    <wp:meta_value><?php echo $this->wxr_cdata($meta->meta_value); ?></wp:meta_value>
                </wp:commentmeta>
<?php 			endforeach; ?>
            </wp:comment>
<?php		endforeach; ?>
        </item>
<?php
        }
    	}
} ?>
</channel>
</rss>
<?php
    die();
    }

    /**
     * Wrap given string in XML CDATA tag.
     *
     * @since 2.1.0
     *
     * @param string $str String to wrap in XML CDATA tag.
     * @return string
     */
    function wxr_cdata($str) {
        if (seems_utf8($str) == false)
            $str = utf8_encode($str);

        // $str = ent2ncr(esc_html($str));
        $str = '<![CDATA[' . str_replace(']]>', ']]]]><![CDATA[>', $str) . ']]>';

        return $str;
    }

    /**
     * Return the URL of the site
     *
     * @since 2.5.0
     *
     * @return string Site URL.
     */
    function wxr_site_url() {
        // ms: the base url
        if (is_multisite())
            return network_home_url();
        // wp: the blog url
        else
            return get_bloginfo_rss('url');
    }

    /**
     * Output a cat_name XML tag from a given category object
     *
     * @since 2.1.0
     *
     * @param object $category Category Object
     */
    function wxr_cat_name($category) {
        if (empty($category->name))
            return;

        echo '<wp:cat_name>' . $this->wxr_cdata($category->name) . '</wp:cat_name>';
    }

    /**
     * Output a category_description XML tag from a given category object
     *
     * @since 2.1.0
     *
     * @param object $category Category Object
     */
    function wxr_category_description($category) {
        if (empty($category->description))
            return;

        echo '<wp:category_description>' . $this->wxr_cdata($category->description) . '</wp:category_description>';
    }

    /**
     * Output a tag_name XML tag from a given tag object
     *
     * @since 2.3.0
     *
     * @param object $tag Tag Object
     */
    function wxr_tag_name($tag) {
        if (empty($tag->name))
            return;

        echo '<wp:tag_name>' . $this->wxr_cdata($tag->name) . '</wp:tag_name>';
    }

    /**
     * Output a tag_description XML tag from a given tag object
     *
     * @since 2.3.0
     *
     * @param object $tag Tag Object
     */
    function wxr_tag_description($tag) {
        if (empty($tag->description))
            return;

        echo '<wp:tag_description>' . $this->wxr_cdata($tag->description) . '</wp:tag_description>';
    }

    /**
     * Output a term_name XML tag from a given term object
     *
     * @since 2.9.0
     *
     * @param object $term Term Object
     */
    function wxr_term_name($term) {
        if (empty($term->name))
            return;

        echo '<wp:term_name>' . $this->wxr_cdata($term->name) . '</wp:term_name>';
    }

    /**
     * Output a term_description XML tag from a given term object
     *
     * @since 2.9.0
     *
     * @param object $term Term Object
     */
    function wxr_term_description($term) {
        if (empty($term->description))
            return;

        echo '<wp:term_description>' . $this->wxr_cdata($term->description) . '</wp:term_description>';
    }

    /**
     * Output list of authors with posts
     *
     * @since 3.1.0
     */
    function wxr_authors_list($post_ids) {
        global $wpdb;

        $inposts=implode(",",(array) $post_ids);
        $authors   = array();
        //$results   = $wpdb->get_results("SELECT DISTINCT post_author FROM $wpdb->posts WHERE post_status != 'auto-draft'");
        $results   = $wpdb->get_results("SELECT DISTINCT post_author FROM $wpdb->posts WHERE ID in ($inposts)");
        foreach ((array) $results as $result)
            $authors[] = get_userdata($result->post_author);

        $authors = array_filter($authors);

        foreach ($authors as $author) {
            echo "\t<wp:author>";
            echo '<wp:author_id>' . $author->ID . '</wp:author_id>';
            echo '<wp:author_login>' . $author->user_login . '</wp:author_login>';
            echo '<wp:author_email>' . $author->user_email . '</wp:author_email>';
            echo '<wp:author_display_name>' . $this->wxr_cdata($author->display_name) . '</wp:author_display_name>';
            echo '<wp:author_first_name>' . $this->wxr_cdata($author->user_firstname) . '</wp:author_first_name>';
            echo '<wp:author_last_name>' . $this->wxr_cdata($author->user_lastname) . '</wp:author_last_name>';
            echo "</wp:author>\n";
        }
    }

    /**
     * Ouput all navigation menu terms
     *
     * @since 3.1.0
     */
    function wxr_nav_menu_terms() {
        $nav_menus = wp_get_nav_menus();
        if (empty($nav_menus) || !is_array($nav_menus))
            return;

        foreach ($nav_menus as $menu) {
            echo "\t<wp:term><wp:term_id>{$menu->term_id}</wp:term_id><wp:term_taxonomy>nav_menu</wp:term_taxonomy><wp:term_slug>{$menu->slug}</wp:term_slug>";
            $this->wxr_term_name($menu);
            echo "</wp:term>\n";
        }
    }

    /**
     * Output list of taxonomy terms, in XML tag format, associated with a post
     *
     * @since 2.3.0
     */
    function wxr_post_taxonomy() {
        $post = get_post();

        $taxonomies = get_object_taxonomies($post->post_type);
        if (empty($taxonomies))
            return;
        $terms      = wp_get_object_terms($post->ID, $taxonomies);

        foreach ((array) $terms as $term) {
            echo "\t\t<category domain=\"{$term->taxonomy}\" nicename=\"{$term->slug}\">" . $this->wxr_cdata($term->name) . "</category>\n";
        }
    }

    function wxr_filter_postmeta($return_me, $meta_key) {
        if ('_edit_lock' == $meta_key)
            $return_me = true;
        return $return_me;
    }

    function admin_init() {
        // If the 'download' URL parameter is set, a WXR export file is baked and returned.
        if (isset($_GET['dms3export'])) {
            $args = array();

            if (!isset($_GET['content']) || 'all' == $_GET['content']) {
                $args['content'] = 'all';
            }
            elseif ('posts' == $_GET['content']) {
                $args['content'] = 'post';

                if ($_GET['cat'])
                    $args['category'] = (int) $_GET['cat'];

                if ($_GET['post_author'])
                    $args['author'] = (int) $_GET['post_author'];

                if ($_GET['post_start_date'] || $_GET['post_end_date']) {
                    $args['start_date'] = $_GET['post_start_date'];
                    $args['end_date']   = $_GET['post_end_date'];
                }

                if ($_GET['post_status'])
                    $args['status'] = $_GET['post_status'];
            } elseif ('pages' == $_GET['content']) {
                $args['content'] = 'page';

                if ($_GET['page_author'])
                    $args['author'] = (int) $_GET['page_author'];

                if ($_GET['page_start_date'] || $_GET['page_end_date']) {
                    $args['start_date'] = $_GET['page_start_date'];
                    $args['end_date']   = $_GET['page_end_date'];
                }

                if ($_GET['page_status'])
                    $args['status'] = $_GET['page_status'];
            } elseif ('attachment' == $_GET['content']) {
                $args['content'] = 'attachment';

                if ($_GET['attachment_start_date'] || $_GET['attachment_end_date']) {
                    $args['start_date'] = $_GET['attachment_start_date'];
                    $args['end_date']   = $_GET['attachment_end_date'];
                }
            }
            else {
                $post_type       = $_GET['content'];
                $args['content'] = $post_type;

                if ($_GET[$post_type . '_author'])
                    $args['author'] = (int) $_GET[$post_type . '_author'];

                if ($_GET[$post_type . '_start_date'] || $_GET[$post_type . '_end_date']) {
                    $args['start_date'] = $_GET[$post_type . '_start_date'];
                    $args['end_date']   = $_GET[$post_type . '_end_date'];
                }

                if ($_GET[$post_type . '_status'])
                    $args['status'] = $_GET[$post_type . '_status'];
            }

            /**
             * Filters the export args.
             *
             * @since 3.5.0
             *
             * @param array $args The arguments to send to the exporter.
             */
            $args = apply_filters('export_args', $args);

            $this->export_wp($args);
            die();
        }
    }

}