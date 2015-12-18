(function(){
	///depend on lodash
	angular.module("myapp", []).
				directive("ac", ['$templateCache', '$sce', '$timeout', aotuComplete]);

	function aotuComplete($templateCache, $sce,  $timeout){	
		$templateCache.put('default.html', 
			'<div class="autocomplete-container">' +
				'<div class="dropdown">' + 
					'<input type="text" ng-Model="inputText" placeholder={{placeholder}} ng-blur="onBlur()"/>' + 
					'<div ng-show="startSearch">' + 
						'<ul class="dropdown-menu" >' +
							'<li ng-class="$index === curIdx ? \'active\': \'\'" ng-repeat="item in dataList | filter: {match:true}">' + 
								'<a ng-bind-html="item.displayText" ng-click="selectItem(item)"></a>' + 
							'</li>' + 
							'<li ng-show="{{(dataList | filter: {match:true}).length===0}}"><a><em><strong>No Match Result</strong></em></a></li>' + 
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
				"datainputcol" : "=datainputcol",
				"docustomaction": "=doCustomAction"
			},
			templateUrl: function(ele, attrs){
				return attrs.templateurl || 'default.html';
			},
			link: function($scope, ele,  attr){
				$scope.lastSearchTerm = "";
				$scope.searchTerm = "";
				$scope.startSearch = false; 
				$scope.curIdx = -1;
				$scope.dataList = []; //all elements 
				$scope.isMatchItem = false;
				$scope.selectedList = []; //[{searchTitle: "abc", title:xxx, displayText:xxx}]

				var inputCtrl = ele.find('input'),
					ulCtrl = ele.find('ul');
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
					if(!$scope.searchTerm)
						return;
					$scope.startSearch = true;
					_.forEach($scope.dataList, function(n, key){
						if(n.searchTitle && n.searchTitle.toLowerCase().indexOf($scope.searchTerm)>=0){
							n.match = true;
							var title = n.title;
							var reg = new RegExp($scope.searchTerm, 'i');
                            var replaceStr = title.match(reg)[0];
                            n.displayText = $sce.trustAsHtml( title.replace(reg, '<span><strong>'+ replaceStr +'</strong></span>'));
						}
						else{
							n.match = false;
						}
					});
				};

				$scope.selectItem = function(sitem){
					$scope.selectedList.push(sitem);
					_.forEach($scope.dataList, function(n, key){
						n.match = false;
					});
				}
				
				$scope.onBlur = function(){
					$timeout(function(){
						//$scope.startSearch = false;	
					});
				}
				
				ele.on('keyup', function(e){
					var keyCode = e.keyCode | e.which,
						matchList = _.where($scope.dataList, {match: true});
					switch(keyCode){
						case Keys.DOWN: 
							if(matchList.length>0 && $scope.curIdx>=-1 && matchList.length > $scope.curIdx+1 ){
								$scope.curIdx++;
							}
							break;
						case Keys.UP:
							if(matchList.length>0 && $scope.curIdx>-1)
								$scope.curIdx--;
							break;
						case Keys.LEFT:
							break;
						case Keys.RIGHT:
							break;
						case Keys.ENTER:
							if($scope.curIdx >-1 && $scope.curIdx+1 <= matchList.length){
								var item = matchList[$scope.curIdx];
								$scope.selectItem(item);
							}
							break;
					}
					$scope.$apply();
					e.preventDefault;
					e.stopPropagation();
				});			
				//todo
				$scope.$watch("curIdx", function(nv, ov){
					if(nv===ov)
						return;
					if(nv>-1){ //has list, change focus					 	
					 	ulCtrl[0].focus();
					}
					if(nv==-1){						
						inputCtrl[0].focus();
					}
				});
				//preprocess the datalist, deal with delimiter and igore term
				var processData = function(datalist, sfield, ignore){
					if(!datalist || datalist.length==0 || !sfield || !datalist[0][sfield])
						return;
					var result = [];
					for(var i = 0; i<datalist.length; i++){
						var ignoreIdx = datalist[i][sfield].indexOf(ignore);
						if(ignoreIdx>=0){
							var effectiveStr = datalist[i][sfield].substring(0, ignoreIdx);
							result.push({
								title: datalist[i][sfield],
								searchTitle: effectiveStr,
								displayText: $sce.trustAsHtml(datalist[i][sfield]),
								match: true //init list 
							});
						}
					}
					$scope.dataList = result;
				}
				processData($scope.datainputcol, $scope.searchfield, $scope.ignorefield );
			}
		};	
	}

})();

// https://github.com/JustGoscha/allmighty-autocomplete/blob/master/script/autocomplete.js
// https://github.com/darylrowland/angucomplete/blob/master/angucomplete.js
// https://github.com/ghiden/angucomplete-alt/blob/master/angucomplete-alt.js
// https://github.com/hakib/MassAutocomplete/blob/master/massautocomplete.js