const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const gxml = require('gulp-xml2js');
const rename = require('gulp-rename');

const projFileMatcher = /\.[fc]sproj$/;
const mockPath = 'test/mocks';

gulp.task('generate-json', () => {
    return new Promise((resolve, reject) =>
        fs.readdir(mockPath, (err, files) => {
            if (err) {
                return reject(err);
            }

            let tasks = [];
            files.forEach((file) => {
                if (projFileMatcher.test(file)) {
                    let p = new Promise((resolve, _) => {
                        gulp.src(path.resolve(mockPath, file))
                            .pipe(gxml())
                            .pipe(rename((path) => path.extname = '.json'))
                            .pipe(gulp.dest(path.join('.', 'out', mockPath)))
                            .on('end', resolve);
                    });
                    tasks.push(p);
                }
            });
            Promise.all(tasks).then(resolve);
    }));
});

gulp.task('copy-mock-files', () => {
    return gulp.src(path.join(mockPath, 'mockProject', '**', '*'))
        .pipe(gulp.dest(path.join('.', 'out', mockPath, 'mockProject')));
});

gulp.task('prepare-files', gulp.series(['copy-mock-files', 'generate-json']));
