requirejs.config({
    paths: {
      d3: "../extensions/CentralityX/js/d3.v4.min"
    }
});
define( [
	"jquery", "./properties", "./js/jsnetworkx", "text!./css/style.css", "d3"],
function ($,props,jsnx,cssContent,d3) {
	'use strict';
		
	return {
		initialProperties: {
				version: 1.0,
				qHyperCubeDef: {
					qDimensions: [],
					qMeasures: [],
					qInitialDataFetch: [{
						qWidth: 10,
						qHeight: 1000
					}]
				}
		},
		snapshot: {
			canTakeSnapshot: true
		},
		definition: props,
		paint: function($element, layout) {
			/*
			Author: Anthony Garbin, Qliktech AU
			Author Credits: Developing Extension, Extension Properties and Customisation Options. 
							Re-Factoring D3 Lasso Library from D3 V.3 to D3 V.4, 
							Integration with JSNetworkX
							UI Design
							Testing
			3rd Party Credits: 
							JR Ladd: D3 Force Directed Layout Example https://bl.ocks.org/jrladd/c76799aa63efd7176bd9006f403e854d
							JSNetworkX: Centrality Library ported from NetworkX
			*/

			var self = this;
		
			$element.empty();
			
			if (!$("style[id='ext']").length > 0) {
				if (!$("link[id='ext']").length > 0) {
					$('<style id="ext">').html(cssContent).appendTo('head');				
				}
			};
			
			// Get the data
			var qMatrix = layout.qHyperCube.qDataPages[0].qMatrix;
			var qDimensionInfo = layout.qHyperCube.qDimensionInfo;
			var dim_info = qDimensionInfo.map(function(d){
				return {
					"dimension": d.mapping
				}
			})
			var qMeasureInfo = layout.qHyperCube.qMeasureInfo
			var measure_info = qMeasureInfo.map(function(d){
				return {
					"measure": d.mapping,
					"max": d.qMax,
					"min": d.qMin
				}
			})
			
			// Get the extension container properties
			var height = $element.height(), // height
				width = $element.width(),   // width
				id = "container_" + layout.qInfo.qId, //Element ID
				chartID = "chart_" + layout.qInfo.qId, //Chart ID
				menuGroup = "menuGroup_" + layout.qInfo.qId,
				menuRadio = "menuRadio_" + layout.qInfo.qId,
				radioGrp = "radioGrp_" + layout.qInfo.qId,
				actionGrp = "actionGrp_" + layout.qInfo.qId,
				selectGrp = "selectGrp_" + layout.qInfo.qId,
				applyGrp = "applyGrp_" + layout.qInfo.qId,
				applyDiv = "applyDiv_" + layout.qInfo.qId,
				inspectGrp = "inspectGrp_" + layout.qInfo.qId,
				inspectDiv = "inspectDiv_" + layout.qInfo.qId,
				inspectDivBtn = "inspectDivBtn_" + layout.qInfo.qId,
				btnRefresh = "btnRefresh_" + layout.qInfo.qId,
				selector = "selector_" + layout.qInfo.qId,
				action = "action_" + layout.qInfo.qId,
				searchGrp = "searchGrp_" + layout.qInfo.qId;

			if(document.getElementById(id)) {
				$("#" + id).empty();
			}else {
				// If the element doesn't exist, create it
				var $Item = $('<div />')
				var html = '<div style="position:absolute;z-index:2;background-color:white"><div id="' + chartID + '" width:"' + width + 'px" height="' + height + 'px"></div></div>'
				html += '<table id="'+menuGroup+'" style="position:absolute;z-index:4;"><tr><td id="'+menuRadio+'"></div><div id="'+selectGrp+'" class="radio-group"></div><div id="'+searchGrp+'" class="search-box"></div></td></tr></table>'
				html += '<table id="'+inspectGrp+'" style="position:absolute;z-index:0;"><tr><td><div id="'+inspectDiv+'" class="inspect"></div></td></tr></table>'
				html += '<div id="' + inspectDivBtn+'" style="position:absolute;z-index:5;"></div>'
				html += '<table id="'+applyGrp+'" style="position:absolute;z-index:6;width:100px;left:'+(width-100)+'px;"><tr><td align="right"><div id="'+applyDiv+'" style="width:100px"></div></td></tr></table>'
				$Item.html(html);
				$element.append($Item.attr("id",id).width(width).height(height));
			};
		
			//Setup pointers to required dimensions
			var node_a = 0
		    var node_b = 1
			var edge_weight = measure_info.findIndex(x => x.measure=="q_edge_weight") //Edge weight (line thickness)
			if (edge_weight >= 0){
				var edge_weight_min = measure_info[edge_weight].min //Edge Weight (Min Line thickness)
				var edge_weight_max = measure_info[edge_weight].max //Edge Weight (Max Line thickness)
			}else{
				var edge_weight_min = 1;
				var edge_weight_max = 1;
			}
			var edge_color = measure_info.findIndex(x => x.measure=="q_edge_color"); //Edge Color or Colormix
		
			//Setup default options
			var oNodeColor = layout.props.q_defaultnodecolor || '#999999';
			var oNodeInitMin = layout.props.q_init_node_min > 0 ? layout.props.q_init_node_min : 6;
			var oNodeInitMax = layout.props.q_init_node_max > 0 ? layout.props.q_init_node_max : 18;
			var oNodeSearch = layout.props.q_node_search || 'name';
			var oNodeHover = layout.props.q_node_hover;
			var oEdgeColor = layout.props.q_defaultedgecolor || '#aaaaaa';
			var oNodeSize = 10;
			var oForceStrength = !layout.props.q_force_strength == 0 ? layout.props.q_force_strength : -100;
			var oForceDistMax = !layout.props.q_force_distanceMax == 0 ? layout.props.q_force_distanceMax : 60;
			var oAlphaDecay = layout.props.q_alphadecay || 0.05;
			var oTheme = layout.props.q_color_theme || 'light';
			var oNLabelSize = layout.props.q_nodelabelsize || 10;
			var oNLabelColor = layout.props.q_nodelabelcolor || '#333333';
			var oNLabelFont = layout.props.q_nodelabelfont || "Arial";
			var oELabelSize = layout.props.q_edgelabelsize || 10;
			var oELabelColor = layout.props.q_edgelabelcolor || '#333333';
			var oELabelFont = layout.props.q_edgelabelfont || "Arial";
			var oLabelThreshold = layout.props.q_defaultlabelthreshold || 0;
			var oMaxLineWidth = layout.props.q_maxlinewidth || 10;
			var oMinLineWidth = layout.props.q_minlinewidth || 2;
			var curTransK = 0; //current zoom scale level

			//Setup Menu Options
			var oDegree = layout.props.q_showdegree || false;
			var oBetweenness = layout.props.q_showbetweenness || false;
			var oEigenvector =  layout.props.q_showeigenvector || false;
			var oMenuX = layout.props.q_menu_x || "center";
			var oMenuY = function(){ return layout.props.q_menu_y == "top" ? 0 : height};
			var oNodeWarning = layout.props.q_node_warn;
			var oCentralityRadio = [];
			var nodeSelected = [];
			var applyType;
			var applyMenuActive = false;
			var selectInspect = 0;
			var inspectPanelActive = false;
			var gNodes = [];
			var inspSize = 0;

			//Setup Required Centrality Options
			if (oDegree || oBetweenness || oEigenvector){
				oCentralityRadio = ["None"];
				oDegree ? oCentralityRadio.push('Degree') : '';
				oBetweenness ? oCentralityRadio.push('Betweenness') : '';
				oEigenvector ? oCentralityRadio.push('Eigenvector') : '';
			};
			
			function scaleWidth(value) { 
				return ( value - edge_weight_min ) * ( oMaxLineWidth - oMinLineWidth ) / ( edge_weight_max - edge_weight_min ) + oMinLineWidth;
			}
			
			//Edges - Create
			var edges = [];
			var wMin = oMinLineWidth,wMax = oMaxLineWidth;
			var edgeSize = d3.scaleLinear()
							.domain([edge_weight_min,edge_weight_max])
							.range([wMin,wMax]);
			for (let x of qMatrix){
				var e_w = scaleWidth(edge_weight >= 0 ? x[edge_weight+2].qNum : 2);//Add 2 as there are 2 dimensions objects before the measures, else default to edge weight of 1.
				var w = e_w == 0 ? 2 : e_w; 
				var c = edge_color >= 0 ? x[edge_color+2].qText : oEdgeColor;
				edges.push([x[node_a].qText,x[node_b].qText,{"weight":edgeSize(x[edge_weight+2].qNum),"color":c, "edge_weight":edgeSize(x[edge_weight+2].qNum)}])
			};
			
			var G = new jsnx.Graph();
			
			G.addEdgesFrom(edges); //Nodes auto created from edge table
	

			var gDegree = oDegree ? jsnx.degree(G) : ''; //Calculaltes number of neighbor nodes for each node
			var nodeCount = G.adj.size
			var gBetweenness = oBetweenness ? jsnx.betweennessCentrality(G) : ''; //Calculate betweenness score for each node
						
			if (oEigenvector){	
				try{
					var gEigenvector = jsnx.eigenvectorCentrality(G,{"maxIter":50,"tolerance":1e-4}); //Calculate eigenvector score for each node
				}catch(e){
					oEigenvector = false;
				}
			}else{
					oEigenvector = false;
			};
			
			
			//var gCloseness = jsnx.allPairsShortestPathLength(G); not supported yet!
			
			menuSetup();
		    
			function menuSetup(){
				$('#'+menuRadio+' div').empty();
				if (oMenuY() == 0){var h = 0}else{var h = oMenuY() - $('#'+menuRadio).height()-10};
				$('#'+menuGroup).css({'top':h})
				$('#'+menuRadio).attr('align',oMenuX)

			
				if (oNodeWarning > 0 && nodeCount > oNodeWarning){ //Setup manual refresh for data load, avoid timeout on large datasets
					$('#'+menuRadio+' div').append('<button type="button" id="'+btnRefresh+'" class="btn btn-xs btn-default">Many Nodes: Load?</button>')
					$('#'+btnRefresh).on("click",function(){
						createMenu();
						preStaging();
					})
				}else{
					try{
						createMenu();
						preStaging();
					}catch(e){
						console.log(e);
					}
				};
			}

			function preStaging(){
				//var gNodes = []; //used to store individual node attributes e.g. name and color
				var node_dict = {};
				var node_metrics = {
					none:{min:1000,max:0},
					degree:{min:1000,max:0},
					betweenness:{min:1000,max:0},
					eigenvector:{min:1000,max:0}
				};
				for (let x of qMatrix){
					//check for existing node_a in array
					buildNodeObj(node_b);//Check and build on Node A
					buildNodeObj(node_a);//Check and build on Node B
					function buildNodeObj(n){
						if (node_dict[x[n].qText] === undefined){ //add if not exist
							//Bugfix save qElemNumber for both A and B to ensure lasso functionality works correctly
							var nodeObj= {
								nodeID: x[n].qText,
								degree: oDegree ? gDegree._stringValues[x[n].qText] : 1,
								betweenness: oBetweenness ? gBetweenness._stringValues[x[n].qText]+0.1 : 1,
								eigenvector: oEigenvector ? gEigenvector._stringValues[x[n].qText]+0.1 : 1
							};
							
							//Node Name
							if (x[n].qAttrExps.qValues[0].hasOwnProperty('qText')) { 
								nodeObj.name = x[n].qAttrExps.qValues[0].qText; //Set node name if exist
							}else{
								nodeObj.name = x[n].qText;//default name is id
							};

							//Node Description
							if (x[n].qAttrExps.qValues[1].hasOwnProperty('qText')) { 
								nodeObj.desc = x[n].qAttrExps.qValues[1].qText; //Set node name if exist
							}else{
								nodeObj.desc = '';//default description is blank
							};

							//Node Color
							if (x[n].qAttrExps.qValues[2].hasOwnProperty('qText')) { 	
								nodeObj.color = x[n].qAttrExps.qValues[2].qText; //Set to node color if exist
							}else{
								nodeObj.color = oNodeColor; //default color
							};
							
							//Node Size
							if (x[n].qAttrExps.qValues[3].hasOwnProperty('qNum') && Number.isInteger(x[n].qAttrExps.qValues[3].qNum)) { 	
								nodeObj.none = x[n].qAttrExps.qValues[3].qNum; //Set to node size if exist
							}else{
								nodeObj.none = oNodeSize; //default Size
							};

							//Calculate Min and Max Values
							for (var a in node_metrics){
								node_minMax(a)
							}
							
							function node_minMax(cent){
								if (nodeObj[cent] < node_metrics[cent].min) {node_metrics[cent].min = nodeObj[cent]};
								if (nodeObj[cent] > node_metrics[cent].max) {node_metrics[cent].max = nodeObj[cent]};
							}

							//Node qElemNumber Assignment
							n == 0 ? nodeObj.nodeqElemNumber0 = x[n].qElemNumber : nodeObj.nodeqElemNumber1 = x[n].qElemNumber
							
							gNodes.push([x[n].qText,nodeObj]); //add new node 2 part array, 1st part is node id, 2nd is json attributes
							node_dict[x[n].qText] = oDegree ? gDegree._stringValues[x[n].qText] : 1; //save to dictionary
						}else{ //Node already exists
							//Node qElemNumber Assignment #2, used when Node already exists, need to assign qElemNumber for second occurance
							//On render the code will favour nodes on sideA rather than sideB
							var gNIndex = gNodes.findIndex(y => y[0] == x[n].qText); 
							if (n == 0){
								gNodes[gNIndex][1].nodeqElemNumber0 = x[n].qElemNumber; //Overwrite with SideA
								x[n].qAttrExps.qValues[0].hasOwnProperty('qText') ? gNodes[gNIndex][1].name = x[n].qAttrExps.qValues[0].qText : gNodes[gNIndex][1].name = x[n].qText;
								x[n].qAttrExps.qValues[1].hasOwnProperty('qText') ? gNodes[gNIndex][1].desc = x[n].qAttrExps.qValues[1].qText : gNodes[gNIndex][1].desc = '';
								x[n].qAttrExps.qValues[2].hasOwnProperty('qText') ? gNodes[gNIndex][1].color = x[n].qAttrExps.qValues[2].qText : gNodes[gNIndex][1].color = oNodeColor;
								x[n].qAttrExps.qValues[3].hasOwnProperty('qNum') ? gNodes[gNIndex][1].none = x[n].qAttrExps.qValues[3].qNum : gNodes[gNIndex][1].none = oNodeSize;
							};
						}
						
						//#1 Special function to handle Exclusive and Non-Exclusive Sets
						//Exclusive Set is a set of nodes where node '1' is either in NodeA or NodeB but not both.
						//Non-Exclusive Set is a set of nodes where node '1' is either in NodeA or NodeB or both.	
					};
				};
				
				//Recalculate Node Sizes using Scaling
				for (var i=0;i<gNodes.length;i++){
					var rMin = oNodeInitMin,rMax;
					var tmp_node = gNodes[i][1]; //get second array value which is json attributes
					for (var x in node_metrics){ //For each centrality type (4)
						if (node_metrics[x].min / node_metrics[x].max >= 0.5){
							rMax = 10;
						}else{
							rMax = oNodeInitMax;
						};
						var centralitySize = d3.scaleLinear()
										.domain([node_metrics[x].min,node_metrics[x].max])
										.range([rMin,rMax]);
						gNodes[i][1][x] = centralitySize(tmp_node[x])
					}
				};

				//add node attr to Graph G
				G.addNodesFrom(gNodes);
			
				//Create object array suitable for D3 processing - edges
				var gEdges = []
				var wMin = oMinLineWidth,wMax = oMaxLineWidth;
				var edgeSize = d3.scaleLinear()
									.domain([edge_weight_min,edge_weight_max])
									.range([wMin,wMax]);
				for (let x of edges){ //edges is array
					var o = {
						source: x[0],
						target: x[1],
						weight: x[2].weight,
						color: x[2].color || oEdgeColor,
						edge_weight: x[2].edge_weight,
						edge_weight2: edgeSize(x[2].edge_weight)
					};
					gEdges.push(o)
				};
				
				drawG(G,chartID,width,height,'none')
				
				d3.selectAll('.node').append('title').text(function(d){return d.data.desc})

				d3.selectAll('.node').on('click', function(d,i){
					$('#Search').val(''); //Clear Search Box text

					//Array of selected nodes
					if (nodeSelected.indexOf(d.node) > -1){ //Remove from Array
						nodeSelected.splice(nodeSelected.indexOf(d.node),1);
					}else{
						nodeSelected.push(d.node); //Add to Array
					};
					
					//Change node visuals to indicate current selected nodes
					d3.selectAll('.node').transition().duration(300).style('opacity', function(d){
						if (nodeSelected.indexOf(d.node) == -1 && nodeSelected.length > 0){
							return 0.4 //Half transparency for non selected
						};
					})
					if(selectInspect == 0){ //Highlight selected nodes, enable apply buttons
						
					}else if(selectInspect == 1) { //Send nodes to inspection panel, enable apply buttons
						createInspectPanel(1)
						//applyType = function(){ selectionComplete() };
					};
					
					//Menu Code
					if(nodeSelected.length > 0 && applyMenuActive == false){
						createActionBtns(1)
						applyType = function(){ selectionComplete() };
					}else if (nodeSelected.length == 0) {
						createActionBtns(0)
					};

				});

				if (oNodeHover == true){
					$('#Search').val('');
					d3.selectAll('.node').on('mouseover', function(d,i){
						var n = G.neighbors(d.node)
						n.push(d.node)
						//toggleNodeSelect(n);
						d3.selectAll('.node').transition().duration(300).style('opacity', function(d){
							if (n.indexOf(d.node) == -1 ){
								return 0.2
							}
						});
						d3.selectAll('.line').transition().duration(300).style('opacity', 0.2);
					});
		
					d3.selectAll('.node').on('mouseout', function(d,i){
						var n = G.neighbors(d.node)
						n.push(d.node)
						//toggleNodeSelect(n);
						d3.selectAll('.node').transition().duration(300).style('opacity', function(d){
							if (n.indexOf(d.node) == -1 ){
								return 1
							}
						});
						d3.selectAll('.line').transition().duration(300).style('opacity', 0.7);
					});
				};
				//var clust = jsnx.numberOfCliques(G)
				//console.log(clust)

			}//End of preStaging

			function drawG(targetG,target,tWidth,tHeight,cent){
				
				var chartObj = jsnx.draw(targetG, {
					element: "#" + target,
					width: tWidth,
					height: tHeight,
					layoutAttr: {
						charge: oForceStrength,
						linkDistance: oForceDistMax,
						linkStrength: 0.3,
						friction: 0.8,
						theta: 0.95,
						alpha: oAlphaDecay,
						size: [tWidth,tHeight]
					},
					nodeAttr: {
						r: function(d) {return d.data[cent]}
					},
					nodeStyle: {
						fill: function(d) { 
							return d.data.color || oNodeColor; 
						},
						stroke: '#ffffff',
						'stroke-width': 1,
						opacity: 0.9
					},
					labels: function(d){ return d.data.name},
					labelAttr: {
						dy: function(d){return d.data[cent]+(oNLabelSize/4)}
					},
					labelStyle: {
						fill: oNLabelColor,
						'font-size': oNLabelSize,
						'font-family': oNLabelFont
					},
					edgeLabels: function(d){return 'test'},
					edgeStyle: {
						fill: function(d){return d.data.color},
						'stroke-width': 3,
						opacity: 0.7
					},
					edgeLabelStyle: {
						fill: function(d){return oELabelColor},
						'font-size': oELabelSize,
						'font-family': oELabelFont	
					},
					panZoom: {
						enabled: true,
						scale: false
					},
					weighted: true,
					withLabels: true,
					withEdgeLabels: false,
					
				});
			
				d3.selectAll('.node').append('title').text(function(d){return d.data.desc})

				d3.selectAll('.node').on('click', function(d,i){
					$('#Search').val(''); //Clear Search Box text

					//Array of selected nodes
					if (nodeSelected.indexOf(d.node) > -1){ //Remove from Array
						nodeSelected.splice(nodeSelected.indexOf(d.node),1);
					}else{
						nodeSelected.push(d.node); //Add to Array
					};
					
					//Change node visuals to indicate current selected nodes
					d3.selectAll('.node').transition().duration(300).style('opacity', function(d){
						if (nodeSelected.indexOf(d.node) == -1 && nodeSelected.length > 0){
							return 0.4 //Half transparency for non selected
						};
					})
					if(selectInspect == 0){ //Highlight selected nodes, enable apply buttons
						
					}else if(selectInspect == 1) { //Send nodes to inspection panel, enable apply buttons
						createInspectPanel(1)
						//applyType = function(){ selectionComplete() };
					};
					
					//Menu Code
					if(nodeSelected.length > 0 && applyMenuActive == false){
						createActionBtns(1)
						applyType = function(){ selectionComplete() };
					}else if (nodeSelected.length == 0) {
						createActionBtns(0)
					};

				});

				if (oNodeHover == true){
					$('#Search').val('');
					d3.selectAll('.node').on('mouseover', function(d,i){
						var n = G.neighbors(d.node)
						n.push(d.node)
						//toggleNodeSelect(n);
						d3.selectAll('.node').transition().duration(300).style('opacity', function(d){
							if (n.indexOf(d.node) == -1 ){
								return 0.2
							}
						});
						d3.selectAll('.line').transition().duration(300).style('opacity', 0.2);
					});
		
					d3.selectAll('.node').on('mouseout', function(d,i){
						var n = G.neighbors(d.node)
						n.push(d.node)
						//toggleNodeSelect(n);
						d3.selectAll('.node').transition().duration(300).style('opacity', function(d){
							if (n.indexOf(d.node) == -1 ){
								return 1
							}
						});
						d3.selectAll('.line').transition().duration(300).style('opacity', 0.7);
					});
				};
			}

	
			function createMenu(){
				//Menu customisations dependent on extension property options
				$('#'+menuRadio+' .btn-opt').remove();
				oCentralityRadio.length > 0 ? $('#'+menuRadio).append('<div id="'+radioGrp+'" class="radio-group"></div>') : ''
				for (var i=0;i<oCentralityRadio.length;i++){//Build menu items based on options
					$('#'+radioGrp).append('<input type="radio" class="btn-opt" name="'+selector+'" id="' + oCentralityRadio[i] + '">');
					$('#'+radioGrp).append('<label class="btn-opt" for="' + oCentralityRadio[i] + '">' + oCentralityRadio[i] + '</label>');
				};

				$("input:radio[name="+selector+"]:first").attr('checked', true);//Make first option appear selected
				$('#'+radioGrp+' input[type=radio]').on("click", function(){//Button control logic
					var cent = $(this).attr("id").toLowerCase();
					drawG(G,chartID,width,height,cent);
				});

				$('#'+selectGrp).append('<input type="radio" class="btn-opt" name="'+selectGrp+'" id="Select">');
				$('#'+selectGrp).append('<label class="btn-opt" for="Select">Select</label>');
				$('#'+selectGrp).append('<input type="radio" class="btn-opt" name="'+selectGrp+'" id="Inspect">');
				$('#'+selectGrp).append('<label class="btn-opt" for="Inspect">Inspect</label>');
				$("input:radio[name="+selectGrp+"]:first").attr('checked', true);//Make first option appear selected
			
				$('#'+selectGrp+' input[type=radio]').on("click", function(){ //Button control logic
					$(this).attr('id') == "Select" ? enableSelect() : enableInspect();
				});

				$('#'+searchGrp).append('<input type="search" class="btn-opt" id="Search">');
				$('#Search').on("search", function(e){ //Button control logic
						searchNodes($(this).val());
				});
			}

			function createActionBtns(t){
				if(t==1 && applyMenuActive == false){ //Enable Menu
					$('#'+applyDiv).append('<input class="btn" type="image" id="btnCancel" src="/Extensions/CentralityX/cross1.png" style="width:50px;height:40px">');
					$('#'+applyDiv).append('<input class="btn" type="image" id="btnApply" src="/Extensions/CentralityX/checkmark1.png" style="width:50px;height:40px">');
					//style="width:20px;height:20px"
					$('#btnCancel').on("click", function(){ //Button control logic
						btnCancel();
					});
					$('#btnApply').on("click", function(){ //Button control logic
						btnApply();
					});				
					applyMenuActive = true;
				}else if (t==0){
					$('#'+applyDiv + ' .btn').remove();
					applyMenuActive = false;
				}
			}

			function createInspectPanel(t){
				var inspectDraw;
				var edges2 = [];
				var gNodes2 = [];
				var identNodes = [];
				var G2 = new jsnx.Graph();
				var inspSizeCalc = [
					[width/2 - 4, height/2 - 4,width/2 - 4,height/2 -4],
					[width/1.666 - 4,height/1.666 -4,width/2.5 -4,height/2.5 - 4],
					[width/1.422 - 4,height/1.422 -4,width/3.333 -4,height/3.33 -4]
				]
				if(t==1 && inspectPanelActive == false){ //Enable Menu
					$('#'+inspectGrp).css('z-index',"3")
					$('#'+inspectGrp).width(inspSizeCalc[0][0]).height(inspSizeCalc[0][1])
					$('#'+inspectGrp).css('left',inspSizeCalc[0][2]).css('top',inspSizeCalc[0][3])
					$('#'+inspectDiv).width(inspSizeCalc[0][0]).height(inspSizeCalc[0][1])
					
					$('#'+inspectDivBtn).append('<input class="btn" type="image" id="btnShortest" src="/Extensions/CentralityX/radiochecked1.png" style="width:30px;height:20px">');
					$('#'+inspectDivBtn).append('<input class="btn" type="image" id="btnDecrease" src="/Extensions/CentralityX/minus1.png" style="width:30px;height:20px">');
					$('#'+inspectDivBtn).append('<input class="btn" type="image" id="btnIncrease" src="/Extensions/CentralityX/plus1.png" style="width:30px;height:20px">');
					$('#'+inspectDivBtn).width(90).height(20)
					$('#'+inspectDivBtn).css('left',width-100).css('top',height-32)
					$('#btnIncrease').on("click", function(){ //Button control logic
						if(++inspSize > 2){
							inspSize = 2;
						};
						$('#'+inspectGrp).width(inspSizeCalc[inspSize][0]).height(inspSizeCalc[inspSize][1])
						$('#'+inspectGrp).css('left',inspSizeCalc[inspSize][2]).css('top',inspSizeCalc[inspSize][3])
						$('#'+inspectDiv).width(inspSizeCalc[inspSize][0]).height(inspSizeCalc[inspSize][1])
						removeNewG();
						createNewG();
					});
					$('#btnDecrease').on("click", function(){ //Button control logic
						if(--inspSize < 0){
							inspSize = 0;
						};
						$('#'+inspectDiv).width(inspSizeCalc[inspSize][0]).height(inspSizeCalc[inspSize][1])
						$('#'+inspectGrp).width(inspSizeCalc[inspSize][0]).height(inspSizeCalc[inspSize][1])
						$('#'+inspectGrp).css('left',inspSizeCalc[inspSize][2]).css('top',inspSizeCalc[inspSize][3])
						removeNewG();
						createNewG();
					});	
					$('#btnShortest').on("click", function(){
						var nodeShortest = jsnx.shortestPath(G, {source: nodeSelected[0], target: nodeSelected[1]});
						if(nodeShortest.length > 0){
							nodeSelected = nodeShortest
							createNewG2();
						}
					})	
					
					inspectPanelActive = true;
					createNewG();
				}else if(t==1 && inspectPanelActive == true){
					createNewG();
				}else if (t==0){
					$('#'+inspectGrp).css('z-index',"0")
					$('#'+inspectDivBtn + ' .btn').remove();
					inspectPanelActive = false;
					removeNewG()
				}

				function createNewG(){
					//Edges
					for(var x=0;x<edges.length;x++){ //Cycle through edges
						var nodeA = edges[x][0],nodeB = edges[x][1];
						if(nodeSelected.indexOf(nodeA) > -1 || nodeSelected.indexOf(nodeB) > -1){ //identify if either A or B matches selected nodes
							edges2.push(edges[x]) //Add to new array
							if (identNodes.indexOf(nodeA) == -1){ //Add if not exist
								identNodes.push(nodeA)
							};
							if (identNodes.indexOf(nodeB) == -1){ //Add if not exist
								identNodes.push(nodeB)
							};
						}
					}
					//Nodes
					for(var y=0;y<gNodes.length;y++){
						if(identNodes.indexOf(gNodes[y][0]) > -1){//Find nodes that were identified by previous step
							gNodes2.push(gNodes[y]) //Add to new array
						};
					};
					var G2 = new jsnx.Graph();
					G2.addEdgesFrom(edges2);
					G2.addNodesFrom(gNodes2);
					drawG(G2,inspectDiv,inspSizeCalc[inspSize][0],inspSizeCalc[inspSize][1],'none');
				}

				function createNewG2(){
					//Edges
					for(var x=0;x<edges.length;x++){ //Cycle through edges
						var nodeA = edges[x][0],nodeB = edges[x][1];
						if(nodeSelected.indexOf(nodeA) > -1 && nodeSelected.indexOf(nodeB) > -1){ //identify if either A or B matches selected nodes
							edges2.push(edges[x]) //Add to new array
							if (identNodes.indexOf(nodeA) == -1){ //Add if not exist
								identNodes.push(nodeA)
							};
							if (identNodes.indexOf(nodeB) == -1){ //Add if not exist
								identNodes.push(nodeB)
							};
						}
					}
					//Nodes
					for(var y=0;y<gNodes.length;y++){
						if(identNodes.indexOf(gNodes[y][0]) > -1){//Find nodes that were identified by previous step
							gNodes2.push(gNodes[y]) //Add to new array
						};
					};
					var G2 = new jsnx.Graph();
					G2.addEdgesFrom(edges2);
					G2.addNodesFrom(gNodes2);
					drawG(G2,inspectDiv,inspSizeCalc[inspSize][0],inspSizeCalc[inspSize][1],'none');
				}

				function removeNewG(){
					//inspectDraw = null;;
					edges2 = [];
					gNodes2 = [];
					G2 = null;
				}

			}


			function selectionComplete() {
				// Retrieve the dimension element numbers for the selected items
				var elemNosA = [];
				var elemNosB = [];
				
				d3.selectAll('.node').filter(function(d){
						if (nodeSelected.indexOf(d.node) > -1){
							d.data.hasOwnProperty('nodeqElemNumber0') ? elemNosA.push(d.data.nodeqElemNumber0) : elemNosB.push(d.data.nodeqElemNumber1)
						}
					});
				// Filter these dimension values
				self.backendApi.selectValues(0,elemNosA,false); //return NodeA selections
				self.backendApi.selectValues(1,elemNosB,true); //return NodeB selections
				
				createActionBtns(0);
			}	


			
				// Zooming function translates the size of the svg container.
				function zoomed() {
					/*
					container.attr("transform", "translate(" + d3.event.transform.x + ", " + d3.event.transform.y + ") scale(" + d3.event.transform.k + ")");
					curTransK = d3.event.transform.k; //Set current zoom scale level
					//Check for scale threshold and apply if required
					curTransK >= oLabelThreshold ? d3.selectAll('text').style('opacity', 1) : d3.selectAll('text').style("opacity", 0)
					*/
					console.log('zoom')
				}
				
				function enableSelect(){
					selectInspect = 0;
					createInspectPanel(0)
				};

				function enableInspect(){
					selectInspect = 1;
					createInspectPanel(1)
				};

				function enableTouch(){
				
				};

				function btnCancel(){
					nodeSelected = [];
					d3.selectAll('.node').transition().duration(300).style('opacity', 0.9);
					createActionBtns(0);
					createInspectPanel(0)
				}

				function btnApply(){
					applyType()
				}

				// Search for nodes by making all unmatched nodes temporarily transparent.
				function searchNodes(term) {
					if (term) {
						var selVal;
						if (oNodeSearch == 'name'){
							selVal = 'd.data.name'
						}else if(oNodeSearch == 'desc') {
							selVal = 'd.data.desc'
						}else if(oNodeSearch == 'both'){
							selVal = '(d.data.name + d.data.desc)'
						};
						
						function evalNow(obj){
							return Function('return (' + obj + ')')();
						};
						evalNow('d3.selectAll(".node").transition().duration(300).style("opacity", function(d){ \
							if (' + selVal + '.toLowerCase().search("' + term + '".toLowerCase()) == -1){ \
								return 0.2 \
							}})');
						d3.selectAll('.line').transition().duration(300).style('opacity',0.2);
					}else{
						d3.selectAll('.node').transition().duration(300).style('opacity',0.9);
						d3.selectAll('.line').transition().duration(300).style('opacity',0.7);
					}
				}
		} //End Paint
	};//End of Return
});//End of Define
