(function(){
	angular.module('providers',[]).config(['$httpProvider',function($httpProvider){
		$httpProvider.defaults.headers.common['Accept'] = 'application/json, text/javascript';
	}]);
})();