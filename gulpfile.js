var gulp = require('gulp');
var clean = require('gulp-clean');
var run = require('gulp-run')
var mocha = require('gulp-mocha');

gulp.task('clean', function () {
    console.log('Cleaning .NET Core project...');
    return gulp.src('./').pipe(run('dotnet clean openapi-diff/OpenApiDiff.sln'));
});

gulp.task('restore', function () {
    console.log('Restoring .NET Core project...');
    return gulp.src('./').pipe(run('dotnet restore openapi-diff/OpenApiDiff.sln'));
});

gulp.task('build', ['clean', 'restore'], function () {
    console.log('Building .NET Core project...');
    return gulp.src('./').pipe(run('dotnet build -c release openapi-diff/OpenApiDiff.sln /nologo /clp:NoSummary'));
});

gulp.task('publish', ['build'], function () {
    console.log('Publishing .NET proejct...');
    return gulp
        .src('./')
        .pipe(run('dotnet publish -c release openapi-diff/src/core/OpenApiDiff/OpenApiDiff.csproj'));
});

gulp.task('pack', ['publish'], function () {
    console.log('Packing the Node Application...');
    return gulp.src('./').pipe(run('npm pack'));
});

gulp.task('test', ['build'], function () {
    console.log('Running the unit tests...');
    return gulp.src('./').pipe(run('dotnet test openapi-diff/src/modeler/AutoRest.Swagger.Tests/AutoRest.Swagger.Tests.csproj'));
});

gulp.task('default', function () {
    return gulp.run('test');
});
