(function(){
	///depend on lodash
	angular.module("myapp", []).
				directive("ac", ['$templateCache', '$sce', '$timeout', aotuComplete]);

	function aotuComplete($templateCache, $sce,  $timeout){	
		$templateCache.put('default.html', 
			'<div class="autocomplete-container">' +
				'<div class="input-group">' + 
					'<span class="input-group-addon" id="sizing-addon2"><i class="{{signclass}}"></i></span>' + 
					'<input type="text" ng-disabled="disableinput" ng-Model="inputText" class="{{inputclass}}" placeholder={{placeholder}} ng-blur="onBlur()" ng-change="onChange()" aria-describedby="sizing-addon2"/>' + 
					'<div ng-show="startSearch">' + 
						'<ul class="dropdown-menu" >' +
							'<li ng-class="$index === curIdx ? \'active\': \'\'" ng-repeat="item in dataList | filter: {match:true}" ng-mousedown="selectItem(item)">' + 
								'<a ng-bind-html="item.displayText" ></a>' + 
							'</li>' + 
							'<li ng-show="(dataList | filter: {match:true}).length===0"><a><em><strong>No Match Result</strong></em></a></li>' + 
						'</ul>' +
					'</div>' + 
				'</div>' +
			'</div>'
			);
		return {
			restrict: "EA",
			scope: {
				"delimiter" : "@delimiter",
				"signclass" : "@signclass",
				"inputclass" : "@inputclass",
				"placeholder" : "@placeholder",
				"ignorefield" : "@ignorefield",
				"duplicate" : "=duplicate",
				"dataList" : "=datainputcol",
				"inputText" : "=inputvalue",
				"selectedList" : "=selectedlist",
				"disableinput" : "=disableinput"
			},
			templateUrl: function(ele, attrs){
				return attrs.templateurl || 'default.html';
			},
			link: function($scope, ele,  attr){
				$scope.lastSearchTerm = "";
				$scope.searchTerm = "";
				$scope.startSearch = false; 
				$scope.curIdx = -1;
				$scope.isMatchItem = false;

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

				$scope.$watch("selectedList", function(nv, ov){
					if(nv === ov)
						return;
					var result = '';
					_.forEach(nv, function(n, key){
						result += (n.title + $scope.delimiter + " ");
					});
					$scope.inputText = result;
					$timeout(function(){
						inputCtrl.focus();
					});
				}, true);

				var syncSelectList = function(){
					var inputstr = $scope.inputText;					
					var inputArr = inputstr.split($scope.delimiter).map(function(it){return _.trim(it).toLowerCase();});
					//sync user input and the selected list
					_.forEach(inputArr, function(n, key){
						if(!n)
							return true;
						var syncField = "",
							findSelectItem, 
							findItem;
						if(n.indexOf($scope.ignorefield)>=0){
							syncField = n;
							findSelectItem = _.find($scope.selectedList, { lowerTitle: syncField});
							findItem = _.find($scope.dataList, { lowerTitle: syncField});
						}
						else{
							//do not match half of the string, cause issue
							// syncField = n;
							// findSelectItem = _.find($scope.selectedList, { searchLowerTitle: syncField});
							// findItem = _.find($scope.dataList, { searchLowerTitle: syncField});
						}
						if(!findSelectItem && findItem){
							console.log('find unadded item, add it:');
							console.log(findItem);
							$scope.selectItem(findItem);
						}
					});					
					if(inputArr.length === 1 && inputArr[0] === ""){
						$scope.selectedList = []; //clear the list if text is empty;
					}
					_.forEach($scope.selectedList, function(n, key){
						if(!n)
							return true;
						//for some items, auto append ignore field, should compare the searchTitle
						var fidx = _.findIndex(inputArr, function(sn){
							return n.searchLowerTitle === sn.toLowerCase() || n.lowerTitle === sn.toLowerCase();
						}); 
						if(fidx === -1)
							$scope.removeItem(n);
						
					});	

				}

				$scope.onChange = function(){			
					syncSelectList();
					var searchTerm = $scope.filterSearchKey();
					if($scope.needSearch(searchTerm))
						$scope.searchTerm = searchTerm;
					else
						return;
					$scope.doSearch();
					$scope.lastSearchTerm = searchTerm;
					console.log('Finish search, last search term is : ' + $scope.lastSearchTerm);
				};

				$scope.needSearch = function(searchTerm){
					if(searchTerm!==$scope.lastSearchTerm)
						return true;
					//other check todo
					return false;
				};

				var fetchTermByCursorPostion = function(pos, allInput){
					var inputlen = allInput.length,
						startIdx = -1,
						endIdx = inputlen-1,
						hitword = "";
					if(inputlen===0 || pos<0)
						return;
					rightLoop:
					for(var i = pos; i<inputlen; i++){
						if(allInput[i] === $scope.delimiter){
							endIdx = i;
							break rightLoop;
						}
					}
					var leftIdx = (pos > 0 && endIdx === pos) ? pos - 1 : pos;
					leftLoop:
					for(var j = leftIdx; j>=0; j--){
						if(allInput[j] === $scope.delimiter){
							startIdx = j;
							break leftLoop;
						}
					}
					hitword = _.trim(allInput.substring(startIdx+1, endIdx));
					return hitword;
				};
				$scope.filterSearchKey = function(){
					if(!$scope.inputText)
						return;
					var terms = $scope.inputText.split($scope.delimiter),
						searchWord = "",
						searchArr = [];
					//filter the input list
					for(var i = 0; i< terms.length && !!terms[i]; i++){
						var flag = false,
							term = _.trim(terms[i]);
						_.forEach($scope.dataList, function(n, key){
							if(n.title === term){
								flag = true;
								return false;
							}
						});
						if(!flag)
							searchArr.push(term);
					}
					
					if(searchArr.length===0){
						console.log('Unmatched elements is abnormal:0' );
						return;
					}
					//more then 1 place need autocom
					if(searchArr.length>1){
						var cursorPos = inputCtrl[0].selectionEnd;
						searchWord = fetchTermByCursorPostion(cursorPos, $scope.inputText);
					}
					else
						searchWord = searchArr[0];
					
					//do with ignore part
					var searchTerm = "";
					if(searchWord.indexOf($scope.ignorefield)>=0){
						searchTerm = searchWord.substring(0, searchArr[0].indexOf($scope.ignorefield));
					}
					else
						searchTerm = searchWord;
					return searchTerm;
				};

				$scope.doSearch = function(){
					if(!$scope.searchTerm)
						return;
					$scope.startSearch = true;
					_.forEach($scope.dataList, function(n, key){
						if(n.searchLowerTitle && n.searchLowerTitle.indexOf($scope.searchTerm)>=0){
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
					if(!$scope.duplicate){
						$scope.removeItem(sitem);
					}
					var cpitem = _.cloneDeep(sitem);
					$scope.selectedList.push(cpitem);
					$scope.startSearch = false;
					_.forEach($scope.dataList, function(n, key){
						n.match = false;
					});
					$scope.lastSearchTerm = "";
					$scope.curIdx = -1;
				}
				$scope.removeItem = function(ritem){
					if(!ritem)
						return;
					if(_.find($scope.selectedList, {id : ritem.id}))
						_.remove($scope.selectedList, function(sn){
							return ritem.id === sn.id;
						});
				}
				
				$scope.onBlur = function(){
					$scope.startSearch = false;	
				}
				$scope.lastKeyCode = '';
				ele.on('keydown', function(e){
					var keyCode = e.keyCode | e.which,
						matchList = _.where($scope.dataList, {match: true});
					$scope.lastKeyCode = keyCode;
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

				//preprocess the datalist, deal with delimiter and igore term
				var processData = function(datalist){
					if(!datalist || datalist.length==0 )
						return;
					var result = [];
					return;
				}				
			}
		};
	}
})();

