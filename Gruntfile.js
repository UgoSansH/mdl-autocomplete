module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        compass: {
            sass: {
                options: {
                    sassDir        : 'src/scss',
                    cssDir         : '.tmp/css',
                    outputStyle    : 'expanded',
                    noLineComments : true
                }
            }
        }, //end compass
        cssmin : {
            combine : {
                options : {
                    report              : 'gzip',
                    keepSpecialComments : 0
                },
                files : {
                    'dist/mdl-autocomplete.css' : [
                        '.tmp/css/*.css'
                    ],
                }
            }
        },
        uglify : {
            default: {
                options : {
                    mangle        : false,
                    sourceMap     : true,
                    sourceMapName : 'dist/mdl-autocomplete.map'
                },
                files : {
                    'dist/mdl-autocomplete.js' : [
                        'src/*.js'
                    ]
                }
            }
        },
        watch: {
            css : {
                files : [
                    'src/scss/*.scss'
                ],
                tasks : ['css']
            },
            javascript: {
                files : [
                    'src/*.js',
                    'src/**/*.js'
                ],
                tasks : ['javascript']
            }
        }
    });

    grunt.registerTask('default', ['css','javascript']);
    grunt.registerTask('javascript', ['uglify:default']);
    grunt.registerTask('css', ['compass', 'cssmin']);
}
