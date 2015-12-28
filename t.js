(function(){
	///depend on lodash
	angular.module("myapp", []).
				directive("ac", ['$templateCache', '$sce', '$timeout', aotuComplete]);

	function aotuComplete($templateCache, $sce,  $timeout){	
		$templateCache.put('default.html', 
			'<div class="autocomplete-container">' +
				'<div class="input-group disabled">' + 
					'<span class="input-group-addon" id="sizing-addon2"><i class="glyphicon glyphicon-envelope"></i></span>' +
					'<input type="text" class="form-control" ng-Model="inputText" placeholder={{placeholder}} ng-blur="onBlur()" ng-change="onChange()" />' + 
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
				"placeholder" : "@placeholder",
				"searchfield" : "@searchfield",
				"ignorefield" : "@ignorefield",
				"duplicate" : "=duplicate",
				"datainputcol" : "=datainputcol",
				"inputText" : "=result"
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
				$scope.result = $scope.selectedList;
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
					if(nv.length===0)
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
					if(!inputstr)
						return;
					var inputArr = inputstr.split($scope.delimiter).map(function(it){return _.trim(it);});
					//sync user input and the selected list
					_.forEach(inputArr, function(n, key){
						if(!n)
							return true;
						var syncField = "",
							findSelectItem, 
							findItem;
						if(n.toLowerCase().indexOf($scope.ignorefield)>=0){
							syncField = n.substring(0, n.toLowerCase().indexOf($scope.ignorefield));
							findSelectItem = _.find($scope.selectedList, { title: syncField});
							findItem = _.find($scope.dataList, { title: syncField});
						}
						else{
							syncField = n.toLowerCase();
							findSelectItem = _.find($scope.selectedList, { searchTitle: syncField});
							findItem = _.find($scope.dataList, { searchTitle: syncField});
						}
						if(!findSelectItem && findItem){
							$scope.selectItem(findItem)
						}
					});					

					if($scope.lastKeyCode === 46 || $scope.lastKeyCode ===8 )
						return;
					_.forEach($scope.selectedList, function(n, key){
						if(!n)
							return true;
						//for some items, auto append ignore field, should compare the searchTitle
						var fidx = _.findIndex(inputArr, function(sn){
							return n.searchTitle === sn.toLowerCase() || n.title === sn.toLowerCase();
						}); 
						if(fidx === -1)
							$scope.removeItem(n);
						
					});	
				}

				$scope.onChange = function(e){			
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
				$scope.lastKeyCode = 0;
				ele.on('keydown', function(e){
					var keyCode = e.keyCode | e.which;
					console.log('hit key down');
					console.log(keyCode);
				});
				ele.on('keydown', function(e){
					var keyCode = e.keyCode | e.which,
						matchList = _.where($scope.dataList, {match: true});
					$scope.lastKeyCode = keyCode;
					console.log('hit');
					console.log(keyCode);
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
				var processData = function(datalist, sfield, ignore){
					if(!datalist || datalist.length==0 || !sfield || !datalist[0][sfield])
						return;
					var result = [];
					for(var i = 0; i<datalist.length; i++){
						var ignoreIdx = datalist[i][sfield].indexOf(ignore);
						if(ignoreIdx>=0){
							var effectiveStr = datalist[i][sfield].substring(0, ignoreIdx);
							result.push({
								title: datalist[i][sfield].toLowerCase(),
								searchTitle: effectiveStr.toLowerCase(),
								displayText: $sce.trustAsHtml(datalist[i][sfield]),
								match: true, //init list 
								id: datalist[i].id || i
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

