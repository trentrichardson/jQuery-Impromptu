/*
 * jQuery Impromptu
 * By: Trent Richardson [http://trentrichardson.com]
 * Version 4.0.1
 * Last Modified: 03/03/2012
 * 
 * Copyright 2012 Trent Richardson
 * Dual licensed under the MIT and GPL licenses.
 * http://trentrichardson.com/Impromptu/GPL-LICENSE.txt
 * http://trentrichardson.com/Impromptu/MIT-LICENSE.txt
 * 
 */
 
(function($) {
	$.prompt = function(message, options) {
		$.prompt.options = $.extend({},$.prompt.defaults,options);
		$.prompt.currentPrefix = $.prompt.options.prefix;
		$.prompt.currentStateName = "";

		var ie6		= ($.browser.msie && $.browser.version < 7);
		var $body	= $(document.body);
		var $window	= $(window);
		
		$.prompt.options.classes = $.trim($.prompt.options.classes);
		if($.prompt.options.classes != '')
			$.prompt.options.classes = ' '+ $.prompt.options.classes;
			
		//build the box and fade
		var msgbox = '<div class="'+ $.prompt.options.prefix +'box'+ $.prompt.options.classes +'" id="'+ $.prompt.options.prefix +'box">';
		if($.prompt.options.useiframe && (($('object, applet').length > 0) || ie6)) {
			msgbox += '<iframe src="javascript:false;" style="display:block;position:absolute;z-index:-1;" class="'+ $.prompt.options.prefix +'fade" id="'+ $.prompt.options.prefix +'fade"></iframe>';
		} else {
			if(ie6) {
				$('select').css('visibility','hidden');
			}
			msgbox +='<div class="'+ $.prompt.options.prefix +'fade" id="'+ $.prompt.options.prefix +'fade"></div>';
		}
		msgbox += '<div class="'+ $.prompt.options.prefix +'" id="'+ $.prompt.options.prefix +'"><div class="'+ $.prompt.options.prefix +'container"><div class="';
		msgbox += $.prompt.options.prefix +'close">X</div><div id="'+ $.prompt.options.prefix +'states"></div>';
		msgbox += '</div></div></div>';

		$.prompt.jqib = $(msgbox).appendTo($body);
		$.prompt.jqi	 = $.prompt.jqib.children('#'+ $.prompt.options.prefix);
		$.prompt.jqif	= $.prompt.jqib.children('#'+ $.prompt.options.prefix +'fade');

		//if a string was passed, convert to a single state
		if(message.constructor == String){
			message = {
				state0: {
					html: message,
				 	buttons: $.prompt.options.buttons,
				 	focus: $.prompt.options.focus,
				 	submit: $.prompt.options.submit
			 	}
		 	};
		}

		//build the states
		var states = "";

		$.each(message,function(statename,stateobj){
	            stateobj = $.extend({},$.prompt.defaults.state,stateobj);
	            message[statename] = stateobj;
	            
	            var arrow = "";
	            if(stateobj.position.arrow !== null)
	                arrow = '<div class="'+ $.prompt.options.prefix + 'arrow '+ $.prompt.options.prefix + 'arrow'+ stateobj.position.arrow +'"></div>';
	                
	            states += '<div id="'+ $.prompt.options.prefix +'_state_'+ statename +'" class="'+ $.prompt.options.prefix + '_state" style="display:none;">'+ arrow +'<div class="'+ $.prompt.options.prefix +'message">' + stateobj.html +'</div><div class="'+ $.prompt.options.prefix +'buttons">';
	            
	            $.each(stateobj.buttons, function(k, v){
	                if(typeof v == 'object'){
	                    
	                    states += '<button ';
	                    if(typeof v.classes !== "undefined"){
	                        states += 'class="'
	                        $.each(v.classes, function(k, v){
	                            states += ' ' + v
	                        })
	                        states += '" ';
	                    }
	
	                    states += ' name="' + $.prompt.options.prefix + '_' + statename + '_button' + v.title.replace(/[^a-z0-9]+/gi,'') + '" id="' + $.prompt.options.prefix + '_' + statename + '_button' + v.title.replace(/[^a-z0-9]+/gi,'') + '" value="' + v.value + '">' + v.title + '</button>';
	
	                } else {
	                    states += '<button name="' + $.prompt.options.prefix + '_' + statename + '_button' + k + '" id="' + $.prompt.options.prefix +  '_' + statename + '_button' + k + '" value="' + v + '">' + k + '</button>';
	                    
	                }
	            });
	            states += '</div></div>';
	        });

		//insert the states...
		$.prompt.states = message;
		$.prompt.jqi.find('#'+ $.prompt.options.prefix +'states').html(states).children('.'+ $.prompt.options.prefix +'_state:first').css('display','block');
		$.prompt.jqi.find('.'+ $.prompt.options.prefix +'buttons:empty').css('display','none');
		
		//Events
		$.each(message,function(statename,stateobj){
			var $state = $.prompt.jqi.find('#'+ $.prompt.options.prefix +'_state_'+ statename);

			if($.prompt.currentStateName === "")
				$.prompt.currentStateName = statename;

			$state.bind('promptsubmit', stateobj.submit);
			
			$state.children('.'+ $.prompt.options.prefix +'buttons').children('button').click(function(){
				var msg = $state.children('.'+ $.prompt.options.prefix +'message');
				var clicked = stateobj.buttons[$(this).text()];
				if(clicked == undefined){
					for(var i in stateobj.buttons)
						if(stateobj.buttons[i].title == $(this).text())
							clicked = stateobj.buttons[i].value;
				}
				
				if(typeof clicked == 'object')
					clicked = clicked.value;
				var forminputs = {};

				//collect all form element values from all states
				$.each($.prompt.jqi.find('#'+ $.prompt.options.prefix +'states :input').serializeArray(),function(i,obj){
					if (forminputs[obj.name] === undefined) {
						forminputs[obj.name] = obj.value;
					} else if (typeof forminputs[obj.name] == Array || typeof forminputs[obj.name] == 'object') {
						forminputs[obj.name].push(obj.value);
					} else {
						forminputs[obj.name] = [forminputs[obj.name],obj.value];	
					} 
				});

				// trigger an event
				var promptsubmite = new $.Event('promptsubmit');
				promptsubmite.stateName = statename;
				promptsubmite.state = $state;
				$state.trigger(promptsubmite, [clicked, msg, forminputs]);
				
				if(!promptsubmite.isDefaultPrevented()){
					$.prompt.close(true, clicked,msg,forminputs);
				}
			});
			$state.find('.'+ $.prompt.options.prefix +'buttons button:eq('+ stateobj.focus +')').addClass($.prompt.options.prefix +'defaultbutton');

		});

		var fadeClicked = function(){
			if($.prompt.options.persistent){
				var offset = ($.prompt.options.top.toString().indexOf('%') >= 0? ($window.height()*(parseInt($.prompt.options.top,10)/100)) : parseInt($.prompt.options.top,10)),
					top = parseInt($.prompt.jqi.css('top').replace('px',''),10) - offset;

				//$window.scrollTop(top);
				$('html,body').animate({ scrollTop: top }, 'fast', function(){
					var i = 0;
					$.prompt.jqib.addClass($.prompt.options.prefix +'warning');
					var intervalid = setInterval(function(){
						$.prompt.jqib.toggleClass($.prompt.options.prefix +'warning');
						if(i++ > 1){
							clearInterval(intervalid);
							$.prompt.jqib.removeClass($.prompt.options.prefix +'warning');
						}
					}, 100);
				});
			}
			else {
				$.prompt.close(true);
			}
		};
		
		var keyPressEventHandler = function(e){
			var key = (window.event) ? event.keyCode : e.keyCode; // MSIE or Firefox?
			
			//escape key closes
			if(key==27) {
				fadeClicked();	
			}
			
			//constrain tabs
			if (key == 9){
				var $inputels = $(':input:enabled:visible',$.prompt.jqib);
				var fwd = !e.shiftKey && e.target == $inputels[$inputels.length-1];
				var back = e.shiftKey && e.target == $inputels[0];
				if (fwd || back) {
				setTimeout(function(){ 
					if (!$inputels)
						return;
					var el = $inputels[back===true ? $inputels.length-1 : 0];

					if (el)
						el.focus();						
				},10);
				return false;
				}
			}
		};
		
		$.prompt.position();
		$.prompt.style();
		
		$.prompt.jqif.click(fadeClicked);
		$window.resize({animate:false}, $.prompt.position);
		$.prompt.jqib.bind("keydown keypress",keyPressEventHandler);
		$.prompt.jqi.find('.'+ $.prompt.options.prefix +'close').click($.prompt.close);
		$.prompt.jqib.bind('promptloaded', $.prompt.options.loaded);
		$.prompt.jqib.bind('promptclose', $.prompt.options.callback);
		$.prompt.jqib.bind('promptstatechanging', $.prompt.options.statechanging);
		$.prompt.jqib.bind('promptstatechanged', $.prompt.options.statechanged);

		//Show it
		$.prompt.jqif.fadeIn($.prompt.options.overlayspeed);
		$.prompt.jqi[$.prompt.options.show]($.prompt.options.promptspeed, function(){
			$.prompt.jqib.trigger('promptloaded');
		});
		$.prompt.jqi.find('#'+ $.prompt.options.prefix +'states .'+ $.prompt.options.prefix +'_state:first .'+ $.prompt.options.prefix +'defaultbutton').focus();
		
		if($.prompt.options.timeout > 0)
			setTimeout($.prompt.close,$.prompt.options.timeout);

		return $.prompt.jqib;
	};
	
	$.prompt.defaults = {
		prefix:'jqi',
		classes: '',
		buttons: {
			Ok: true
		},
	 	loaded: function(e){},
	  	submit: function(e,v,m,f){},
	 	callback: function(e,v,m,f){},
	 	statechanging: function(e, from, to){},
	 	statechanged: function(e, to){},
		opacity: 0.6,
	 	zIndex: 999,
	  	overlayspeed: 'slow',
	   	promptspeed: 'fast',
   		show: 'fadeIn',//'promptDropIn',
	   	focus: 0,
	   	useiframe: false,
	 	top: '15%',
	  	persistent: true,
	  	timeout: 0,
	  	state: {
			html: '',
		 	buttons: {
		 		Ok: true
		 	},
		  	focus: 0,
		  	position: { 
		  		container: null, 
		  		x: null, 
		  		y: null,
		  		arrow: null
		  	},
		   	submit: function(e,v,m,f){
		   		return true;
		   }
	  	}
	};
	
	$.prompt.currentPrefix = $.prompt.defaults.prefix;
	
	$.prompt.currentStateName = "";
	
	$.prompt.setDefaults = function(o) {
		$.prompt.defaults = $.extend({}, $.prompt.defaults, o);
	};
	
	$.prompt.setStateDefaults = function(o) {
		$.prompt.defaults.state = $.extend({}, $.prompt.defaults.state, o);
	};

	$.prompt.position = function(e){
		var restoreFx = $.fx.off,
			$window = $(window),
			bodyHeight = $(document.body).outerHeight(true),
			windowHeight = $(window).height(),
			documentHeight = $(document).height(),
			height = bodyHeight > windowHeight ? bodyHeight : windowHeight,
			top = parseInt($window.scrollTop(),10) + ($.prompt.options.top.toString().indexOf('%') >= 0? (windowHeight*(parseInt($.prompt.options.top,10)/100)) : parseInt($.prompt.options.top,10));

		// This fixes the whitespace at the bottom of the fade, but it is 
		// inconsistant and can cause an unneeded scrollbar, making the page jump
		//height = height > documentHeight? height : documentHeight;

		// when resizing the window turn off animation
		if(e !== undefined && e.data.animate === false)
			$.fx.off = true;
		
		$.prompt.jqib.css({
			position: "absolute",
			height: height,
			width: "100%",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0
		});
		$.prompt.jqif.css({
			position: "absolute",
			height: height,
			width: "100%",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0
		});

		// tour positioning
		if($.prompt.states[$.prompt.currentStateName].position.container !== null){
			var pos = $.prompt.states[$.prompt.currentStateName].position,
				offset = $(pos.container).offset();
				
			$.prompt.jqi.css({
				position: "absolute"
			});
			$.prompt.jqi.animate({
				top: offset.top + pos.y,
				left: offset.left + pos.x,
				marginLeft: 0,
				width: (pos.width !== undefined)? pos.width : null
			});
			top = (offset.top + pos.y) - ($.prompt.options.top.toString().indexOf('%') >= 0? (windowHeight*(parseInt($.prompt.options.top,10)/100)) : parseInt($.prompt.options.top,10));
			$('html,body').animate({ scrollTop: top }, 'slow', 'swing', function(){});
		}
		// standard prompt positioning
		else{
			$.prompt.jqi.css({
				position: "absolute",
				top: top,
				left: '50%',//$window.width()/2,
				marginLeft: (($.prompt.jqi.outerWidth()/2)*-1)
			});
		}

		// restore fx settings
		if(e !== undefined && e.data.animate === false)
			$.fx.off = restoreFx;
	};
	
	$.prompt.style = function(){
		$.prompt.jqif.css({
			zIndex: $.prompt.options.zIndex,
			display: "none",
			opacity: $.prompt.options.opacity
		});
		$.prompt.jqi.css({
			zIndex: $.prompt.options.zIndex+1,
			display: "none"
		});
		$.prompt.jqib.css({
			zIndex: $.prompt.options.zIndex
		});
	};

	$.prompt.getStateContent = function(state) {
		return $('#'+ $.prompt.currentPrefix +'_state_'+ state);
	};
	
	$.prompt.getCurrentState = function() {
		return $('.'+ $.prompt.currentPrefix +'_state:visible');
	};
	
	$.prompt.getCurrentStateName = function() {
		var stateid = $.prompt.getCurrentState().attr('id');
		
		return stateid.replace($.prompt.currentPrefix +'_state_','');
	};
	
	$.prompt.goToState = function(state, callback) {
		var promptstatechanginge = new $.Event('promptstatechanging');
		$.prompt.jqib.trigger(promptstatechanginge, [$.prompt.currentStateName, state]);
		
		if(!promptstatechanginge.isDefaultPrevented()){
			$.prompt.currentStateName = state;
			
			$('.'+ $.prompt.currentPrefix +'_state').slideUp('slow')
				.find('.'+ $.prompt.currentPrefix +'arrow').fadeOut();
			
			$('#'+ $.prompt.currentPrefix +'_state_'+ state).slideDown('slow',function(){
				var $t = $(this);
				$t.find('.'+ $.prompt.currentPrefix +'defaultbutton').focus();
				$t.find('.'+ $.prompt.currentPrefix +'arrow').fadeIn('slow');
				
				if (typeof callback == 'function'){
					$.prompt.jqib.bind('promptstatechanged.tmp', callback);
				}
				$.prompt.jqib.trigger('promptstatechanged', [state]);
				if (typeof callback == 'function'){
					$.prompt.jqib.unbind('promptstatechanged.tmp');
				}
			});
		
			$.prompt.position();
		
		}
	};
	
	$.prompt.nextState = function(callback) {
		var $next = $('#'+ $.prompt.currentPrefix +'_state_'+ $.prompt.currentStateName).next();
		$.prompt.goToState( $next.attr('id').replace($.prompt.currentPrefix +'_state_',''), callback );
	};
	
	$.prompt.prevState = function(callback) {
		var $prev = $('#'+ $.prompt.currentPrefix +'_state_'+ $.prompt.currentStateName).prev();
		$.prompt.goToState( $prev.attr('id').replace($.prompt.currentPrefix +'_state_',''), callback );
	};
	
	$.prompt.close = function(callCallback, clicked, msg, formvals){
		$.prompt.jqib.fadeOut('fast',function(){

			if(callCallback) {
				$.prompt.jqib.trigger('promptclose', [clicked,msg,formvals]);
			}
			$.prompt.jqib.remove();
			
			$('window').unbind('resize',$.prompt.position);
			
			if(($.browser.msie && $.browser.version < 7) && !$.prompt.options.useiframe) {
				$('select').css('visibility','visible');
			}
		});
	};
	
	$.fn.extend({ 
		prompt: function(options){
			if(options == undefined) 
				options = {};
			if(options.withDataAndEvents == undefined)
				options.withDataAndEvents = false;
			
			$.prompt($(this).clone(options.withDataAndEvents).html(),options);
		},
		promptDropIn: function(speed, callback){ 
			var $t = $(this); 
			
			if($t.css("display") == "none"){ 
				var eltop = $t.css('top');
				$t.css({ top: $(window).scrollTop(), display: 'block' }).animate({ top: eltop },speed,'swing',callback); 
			}
		}
		
	});
	
})(jQuery);
