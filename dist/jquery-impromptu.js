/*! jQuery-Impromptu - v5.3.1 - 2014-11-16
* http://trentrichardson.com/Impromptu
* Copyright (c) 2014 Trent Richardson; Licensed MIT */
(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else {
		factory(root.jQuery);
	}
}(this, function($) {
	"use strict";

	/**
	* Class constructor
	* @param message String/Object - String of html or Object of states
	* @param options Object - Options to set the prompt
	* @return jQuery - container with overlay and prompt
	*/
	var Imp = function(message, options) {
		// only for backwards compat, to be removed in future version
		if(options !== undefined && options.classes !== undefined && typeof options.classes === 'string'){
			options = { box: options.classes };
		}

		Imp.options = $.extend({},Imp.defaults,options);
		Imp.currentPrefix = Imp.options.prefix;

		// Be sure any previous timeouts are destroyed
		if(Imp.timeout){
			clearTimeout(Imp.timeout);
		}
		Imp.timeout = false;

		var opts = Imp.options,
			$body = $(document.body),
			$window = $(window);

		//build the box and fade
		var msgbox = '<div class="'+ Imp.options.prefix +'box '+ opts.classes.box +'">';
		if(opts.useiframe && ($('object, applet').length > 0)) {
			msgbox += '<iframe src="javascript:false;" style="display:block;position:absolute;z-index:-1;" class="'+ opts.prefix +'fade '+ opts.classes.fade +'"></iframe>';
		} else {
			msgbox +='<div class="'+ opts.prefix +'fade '+ opts.classes.fade +'"></div>';
		}
		msgbox += '<div class="'+ opts.prefix +' '+ opts.classes.prompt +'">'+
					'<form action="javascript:false;" onsubmit="return false;" class="'+ opts.prefix +'form '+ opts.classes.form +'">'+
						'<div class="'+ opts.prefix +'close '+ opts.classes.close +'">'+ opts.closeText +'</div>'+
						'<div class="'+ opts.prefix +'states"></div>'+
					'</form>'+
				'</div>'+
			'</div>';

		Imp.jqib = $(msgbox).appendTo($body);
		Imp.jqi = Imp.jqib.children('.'+ opts.prefix);//.data('jqi',opts);
		Imp.jqif = Imp.jqib.children('.'+ opts.prefix +'fade');

		//if a string was passed, convert to a single state
		if(message.constructor === String){
			message = {
				state0: {
					title: opts.title,
					html: message,
					buttons: opts.buttons,
					position: opts.position,
					focus: opts.focus,
					defaultButton: opts.defaultButton,
					submit: opts.submit
				}
			};
		}

		//build the states
		Imp.options.states = {};
		var k,v;
		for(k in message){
			v = $.extend({},Imp.defaults.state,{name:k},message[k]);
			Imp.addState(v.name, v);

			if(Imp.currentStateName === ''){
				Imp.currentStateName = v.name;
			}
		}

		//Events
		Imp.jqi.on('click', '.'+ opts.prefix +'buttons button', function(e){
			var $t = $(this),
				$state = $t.parents('.'+ opts.prefix +'state'),
				stateobj = Imp.options.states[$state.data('jqi-name')],
				msg = $state.children('.'+ opts.prefix +'message'),
				clicked = stateobj.buttons[$t.text()] || stateobj.buttons[$t.html()],
				forminputs = {};

			// if for some reason we couldn't get the value
			if(clicked === undefined){
				for(var i in stateobj.buttons){
					if(stateobj.buttons[i].title === $t.text() || stateobj.buttons[i].title === $t.html()){
						clicked = stateobj.buttons[i].value;
					}
				}
			}

			//collect all form element values from all states.
			$.each(Imp.jqi.children('form').serializeArray(),function(i,obj){
				if (forminputs[obj.name] === undefined) {
					forminputs[obj.name] = obj.value;
				} else if (typeof forminputs[obj.name] === Array || typeof forminputs[obj.name] === 'object') {
					forminputs[obj.name].push(obj.value);
				} else {
					forminputs[obj.name] = [forminputs[obj.name],obj.value];
				}
			});

			// trigger an event
			var promptsubmite = new $.Event('impromptu:submit');
			promptsubmite.stateName = stateobj.name;
			promptsubmite.state = $state;
			$state.trigger(promptsubmite, [clicked, msg, forminputs]);

			if(!promptsubmite.isDefaultPrevented()){
				Imp.close(true, clicked,msg,forminputs);
			}
		});

		// if the fade is clicked blink the prompt
		var fadeClicked = function(){
			if(opts.persistent){
				var offset = (opts.top.toString().indexOf('%') >= 0? ($window.height()*(parseInt(opts.top,10)/100)) : parseInt(opts.top,10)),
					top = parseInt(Imp.jqi.css('top').replace('px',''),10) - offset;

				//$window.scrollTop(top);
				$('html,body').animate({ scrollTop: top }, 'fast', function(){
					var i = 0;
					Imp.jqib.addClass(opts.prefix +'warning');
					var intervalid = setInterval(function(){
						Imp.jqib.toggleClass(opts.prefix +'warning');
						if(i++ > 1){
							clearInterval(intervalid);
							Imp.jqib.removeClass(opts.prefix +'warning');
						}
					}, 100);
				});
			}
			else {
				Imp.close(true);
			}
		};

		// listen for esc or tab keys
		var keyDownEventHandler = function(e){
			var key = (window.event) ? event.keyCode : e.keyCode;

			//escape key closes
			if(key === 27) {
				fadeClicked();
			}

			//enter key pressed trigger the default button if its not on it, ignore if it is a textarea
			if(key === 13){
				var $defBtn = Imp.getCurrentState().find('.'+ opts.prefix +'defaultbutton');
				var $tgt = $(e.target);

				if($tgt.is('textarea,.'+opts.prefix+'button') === false && $defBtn.length > 0){
					e.preventDefault();
					$defBtn.click();
				}
			}

			//constrain tabs, tabs should iterate through the state and not leave
			if (key === 9){
				var $inputels = $('input,select,textarea,button',Imp.getCurrentState());
				var fwd = !e.shiftKey && e.target === $inputels[$inputels.length-1];
				var back = e.shiftKey && e.target === $inputels[0];
				if (fwd || back) {
					setTimeout(function(){
						if (!$inputels){
							return;
						}
						var el = $inputels[back===true ? $inputels.length-1 : 0];

						if (el){
							el.focus();
						}
					},10);
					return false;
				}
			}
		};

		Imp.position();
		Imp.style();

		Imp.jqif.click(fadeClicked);
		$window.resize({animate:false}, Imp.position);
		Imp.jqi.find('.'+ opts.prefix +'close').click(Imp.close);
		Imp.jqib.on("keydown",keyDownEventHandler)
					.on('impromptu:loaded', opts.loaded)
					.on('impromptu:close', opts.close)
					.on('impromptu:statechanging', opts.statechanging)
					.on('impromptu:statechanged', opts.statechanged);

		// Show it
		Imp.jqif[opts.show](opts.overlayspeed);
		Imp.jqi[opts.show](opts.promptspeed, function(){

			var $firstState = Imp.jqi.find('.'+ opts.prefix +'states .'+ opts.prefix +'state').eq(0);
			Imp.goToState($firstState.data('jqi-name'));

			Imp.jqib.trigger('impromptu:loaded');
		});

		// Timeout
		if(opts.timeout > 0){
			Imp.timeout = setTimeout(function(){ Imp.close(true); },opts.timeout);
		}

		return Imp.jqib;
	};

	Imp.defaults = {
		prefix:'jqi',
		classes: {
			box: '',
			fade: '',
			prompt: '',
			form: '',
			close: '',
			title: '',
			message: '',
			buttons: '',
			button: '',
			defaultButton: ''
		},
		title: '',
		closeText: '&times;',
		buttons: {
			Ok: true
		},
		loaded: function(e){},
		submit: function(e,v,m,f){},
		close: function(e,v,m,f){},
		statechanging: function(e, from, to){},
		statechanged: function(e, to){},
		opacity: 0.6,
		zIndex: 999,
		overlayspeed: 'slow',
		promptspeed: 'fast',
		show: 'fadeIn',
		focus: 0,
		defaultButton: 0,
		useiframe: false,
		top: '15%',
		position: {
			container: null,
			x: null,
			y: null,
			arrow: null,
			width: null
		},
		persistent: true,
		timeout: 0,
		states: {},
		state: {
			name: null,
			title: '',
			html: '',
			buttons: {
				Ok: true
			},
			focus: 0,
			defaultButton: 0,
			position: {
				container: null,
				x: null,
				y: null,
				arrow: null,
				width: null
			},
			submit: function(e,v,m,f){
				return true;
			}
		}
	};

	/**
	* currentPrefix String - At any time this show be the prefix
	* of the current prompt ex: "jqi"
	*/
	Imp.currentPrefix = Imp.defaults.prefix;

	/**
	* currentStateName String - At any time this is the current state
	* of the current prompt ex: "state0"
	*/
	Imp.currentStateName = "";

	/**
	* setDefaults - Sets the default options
	* @param o Object - Options to set as defaults
	* @return void
	*/
	Imp.setDefaults = function(o) {
		Imp.defaults = $.extend({}, Imp.defaults, o);
	};

	/**
	* setStateDefaults - Sets the default options for a state
	* @param o Object - Options to set as defaults
	* @return void
	*/
	Imp.setStateDefaults = function(o) {
		Imp.defaults.state = $.extend({}, Imp.defaults.state, o);
	};

	/**
	* position - Repositions the prompt (Used internally)
	* @return void
	*/
	Imp.position = function(e){
		var restoreFx = $.fx.off,
			$state = Imp.getCurrentState(),
			stateObj = Imp.options.states[$state.data('jqi-name')],
			pos = stateObj? stateObj.position : undefined,
			$window = $(window),
			bodyHeight = document.body.scrollHeight, //$(document.body).outerHeight(true),
			windowHeight = $(window).height(),
			documentHeight = $(document).height(),
			height = bodyHeight > windowHeight ? bodyHeight : windowHeight,
			top = parseInt($window.scrollTop(),10) + (Imp.options.top.toString().indexOf('%') >= 0?
					(windowHeight*(parseInt(Imp.options.top,10)/100)) : parseInt(Imp.options.top,10));

		// when resizing the window turn off animation
		if(e !== undefined && e.data.animate === false){
			$.fx.off = true;
		}

		Imp.jqib.css({
			position: "absolute",
			height: height,
			width: "100%",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0
		});
		Imp.jqif.css({
			position: "fixed",
			height: height,
			width: "100%",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0
		});

		// tour positioning
		if(pos && pos.container){
			var offset = $(pos.container).offset();

			if($.isPlainObject(offset) && offset.top !== undefined){
				Imp.jqi.css({
					position: "absolute"
				});
				Imp.jqi.animate({
					top: offset.top + pos.y,
					left: offset.left + pos.x,
					marginLeft: 0,
					width: (pos.width !== undefined)? pos.width : null
				});
				top = (offset.top + pos.y) - (Imp.options.top.toString().indexOf('%') >= 0? (windowHeight*(parseInt(Imp.options.top,10)/100)) : parseInt(Imp.options.top,10));
				$('html,body').animate({ scrollTop: top }, 'slow', 'swing', function(){});
			}
		}
		// custom state width animation
		else if(pos && pos.width){
			Imp.jqi.css({
					position: "absolute",
					left: '50%'
				});
			Imp.jqi.animate({
					top: pos.y || top,
					left: pos.x || '50%',
					marginLeft: ((pos.width/2)*-1),
					width: pos.width
				});
		}
		// standard prompt positioning
		else{
			Imp.jqi.css({
				position: "absolute",
				top: top,
				left: '50%',//$window.width()/2,
				marginLeft: ((Imp.jqi.outerWidth(false)/2)*-1)
			});
		}

		// restore fx settings
		if(e !== undefined && e.data.animate === false){
			$.fx.off = restoreFx;
		}
	};

	/**
	* style - Restyles the prompt (Used internally)
	* @return void
	*/
	Imp.style = function(){
		Imp.jqif.css({
			zIndex: Imp.options.zIndex,
			display: "none",
			opacity: Imp.options.opacity
		});
		Imp.jqi.css({
			zIndex: Imp.options.zIndex+1,
			display: "none"
		});
		Imp.jqib.css({
			zIndex: Imp.options.zIndex
		});
	};

	/**
	* get - Get the prompt
	* @return jQuery - the prompt
	*/
	Imp.get = function(state) {
		return $('.'+ Imp.currentPrefix);
	};

	/**
	* addState - Injects a state into the prompt
	* @param statename String - Name of the state
	* @param stateobj Object - options for the state
	* @param afterState String - selector of the state to insert after
	* @return jQuery - the newly created state
	*/
	Imp.addState = function(statename, stateobj, afterState) {
		var state = "",
			$state = null,
			arrow = "",
			title = "",
			opts = Imp.options,
			$jqistates = $('.'+ Imp.currentPrefix +'states'),
			buttons = [],
			showHtml,defbtn,k,v,l,i=0;

		stateobj = $.extend({},Imp.defaults.state, {name:statename}, stateobj);

		if(stateobj.position.arrow !== null){
			arrow = '<div class="'+ opts.prefix + 'arrow '+ opts.prefix + 'arrow'+ stateobj.position.arrow +'"></div>';
		}
		if(stateobj.title && stateobj.title !== ''){
			title = '<div class="lead '+ opts.prefix + 'title '+ opts.classes.title +'">'+  stateobj.title +'</div>';
		}

		showHtml = stateobj.html;
		if (typeof stateobj.html === 'function') {
			showHtml = 'Error: html function must return text';
		}

		state += '<div id="'+ opts.prefix +'state_'+ statename +'" class="'+ opts.prefix + 'state" data-jqi-name="'+ statename +'" style="display:none;">'+
					arrow + title +
					'<div class="'+ opts.prefix +'message '+ opts.classes.message +'">' + showHtml +'</div>'+
					'<div class="'+ opts.prefix +'buttons '+ opts.classes.buttons +'"'+ ($.isEmptyObject(stateobj.buttons)? 'style="display:none;"':'') +'>';

		// state buttons may be in object or array, lets convert objects to arrays
		if($.isArray(stateobj.buttons)){
			buttons = stateobj.buttons;
		}
		else if($.isPlainObject(stateobj.buttons)){
			for(k in stateobj.buttons){
				if(stateobj.buttons.hasOwnProperty(k)){
					buttons.push({ title: k, value: stateobj.buttons[k] });
				}
			}
		}

		// iterate over each button and create them
		for(i=0, l=buttons.length; i<l; i++){
			v = buttons[i],
			defbtn = stateobj.focus === i || (isNaN(stateobj.focus) && stateobj.defaultButton === i) ? (Imp.currentPrefix + 'defaultbutton ' + opts.classes.defaultButton) : '';

			state += '<button class="'+ opts.classes.button +' '+ Imp.currentPrefix + 'button '+ defbtn;

			if(typeof v.classes !== "undefined"){
				state += ' '+ ($.isArray(v.classes)? v.classes.join(' ') : v.classes) + ' ';
			}

			state += '" name="' + opts.prefix + '_' + statename + '_button' + v.title.replace(/[^a-z0-9]+/gi,'') + '" id="' + opts.prefix + '_' + statename + '_button' + v.title.replace(/[^a-z0-9]+/gi,'') + '" value="' + v.value + '">' + v.title + '</button>';
		}
		
		state += '</div></div>';

		$state = $(state);

		$state.on('impromptu:submit', stateobj.submit);

		if(afterState !== undefined){
			$jqistates.find('#'+ Imp.currentPrefix +'state_'+ afterState).after($state);
		}
		else{
			$jqistates.append($state);
		}

		Imp.options.states[statename] = stateobj;

		return $state;
	};

	/**
	* removeState - Removes a state from the prompt
	* @param state String - Name of the state
	* @param newState String - Name of the state to transition to
	* @return Boolean - returns true on success, false on failure
	*/
	Imp.removeState = function(state, newState) {
		var $state = Imp.getState(state),
			rm = function(){ $state.remove(); };

		if($state.length === 0){
			return false;
		}

		// transition away from it before deleting
		if($state.css('display') !== 'none'){
			if(newState !== undefined && Imp.getState(newState).length > 0){
				Imp.goToState(newState, false, rm);
			}
			else if($state.next().length > 0){
				Imp.nextState(rm);
			}
			else if($state.prev().length > 0){
				Imp.prevState(rm);
			}
			else{
				Imp.close();
			}
		}
		else{
			$state.slideUp('slow', rm);
		}

		return true;
	};

	/**
	* getState - Get the state by its name
	* @param state String - Name of the state
	* @return jQuery - the state
	*/
	Imp.getState = function(state) {
		return $('#'+ Imp.currentPrefix +'state_'+ state);
	};
	Imp.getStateContent = function(state) {
		return Imp.getState(state);
	};

	/**
	* getCurrentState - Get the current visible state
	* @return jQuery - the current visible state
	*/
	Imp.getCurrentState = function() {
		return Imp.getState(Imp.getCurrentStateName());
	};

	/**
	* getCurrentStateName - Get the name of the current visible state
	* @return String - the current visible state's name
	*/
	Imp.getCurrentStateName = function() {
		return Imp.currentStateName;
	};

	/**
	* goToState - Goto the specified state
	* @param state String - name of the state to transition to
	* @param subState Boolean - true to be a sub state within the currently open state
	* @param callback Function - called when the transition is complete
	* @return jQuery - the newly active state
	*/
	Imp.goToState = function(state, subState, callback) {
		var $jqi = Imp.get(),
			jqiopts = Imp.options,
			$state = Imp.getState(state),
			stateobj = jqiopts.states[$state.data('jqi-name')],
			promptstatechanginge = new $.Event('impromptu:statechanging'),
			opts = Imp.options;

		if(stateobj !== undefined){


			if (typeof stateobj.html === 'function') {
				var contentLaterFunc = stateobj.html;
				$state.find('.' + opts.prefix +'message ').html(contentLaterFunc());
			}

			// subState can be ommitted
			if(typeof subState === 'function'){
				callback = subState;
				subState = false;
			}

			Imp.jqib.trigger(promptstatechanginge, [Imp.getCurrentStateName(), state]);

			if(!promptstatechanginge.isDefaultPrevented() && $state.length > 0){
				Imp.jqi.find('.'+ Imp.currentPrefix +'parentstate').removeClass(Imp.currentPrefix +'parentstate');

				if(subState){ // hide any open substates
					// get rid of any substates
					Imp.jqi.find('.'+ Imp.currentPrefix +'substate').not($state)
						.slideUp(jqiopts.promptspeed)
						.removeClass('.'+ Imp.currentPrefix +'substate')
						.find('.'+ Imp.currentPrefix +'arrow').hide();

					// add parent state class so it can be visible, but blocked
					Imp.jqi.find('.'+ Imp.currentPrefix +'state:visible').addClass(Imp.currentPrefix +'parentstate');

					// add substate class so we know it will be smaller
					$state.addClass(Imp.currentPrefix +'substate');
				}
				else{ // hide any open states
					Imp.jqi.find('.'+ Imp.currentPrefix +'state').not($state)
						.slideUp(jqiopts.promptspeed)
						.find('.'+ Imp.currentPrefix +'arrow').hide();
				}
				Imp.currentStateName = stateobj.name;

				$state.slideDown(jqiopts.promptspeed,function(){
					var $t = $(this);

					// if focus is a selector, find it, else its button index
					if(typeof(stateobj.focus) === 'string'){
						$t.find(stateobj.focus).eq(0).focus();
					}
					else{
						$t.find('.'+ Imp.currentPrefix +'defaultbutton').focus();
					}

					$t.find('.'+ Imp.currentPrefix +'arrow').show(jqiopts.promptspeed);

					if (typeof callback === 'function'){
						Imp.jqib.on('impromptu:statechanged', callback);
					}
					Imp.jqib.trigger('impromptu:statechanged', [state]);
					if (typeof callback === 'function'){
						Imp.jqib.off('impromptu:statechanged', callback);
					}
				});
				if(!subState){
					Imp.position();
				}
			} // end isDefaultPrevented()	
		}// end stateobj !== undefined

		return $state;
	};

	/**
	* nextState - Transition to the next state
	* @param callback Function - called when the transition is complete
	* @return jQuery - the newly active state
	*/
	Imp.nextState = function(callback) {
		var $next = $('#'+ Imp.currentPrefix +'state_'+ Imp.getCurrentStateName()).next();
		if($next.length > 0){
			Imp.goToState( $next.attr('id').replace(Imp.currentPrefix +'state_',''), callback );
		}
		return $next;
	};

	/**
	* prevState - Transition to the previous state
	* @param callback Function - called when the transition is complete
	* @return jQuery - the newly active state
	*/
	Imp.prevState = function(callback) {
		var $prev = $('#'+ Imp.currentPrefix +'state_'+ Imp.getCurrentStateName()).prev();
		if($prev.length > 0){
			Imp.goToState( $prev.attr('id').replace(Imp.currentPrefix +'state_',''), callback );
		}
		return $prev;
	};

	/**
	* close - Closes the prompt
	* @param callback Function - called when the transition is complete
	* @param clicked String - value of the button clicked (only used internally)
	* @param msg jQuery - The state message body (only used internally)
	* @param forvals Object - key/value pairs of all form field names and values (only used internally)
	* @return jQuery - the newly active state
	*/
	Imp.close = function(callCallback, clicked, msg, formvals){
		if(Imp.timeout){
			clearTimeout(Imp.timeout);
			Imp.timeout = false;
		}

		if(Imp.jqib){
			Imp.jqib.fadeOut('fast',function(){
				
				Imp.jqib.trigger('impromptu:close', [clicked,msg,formvals]);
				
				Imp.jqib.remove();
				
				$(window).off('resize',Imp.position);

				if(typeof callCallback === 'function'){
					callCallback();
				}
			});
		}
		Imp.currentStateName = "";
	};

	/**
	* Enable using $('.selector').prompt({});
	* This will grab the html within the prompt as the prompt message
	*/
	$.fn.prompt = function(options){
		if(options === undefined){
			options = {};
		}
		if(options.withDataAndEvents === undefined){
			options.withDataAndEvents = false;
		}

		new Imp($(this).clone(options.withDataAndEvents).html(),options);
	};

	$.prompt = Imp;
	window.Impromptu = Imp;

}));
