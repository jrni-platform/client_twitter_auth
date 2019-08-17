import twitterTemplate from './twitter_panel.html';

import Configurator from 'bookingbug-configurator-js';
import { bbAuthorisation } from 'bookingbug-core-js';


// add a page to the client profile
Configurator.addNamedTab('client_profile', { 
    name: 'Twitter',
    path: '.views({view: "twitter"})',
    position: -1
});

// add a new page
Configurator.addPage('Clients', 'twitter', { 
    style: 'tab',
    layout: [
        [
          {
            type: 'bb-twitter-timeline-panel',
            width: 12,
            index: 0,
            panel_params: {
            }
          }
        ]
    ]
});

class TwitterController{
    constructor() {
    
       this.client = this.filter.client;

       this.twitterURL = `https://twitter.com/{this.client}?ref_src=twsrc%5Etfw`;

    }
}

const twitterPanel = {
    templateUrl: twitterTemplate.id,
    controller: TwitterController,
    bindings: {
        config: '=',
        filter: '='
    }
};

angular.module('BBAdminDashboard.services').component('bbTwitterTimelinePanel', twitterPanel);
