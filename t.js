(function(){
	///depend on lodash
	angular.module("myapp", []).
				directive("ac", ['$templateCache', aotuComplete]);

	function aotuComplete($templateCache){	
		$templateCache.put('default.html', 
			'<div class="autocomplete-container">' +
				'<div class="dropdown">' + 
					'<input type="text" ng-Model="inputText" placeholder={{placeholder}}/>' + 
					'<div ng-show="showResult">' + 
						'<ul class="dropdown-menu">' +
							'<li ng-class="$index === curIdx ? \'active\': \'\'" ng-repeat="item in selectedList"><a>{{item.displayText}}</a></li>' + 
						'</ul>' +
					'</div>' + 
				'</div>' +
			'</div>'
			);
		return {
			restrict: "EA",
			scope: {
				"delimiter" : "@delimiter",
				"placeholder" : "@placeholder",
				"searchfield" : "@searchfield",
				"ignorefield" : "@ignorefield",
				"dataInputCol" : "=dataInputCol"
			},
			templateUrl: function(ele, attrs){
				return attrs.templateurl || 'default.html';
			},
			link: function($scope, ele,  attr){
				$scope.showResult = true;
				$scope.lastSearchTerm = "";
				$scope.searchTerm = "";
				$scope.curIdx = -1;
				$scope.dataList = []; //all elements 
				$scope.selectedList = []; //[{title: "abc", name:xxx, displayText:xxx}]

				var Keys = {
					LEFT: 37,
					UP: 38,
					RIGHT: 39,
					DOWN: 40,
					ESC: 27,
					ENTER: 13
				};
				
				$scope.$watch("inputText", function(newvalue, oldvalue){
					var newstr = _.trim(newvalue),
						oldstr = _.trim(oldvalue);
					if(newstr === oldstr)
						return;
					if(!$scope.needSearch(newstr, oldstr))
						return;
					$scope.filterSearchKey(newstr, oldstr);
					$scope.doSearch();
				});
				
				$scope.needSearch = function(newstr, oldstr){
					//todo
					if(newstr!==oldstr)
						return true;
					return false;
				};

				$scope.filterSearchKey = function(newstr, oldstr){
					//filter it, use delimiter	
					//todo

					$scope.lastSearchTerm = $scope.searchTerm = newstr;
					if(!$scope.lastSearchTerm)
						;
					else{
					}


				};

				$scope.doSearch = function(){

				};
				var inputCtrl = ele.find('input');
				ele.on('keyup', function(e){
					var keyCode = e.keyCode | e.which;
					if(keyCode === Keys.Down){
						if($scope.selectedList.length>0 && $scope.curIdx>=-1){
							$scope.curIdx ++;
						}
						
					}
					else if(keyCode === Keys.UP){

					}
					else if(keyCode === Keys.LEFT){

					}
					else if(keyCode === Keys.RIGHT){

					}
					$scope.$apply();
					e.preventDefault;
					e.stopPropagation();

				});			
				
				//preprocess the datalist, deal with delimiter and igore term
				$scope.processData = function(datalist, sfield){
					if(!datalist || datalist.length==0 || !sfield || !datalist[0][sfield])
						return;
					var result = [];
					for(var i = 0; i<datalist.length; i++){
						if(datalist[sfield].)
					}
				}
				
			}
		};	
	}

})();

// https://github.com/JustGoscha/allmighty-autocomplete/blob/master/script/autocomplete.js
// https://github.com/darylrowland/angucomplete/blob/master/angucomplete.js
// https://github.com/ghiden/angucomplete-alt/blob/master/angucomplete-alt.js
// https://github.com/hakib/MassAutocomplete/blob/master/massautocomplete.js