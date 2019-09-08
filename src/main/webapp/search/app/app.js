'use strict';
const BUILD_PATH = '/search/build/';
const basePath = (document.getElementsByTagName('base')[0] || { href: '' }).href;
__webpack_public_path__ = window.__webpack_public_path__ = basePath.replace(/\/$/, '') + BUILD_PATH;

import { RoutesModule } from './routes/routes.module.js';
import { SearchController } from './controllers/search.controller';

let appModule = angular
    .module('appStudioSearch', [
        , 'ui.router'
        , 'ngAnimate'
        , 'lightning'
        , RoutesModule.name
    ])
    .run(['$rootScope', '$window', function ($rootScope, $window) {
        $rootScope.application_name = $window.application_title;

        $rootScope.$on('response_response_error', function (response) {
            $rootScope.showErrorModal = true;
        });

        $rootScope.closeErrorModal = function () {
            $rootScope.showErrorModal = false;
        }
    }])
    .controller('searchCtrl', SearchController);

angular.bootstrap(document, ['appStudioSearch']);
