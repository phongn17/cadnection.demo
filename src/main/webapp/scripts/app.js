'use strict';

/**
 * @ngdoc overview
 * @name twigkitLightApp
 * @description
 * # twigkitLightApp
 *
 * Main module of the application.
 */
// NOTE The string value "Application" is replaced by the ThemeService.java when the application is created
var application_name = "Application";

var modules = ['ui.router', 'lightning', 'ngAnimate', 'angularResizable'];
angular.module('twigkitLightApp', modules)
    .run(['$rootScope', '$timeout', 'ValueService', '$location', '$window', function ($rootScope, $timeout, ValueService, $location, $window) {
        $rootScope.application_name = $window.application_title;

        ValueService.setValue('application_name', application_name);

        $rootScope.$on('$stateChangeError', function(event) {
            $timeout(function(){
                $location.path('/');
            }, 0);
        });
    }]);

angular
    .module("twigkitLightApp")
    .controller("ctrl", ['$scope', 'ValueService',
        function ($scope, ValueService) {
            $scope.application_name = application_name;

            checkForLoginError();

            function checkForLoginError() {
                var queryParamStr = window.location.search;
                if (queryParamStr.indexOf('login_error') > -1) {
                    $scope.error = true;
                }
            }

            $scope.changedValue = function (item) {
                // TODO: if item not null then activate button
                $scope.topic = item.id;
            }
        }]);