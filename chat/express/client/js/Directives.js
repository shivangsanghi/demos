(function(){
	var directives = angular.module('directives',[]);
	directives.directive('onEnter',function(){
		return {	
			link : function($scope,element,attrs){
				element.on('keyup',function(event){
					if(event.keyCode === 13){
						attrs && attrs['onEnter'] && $scope[attrs['onEnter']] && $scope[attrs['onEnter']]();
					}
				});
			}
		}
	})
})();