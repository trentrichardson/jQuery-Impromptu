'use strict';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		// Metadata.
		pkg: grunt.file.readJSON('jquery-impromptu.jquery.json'),
		banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %>' +
			//' - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
			' - <%= pkg.modified %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
			' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
		// Task configuration.
		concat: {	
			dist: {
				options: {
					banner: '<%= banner %>',
					stripBanners: true
				},
				src: ['<%= pkg.name %>.js'],
				dest: '<%= pkg.name %>.js'
			}
		},
		uglify: {
			options: {
				banner: '<%= banner %>'
			},
			dist: {
				src: '<%= concat.dist.dest %>',
				dest: '<%= pkg.name %>.min.js'
			}
		},
		cssmin: {
			options: {
				banner: '<%= banner %>'
			},
			dist: {
				src: '<%= pkg.name %>.css',
				dest: '<%= pkg.name %>.min.css'
			}
		},
		jshint: {
			gruntfile: {
				options: {
					jshintrc: '.jshintrc'
				},
				src: 'Gruntfile.js'
			},
			dist: {
				options: {
					jshintrc: '.jshintrc'
				},
				src: ['<%=pkg.name %>.js']
			}
		},
		watch: {
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: ['jshint:gruntfile']
			},
			dist: {
				files: ['<%=pkg.name %>.js','<%=pkg.name %>.css'],
				tasks: ['jshint:dist', 'concat', 'uglify', 'cssmin']
			}
		}
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Default task.
	grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'cssmin']);

};
