describe('jquery-impromptu', function() {

	// ====================================================================================
	// ====================================================================================
	describe('basic initialization', function() {

		beforeEach(function() {			
			$.fx.off = true; // for our testing lets turn off fx
		});

		afterEach(function() {
			$.prompt.close();
		});

		it('should be defined', function() {
			
			expect($.prompt).not.toBeUndefined();
		});

		it('should generate markup', function() {
			var expectedTitle = 'This is a title',
				expectedText = 'This is a test';

			$.prompt(expectedText, { title: expectedTitle });

			expect($('.jqibox').length).toEqual(1);
			expect($('.jqifade').length).toEqual(1);
			expect($('.jqi').length).toEqual(1);
			expect($('.jqi .jqititle').text()).toBe(expectedTitle);
			expect($('.jqi .jqimessage').text()).toBe(expectedText);
		});

	});


	// ====================================================================================
	// ====================================================================================
	describe('button creation', function() {

		beforeEach(function() {			
			$.fx.off = true; // for our testing lets turn off fx
		});

		afterEach(function() {
			$.prompt.close();
		});


		it('should generate buttons from hash', function() {

			$.prompt('This is a test', {
				buttons: { Ok:true, Cancel:false }
			});
			var okBtn = $('#jqi_state0_buttonOk'),
				cancelBtn = $('#jqi_state0_buttonCancel');

			expect($('.jqibutton').length).toBe(2);

			expect(okBtn.length).toBe(1);
			expect(cancelBtn.length).toBe(1);

			expect(okBtn.text()).toBe('Ok');
			expect(cancelBtn.text()).toBe('Cancel');

			expect(okBtn.val()).toBe('true');
			expect(cancelBtn.val()).toBe('false');
		});

		it('should generate buttons from array', function() {

			$.prompt('This is a test', {
				buttons: [
					{ title: 'Ok', value: true },
					{ title: 'Cancel', value: false }
				]
			});
			var okBtn = $('#jqi_state0_buttonOk'),
				cancelBtn = $('#jqi_state0_buttonCancel');

			expect($('.jqibutton').length).toBe(2);

			expect(okBtn.length).toBe(1);
			expect(cancelBtn.length).toBe(1);

			expect(okBtn.text()).toBe('Ok');
			expect(cancelBtn.text()).toBe('Cancel');

			expect(okBtn.val()).toBe('true');
			expect(cancelBtn.val()).toBe('false');
		});

		it('should add classes to buttons', function() {

			$.prompt('This is a test', {
				buttons: [
					{ title: 'Ok', value: true, classes: ['ok1','ok2'] },
					{ title: 'Cancel', value: false, classes: 'cancel1 cancel2' }
				]
			});
			var okBtn = $('#jqi_state0_buttonOk'),
				cancelBtn = $('#jqi_state0_buttonCancel');

			expect(okBtn.hasClass('ok1')).toBe(true);
			expect(okBtn.hasClass('ok2')).toBe(true);

			expect(cancelBtn.hasClass('cancel1')).toBe(true);
			expect(cancelBtn.hasClass('cancel2')).toBe(true);
		});

		it('should add classes to buttons from classes obj', function() {

			$.prompt('This is a test', {
				buttons: [
					{ title: 'Ok', value: true, classes: ['ok1','ok2'] },
					{ title: 'Cancel', value: false, classes: 'cancel1 cancel2' }
				],
				classes: { button: 'testclass' }
			});
			var okBtn = $('#jqi_state0_buttonOk'),
				cancelBtn = $('#jqi_state0_buttonCancel');

			expect(okBtn.hasClass('testclass')).toBe(true);
			expect(cancelBtn.hasClass('testclass')).toBe(true);
		});

		it('should default correct button', function() {

			$.prompt('This is a test', {
				buttons: [
					{ title: 'Ok', value: 1 },
					{ title: 'Cancel', value: 2 },
					{ title: 'Another', value: 3 }
				],
				focus: 1
			});
			var okBtn = $('#jqi_state0_buttonOk'),
				cancelBtn = $('#jqi_state0_buttonCancel'),
				anotherBtn = $('#jqi_state0_buttonAnother');

			expect(okBtn.hasClass('jqidefaultbutton')).toBe(false);
			expect(cancelBtn.hasClass('jqidefaultbutton')).toBe(true);
			expect(anotherBtn.hasClass('jqidefaultbutton')).toBe(false);
		});

		it('should default correct button when focus on an input', function() {

			$.prompt('This is a test <input type="text" id="testInput" />', {
				buttons: [
					{ title: 'Ok', value: 1 },
					{ title: 'Cancel', value: 2 },
					{ title: 'Another', value: 3 }
				],
				focus: '#testInput',
				defaultButton: 1
			});
			var okBtn = $('#jqi_state0_buttonOk'),
				cancelBtn = $('#jqi_state0_buttonCancel'),
				anotherBtn = $('#jqi_state0_buttonAnother');

			expect(okBtn.hasClass('jqidefaultbutton')).toBe(false);
			expect(cancelBtn.hasClass('jqidefaultbutton')).toBe(true);
			expect(anotherBtn.hasClass('jqidefaultbutton')).toBe(false);
		});

	});

	// ====================================================================================
	// ====================================================================================
	describe('state creation', function() {

		beforeEach(function() {			
			$.fx.off = true; // for our testing lets turn off fx
		});

		afterEach(function() {
			$.prompt.close();
		});

		it('should create a single state from string', function() {

			$.prompt('This is a test');
			
			expect($('.jqistate').length).toBe(1);
		});

		it('should create states from hash', function() {
			var states = {
				s1: { html: 'state 1' },
				s2: { html: 'state 2' },
				s3: { html: 'state 3' }
			};

			$.prompt(states);
			
			expect($('.jqistate').length).toBe(3);

			expect($('#jqistate_s1 .jqimessage').text()).toBe(states.s1.html);
			expect($('#jqistate_s2 .jqimessage').text()).toBe(states.s2.html);
			expect($('#jqistate_s3 .jqimessage').text()).toBe(states.s3.html);
		});

		it('should create states from array', function() {
			var states = [
				{ html: 'state 1' },
				{ html: 'state 2' },
				{ html: 'state 3' }
			];

			$.prompt(states);
			
			expect($('.jqistate').length).toBe(3);

			expect($('#jqistate_0 .jqimessage').text()).toBe(states[0].html);
			expect($('#jqistate_1 .jqimessage').text()).toBe(states[1].html);
			expect($('#jqistate_2 .jqimessage').text()).toBe(states[2].html);
		});

		it('should show the first state automatically', function() {

			// we can't reliably determine which entry is the first with a hash, js doesn't preserve order
			var states = [
				{ html: 'state 1' },
				{ html: 'state 2' },
				{ html: 'state 3' }
			];

			$.prompt(states);

			expect($('#jqistate_0').css('display')).toBe('block');
			expect($('#jqistate_1').css('display')).toBe('none');
			expect($('#jqistate_2').css('display')).toBe('none');
		});

		it('should name states properly when name specified', function() {
			var states = [
				{ name: 's1', html: 'state 1' },
				{ name: 's2', html: 'state 2' },
				{ name: 's3', html: 'state 3' }
			];

			$.prompt(states);
			
			expect($('#jqistate_s1').length).toBe(1);
			expect($('#jqistate_s2').length).toBe(1);
			expect($('#jqistate_s3').length).toBe(1);
		});
	});


	// ====================================================================================
	// ====================================================================================
	describe('api methods', function() {
		var states = [
				{ name: 's1', html: 'state 1' },
				{ name: 's2', html: 'state 2' },
				{ name: 's3', html: 'state 3' }
			];

		beforeEach(function() {			
			$.fx.off = true; // for our testing lets turn off fx

		});

		afterEach(function() {
			$.prompt.close();
		});

		describe('$.prompt.get()', function() {
			it('should return the prompt jquery object', function() {
				
				$.prompt('This is a test');

				var actualResult = $.prompt.get(),
					expectedResult = $('.jqi');

				expect(actualResult[0]).toBe(expectedResult[0]);
			});
		});

		describe('$.prompt.getState()', function() {
			it('should return the state jquery object', function() {

				$.prompt(states);
				
				var actualResult = $.prompt.getState('s2'),
					expectedResult = $('#jqistate_s2');

				expect(actualResult[0]).toBe(expectedResult[0]);
			});
		});

		describe('$.prompt.goToState()', function() {
			it('should make the requested state visible', function() {

				$.prompt(states);
				
				$.prompt.goToState('s3');

				expect($('#jqistate_s1').css('display')).toBe('none');
				expect($('#jqistate_s2').css('display')).toBe('none');
				expect($('#jqistate_s3').css('display')).toBe('block');
			});

			it('should do nothing if the state is not available', function() {

				$.prompt(states);
				
				$.prompt.goToState('s4');

				expect($('#jqistate_s1').css('display')).toBe('block');
				expect($('#jqistate_s2').css('display')).toBe('none');
				expect($('#jqistate_s3').css('display')).toBe('none');
			});

			it('should handle substate option', function() {

				$.prompt(states);
				
				$.prompt.goToState('s2',true);

				expect($('#jqistate_s1').css('display')).toBe('block');
				expect($('#jqistate_s2').css('display')).toBe('block');
				expect($('#jqistate_s3').css('display')).toBe('none');

				expect($('#jqistate_s2').hasClass('jqisubstate')).toBe(true);
			});
		});

		describe('$.prompt.nextState()', function() {
			it('should make the next state visible', function() {
				
				$.prompt(states);
				
				$.prompt.nextState();

				expect($('#jqistate_s1').css('display')).toBe('none');
				expect($('#jqistate_s2').css('display')).toBe('block');
				expect($('#jqistate_s3').css('display')).toBe('none');
			});

			it('should do nothing if the state is not available', function() {

				$.prompt(states);
				
				$.prompt.goToState('s3');
				$.prompt.nextState();

				expect($('#jqistate_s1').css('display')).toBe('none');
				expect($('#jqistate_s2').css('display')).toBe('none');
				expect($('#jqistate_s3').css('display')).toBe('block');
			});
		});

		describe('$.prompt.prevState()', function() {
			it('should make the previous state visible', function() {
				
				$.prompt(states);
				
				$.prompt.goToState('s3');
				$.prompt.prevState();

				expect($('#jqistate_s1').css('display')).toBe('none');
				expect($('#jqistate_s2').css('display')).toBe('block');
				expect($('#jqistate_s3').css('display')).toBe('none');
			});

			it('should do nothing if the state is not available', function() {

				$.prompt(states);
				
				$.prompt.prevState();

				expect($('#jqistate_s1').css('display')).toBe('block');
				expect($('#jqistate_s2').css('display')).toBe('none');
				expect($('#jqistate_s3').css('display')).toBe('none');
			});
		});

		describe('$.prompt.addState()', function() {
			it('should add a new state as the last state', function() {
				var newState = {
					name: 's4',
					title: 's4',
					html: 'testing s4',
					buttons: { Ok:true,Cancel:false}
				};

				$.prompt(states);
				
				var $stateobj = $.prompt.addState(newState.name, newState);

				// element created?
				expect($stateobj.length).toBe(1);

				// element in the right place?
				expect($stateobj.prev().attr('id')).toBe('jqistate_s3');

				// element visibility correct?
				expect($('#jqistate_s1').css('display')).toBe('block');
				expect($stateobj.css('display')).toBe('none');

				// content generated ok?
				expect($stateobj.find('.jqimessage').text()).toBe(newState.html);
				expect($stateobj.find('.jqititle').text()).toBe(newState.title);
				expect($stateobj.find('.jqibutton').length).toBe(2);
			});

			it('should add a new state after specified state', function() {
				var newState = {
					name: 's4',
					title: 's4',
					html: 'testing s4',
					buttons: { Ok:true,Cancel:false}
				},
				afterState = 's2';

				$.prompt(states);
				
				var $stateobj = $.prompt.addState(newState.name, newState, afterState);

				expect($stateobj.prev().attr('id')).toBe('jqistate_'+afterState);
			});
		});

		describe('$.prompt.removeState()', function() {
			it('should remove the specified state', function() {
				
				$.prompt(states);
				
				$.prompt.removeState('s2');

				expect($('#jqistate_s2').length).toBe(0);
			});
			/*
			it('should display next visible state', function() {

				$.prompt(states);
				
				$.prompt.removeState('s1');

				expect($('#jqistate_s2').css('display')).toBe('block');
				expect($('#jqistate_s3').css('display')).toBe('none');
			});
			*/
		});

	});

});
