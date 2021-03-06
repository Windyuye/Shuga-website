var gulp = require('gulp-help')(require('gulp'));
var fileinclude = require('gulp-file-include');
var del = require('del');
var runSequence = require('run-sequence');
var sitemap = require('gulp-sitemap');
var fetch = require('node-fetch');
var rename = require('gulp-rename');

gulp.task('build', function (cb) {
    runSequence('copy-files', 'copy-edm-files', 'copy-edm-images', 'build-sitemap', cb);
//    runSequence('copy-files', 'compile-template', 'build-reward-items', 'build-reward-page', 'build-sitemap', cb);
});

gulp.task('build-sitemap', function () {
    return gulp.src(['./delta/dist/**/*.html'], {read: false})
        .pipe(sitemap({
            siteUrl: 'https://www.shuga.io',
            priority: 0.80,
            mappings: [
                {
                    pages: ['index.html'],
                    priority: 1.00,
                    getLoc(siteUrl, loc, entry) {
                        // Removes the file extension if it exists
                        return loc.endsWith("//") ? loc.slice(0, -1) : loc;
                    }
                },
                {
                    pages: ['signUp.html'],
                    priority: 0.64,
                }
            ]
        }))
        .pipe(gulp.dest('./delta/dist/', {overwrite: true}));
});

gulp.task('compile-template', function () {
    return gulp.src(['./delta/templates/src/*.html', "!./delta/templates/src/rewards.html"])
        .pipe(fileinclude())
        .pipe(gulp.dest('./delta/dist/', {overwrite: true}));
});

gulp.task('build-reward-page', function () {
    return fetchRedeemProducts().then(function (redeemProducts) {
        var rewardItems = redeemProducts.results.map(function (redeemProduct) {
            return redeemProduct.id;
        });
        return gulp.src(['./delta/templates/src/rewards.html'])
            .pipe(fileinclude({
                context: {
                    rewardItems: rewardItems
                }
            }))
            .pipe(gulp.dest('./delta/dist/', {overwrite: true}));
    });
    
});

gulp.task('build-reward-items', function () {
    return fetchRedeemProducts().then(function (redeemProducts) {
        var promises = redeemProducts.results.map(function (redeemProduct) {
            var originalShuga = Number(redeemProduct.price) * 200;
            var shuga = Number(redeemProduct.shuga);
            redeemProduct.originalShuga = originalShuga !== shuga ? toNumberWithCommas(originalShuga) : null;
            redeemProduct.price = toNumberWithCommas(redeemProduct.displayPrice || redeemProduct.price);
            redeemProduct.shuga = toNumberWithCommas(redeemProduct.shuga);
            redeemProduct.htmlUrl = 'products/' + redeemProduct.id + '.html';
            return gulp.src(['./delta/templates/modules/rewardItem.html'])
                .pipe(fileinclude({
                    context: {
                        reward: redeemProduct
                    }
                }))
                .pipe(rename(redeemProduct.id + '.html'))
                .pipe(gulp.dest('./delta/dist/products/', {overwrite: true}));
        });
    });
});

function toNumberWithCommas(number) {
    return number ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
}

var fetchRedeemProducts = function () {
    return fetch('https://api.shuga.io/redeemProduct?page=0&pageSize=1000&type=all').then(function (res) {
        return res.json();
    }).then(function (json) {
        return json;
    });
}

gulp.task('copy-files', function () {
    return gulp.src(['./delta/src/**/*'])
        .pipe(gulp.dest('./delta/dist/', {overwrite: true}));
});

gulp.task('copy-edm-files', function () {
    return gulp.src(['./delta/templates/src/edm/**/*'])
        .pipe(gulp.dest('./delta/dist/edm', {overwrite: true}));
});

gulp.task('copy-edm-images', function () {
    return gulp.src(['./delta/templates/src/images/edm/**/*'])
        .pipe(gulp.dest('./delta/dist/images/edm', {overwrite: true}));
});



gulp.task('clean', function () {
    del('./delta/dist');
});
