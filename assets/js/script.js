/**
 * Display of the entry form for the URL to test and the test button on the site CPT page 
 */
jQuery( function(){
    jQuery( 'body.post-type-site .wrap' )
        .append( '<div class="cust-button-div">'+
                    '<input type="text" placeholder="Saisissez l\'URL de votre page" id="website-url"/>'+
                    '<button type="button" class="test-button" id="lunch-test" onclick="sp_start_site_test()">Commencer le test</button><br/>'+
                    'Ex. : http://www.satellitewp.com'+
                '</div>'+
                '<div id="test-results"></div>' );
});

/**
 * Ajax function to post datas that must be insert into the WPD
 * @param {string} tested_url The url of site page which was tested.
 * @param {string} data_to_insert test's results returned by the API.
 */
function sp_ajax_post(tested_url, data_to_insert){
    /* Post test results for an insertion in the database */
    jQuery.ajax({
        type: 'POST',
        url: ajax_object.ajax_url,
        data: {
            'tested_page_url': tested_url,
            'data_to_insert': data_to_insert,
            'action': 'insert_results'
        },
        success: function( ajax_response ){
            /* Display a text if ajax request is a success */                        
            jQuery( '#test-results' ).text( 'Succès de l\'opération !' );
            location.reload(); //Reload page to see updates
        },
        error: function(){
            /* Display a text if ajax request is failed */                        
            jQuery( '#test-results' ).text( 'Une erreur s\'est produite !' );
        }
    });
}

/**
 * Handle the performance testing process errors
 */
 function sp_handle_site_errors( test_response ){
    if ( !test_response.ok ){
        throw Error( test_response.statusText );
    }
    return test_response;
}

/**
 * Handle the performance testing process
 * 
 * get the URL to test
 * add it to the PSI API's parameter
 * Start by checking the response status before parsing the response as JSON
 * Then parse the response as JSON
 * Get perform values that we look
 */
 function sp_start_site_test(){ 
    /* document.getElementById( 'test-results' ).innerHTML = '<img class="test-loader-img" src="../wp-content/plugins/site-cpt/assets/images/loader.gif"><span class="test-loader">Veuillez patienter...</span>';*/
    jQuery( '#test-results' ).html( '<img class="test-loader-img" src="../wp-content/plugins/site-cpt/assets/images/loader.gif"><span class="test-loader">Veuillez patienter...</span>' );
    const site_url = document.getElementById( 'website-url' ).value; //Get page URL to test
    const api_call = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url='+site_url; //Calling the PSI API
    
    const response = fetch( api_call )
        .then( sp_handle_site_errors )
        .then( function( response ) {
            response.json().then( function( data ){     
                const score = data.lighthouseResult.categories.performance.score;
                const total_blocking_time = data.lighthouseResult.audits['total-blocking-time'].displayValue;
                const largest_contentful_paint = data.lighthouseResult.audits['largest-contentful-paint'].displayValue;      
                const first_contentful_paint = data.lighthouseResult.audits['first-contentful-paint'].displayValue;
                const speed_index = data.lighthouseResult.audits['speed-index'].displayValue;
                const time_to_interactive = data.lighthouseResult.audits['interactive'].displayValue;
                const first_meaningful_paint = data.lighthouseResult.audits['first-meaningful-paint'].displayValue;
                const first_CPU_idle = data.lighthouseResult.audits['first-cpu-idle'].displayValue;
                const estimated_input_latency = data.lighthouseResult.audits['estimated-input-latency'].displayValue;

                const defer_offscreen_images = data.lighthouseResult.audits['offscreen-images'].details.overallSavingsMs;
                const properly_size_images = data.lighthouseResult.audits['uses-responsive-images'].details.overallSavingsMs;
                const render_blocking_resources = data.lighthouseResult.audits['render-blocking-resources'].details.overallSavingsMs;
                const remove_unused_css = data.lighthouseResult.audits['unused-css-rules'].details.overallSavingsBytes;
                const saving_unused_css = parseInt( remove_unused_css );

                /* Building a string in a json format with test results */
                url_and_score = '{"url":"'+site_url+'", "score":'+score+'}';

                lab_data = '[{"name":"First contentful paint", "value":"'+first_contentful_paint+'"},'+
                            '{"name":"Speed index", "value":"'+speed_index+'"},'+
                            '{"name":"Largest contentful paint", "value":"'+largest_contentful_paint+'"},'+
                            '{"name":"Time to interaction", "value":"'+time_to_interactive+'"},'+
                            '{"name":"Total blocking time", "value":"'+total_blocking_time+'"},'+
                            '{"name":"First meaningful paint", "value":"'+first_meaningful_paint+'"},'+
                            '{"name":"First CPU Idle", "value":"'+first_CPU_idle+'"},'+
                            '{"name":"Estimated input latency", "value":"'+estimated_input_latency+'"}]';

                opportunities = '[{"name":"Defer offscreen images (estimated saving time)", "value":"'+defer_offscreen_images+' ms"},'+
                                '{"name":"Properly size images (estimated saving time)", "value":"'+properly_size_images+' ms"},'+
                                '{"name":"Render blocking resources (estimated saving time)", "value":"'+render_blocking_resources+' ms"},'+
                                '{"name":"Remove unused CSS (estimated saving memory)", "value":"'+parseInt(saving_unused_css/1024)+' KiB"}]';

                site_test_results = '['+url_and_score+','+lab_data+','+opportunities+']';
                
                sp_ajax_post(site_url, site_test_results);
            });            
        }).catch( function( error ){
            /* Display a message if there is an error in the process */
            api_error_message = '<div id="test-error-message"><span>Erreur !!</span> <br/>'+
                'La page que vous avez demandée n\'a pas pu être chargée correctement.<br/>'+
                'Assurez-vous de tester la bonne URL (au format http://www.nom-de-domaine.extension) et vérifiez que le serveur répond correctement à toutes les requêtes</div>';       
            jQuery( '#test-results' ).html( api_error_message );
        });
}
