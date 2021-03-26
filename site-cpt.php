<?php
/**
 * Plugin Name: Site Custom Post Type
 * Description: CPT to test the performance of site pages with the Google PageSpeed Insights API
 * Version: 1.0
 * Text Domain: site-cpt
 */

/**
 * Create the site custom post type
 */
function sp_create_site(){
    $labels = array(
        'name'      => __( 'Résultat des tests de performance', 'site-cpt' ),
        'menu_name' => __( 'Tester la performance', 'site-cpt' )
    );
    $args = array(
        'labels'        => $labels,
        'description'   => 'CPT to test the performance of site pages with the Google PageSpeed Insights API',
        'public'        => true,
        'menu_position' => 80,
        'menu_icon'     => 'dashicons-chart-line',
        'capabilities'  => array(
            'create_posts' => 'do_not_allow'
        )
    );
    register_post_type( 'site', $args );
}
add_action( 'init', 'sp_create_site' );

/**
 * Add a Score, a Lab data and an Opportunities columns to the Site CPT page
 */
function sp_add_site_columns( $columns ){
    $columns = array(
        'title'         => __( 'URL de la page' ),
        'score'         => __( 'Score', 'site-cpt' ),
        'lab_data'      => __( 'Lab data', 'site-cpt' ),
        'opportunities' => __( 'Opportunités', 'site-cpt' ),
        'date'          => __( 'Date', 'site-cpt' )
    );
    return $columns;
}
add_filter( 'manage_posts_columns', 'sp_add_site_columns' );

/**
 * Display Score, Lab data and Opportunities results in the appropriate columns
 */
function sp_display_site_columns( $column, $post_id ){
    //Get test results from posts table
    $test_results = get_post_field( 'post_content', $post_id );
    
    //Verify if the "content" column from posts table is not empty
    if( !empty( $test_results ) ){
        $test_data = json_decode( $test_results, true );
        if( 'score' === $column ){
            $site_score = doubleval( $test_data[0]['score'] );

            //Attribute a class color depending to the site score value
            switch( $site_score ){
                case( $site_score < 0.5 ):
                    $color_class = 'low-score';
                    break;
                case( $site_score >= 0.5 && $site_score < 0.75 ):
                    $color_class = 'middle-score';
                    break;
                default:
                    $color_class = 'high-score';
                    break;
            }
            echo '<span class="site-score '.$color_class.'">'.$site_score.'</span>';
        }elseif( 'lab_data' === $column ){
            foreach( $test_data[1] as $value ){
                echo '<span class="test-result-key">'.$value['name'].'</span> : <span class="test-result-value">'.$value['value'].'</span><br/>';
            }
        }else{
            foreach( $test_data[2] as $value ){
                echo '<span class="test-result-key">'.$value['name'].'</span> : <span class="test-result-value">'.$value['value'].'</span><br/>';
            }
        }
    }
    else{
        if( 'score' === $column ){
            echo 'Colonne vide';
        }elseif( 'lab_data' === $column ){
            echo 'Colonne vide';
        }else{
            echo 'Colonne vide';
        }
    }
}
add_filter('manage_posts_custom_column', 'sp_display_site_columns', 10, 2);

/**
 * Adding scripts (css and js) to the Site CPT page
 */
function sp_add_scripts_site(){
    wp_enqueue_style( 'style', plugins_url( 'assets/css/style.css', __file__ ) );
    wp_enqueue_script( 'script', plugins_url( 'assets/js/script.js', __file__ ) );
    wp_localize_script( 'script', 'ajax_object', array( 'ajax_url' => admin_url( 'admin-ajax.php' ) ) );
}
add_action( 'admin_head', 'sp_add_scripts_site' );

/**
 * Insert the test results into the posts table 
 */
function sp_insert_results(){
    global $wpdb;
    $post = array(
        'post_content' => $_POST['data_to_insert'],
        'post_title'   => $_POST['tested_page_url'],
        'post_status'  => 'private',
        'post_type'    => 'site'
    );
    if( wp_insert_post( $post, true ) !== 0){
        echo 'Insertion réalisée avec succès';
    }else{
        echo 'Une erreur s\'est produite!';
    }
    die();
}
add_action( 'wp_ajax_nopriv_insert_results', 'sp_insert_results' );
add_action( 'wp_ajax_insert_results', 'sp_insert_results' );
