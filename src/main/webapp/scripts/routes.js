'use strict';

angular.module('twigkitLightApp').config(function($stateProvider, $urlRouterProvider,$locationProvider) {

  // For any unmatched url, redirect to homepage /
  var defaultPage = 'search';
  $urlRouterProvider.otherwise(defaultPage);
  $locationProvider.html5Mode(false);


  // Default views
  $stateProvider

    // Default rule to display view based on url
    .state('page', {
      url: '/{slug}',
      templateUrl: function (params) {

        if (params.slug === '') {
          params.slug = defaultPage;
        }

        return 'views/' + params.slug + '.html';
      },
      controller: 'MainCtrl'
    })

    .state('details', {
      url: '/{slug}/{id}',
      templateUrl: function (params) {

        if (params.slug === '' || params.id === '') {
          params.slug = defaultPage;
        }

        return 'views/' + params.slug + '-detail.html';
      },
      controller: 'MainCtrl'
    })

    .state('code-editor', {
      url:'/code-editor/edit/{file}',
      templateUrl: 'views/code-editor/edit.html',
      controller: 'CodeEditorCtrl'
    });
});
