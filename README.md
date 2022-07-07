# instatest

Super lightweight framework for instantaneous unit testing of JavaScript packages. 

## Installation

```
npm install instatest
```

## Usage

Insert a test into your code via
```
import * as insta from "instatest";

insta.beginUnit("my-package", "my-file");

insta.test("My test", () => {
  insta.assert(2 + 2 == 4, "Test addition");
});

insta.endUnit("my-package", "my-file");
```

Running 
```
npx instatest src
``` 
will search the `src` directory for all `.js` and `.mjs` files and run them. Afterwards, it will execute all found tests in the same order as they were found and display a summary of the result.
Note that only tests are executed which are in units with the same package name as the current package.

## Configuration

You can pass a list of files and directories to instatest. Directories are searched recursively for `.js` and `.mjs` files. For example, via
```
npx instatest index.js test
```
you run `index.js` and all `.js` and `.mjs` files located in the `test` directory or one of its subdirectories.

Of course, you can install instatest also as a script in your `package.json` file via
```
...
"scripts": {
    "test": "instatest index.js test",
    ...
  },
...
```
and then run it via
```
npm run test
```

Note that instatest assumes that your package is configured to use ES modules, so your `package.json` should also include
```
...
 "type": "module",
...
```

## Tests

The following assumes that you have imported the `instatest` module via
```
import * as insta from "instatest";
```

The statement `insta.test(descr, fn)` executes the tests in function `fn` and groups the results together under the label `descr`. The function `fn` can be an `async` function. 

Tests can be nested, for example:
```
insta.test("My Test", () => {
   insta.test("Addition", () => {
       insta.assertEq(2 + 2, 4);
       insta.assertEq(7 + 3, 10);
       insta.assertThrow(() => { throw 42; });
   });
   insta.test("Multiplication", () => {
       insta.assertEq(2 * 2, 4);
       insta.assertEq(7 * 3, 21);
   });
   insta.assertEq(1/0, Number.POSITIVE_INFINITY, "Division");
});
```

## Assert

Asserts must be done from within a surrounding test. The following variants are available:

* `assert(cond, descr)` or `assertTrue(cond, descr)`: Asserts that `cond` is strictly equal to `true`. 
* `assertFalse(cond, descr)`: Asserts that `cond` is strictly equal to `false`. 
* `assertEq(x, y, descr)`: Asserts that values `x` and `y` are equal. Equality is implemented via `eq`, which is basically strict equality for primitive types, and deep equality for objects. 
* `assertNEq(x, y, descr)`: Asserts that values `x` and `y` are unequal, i.e. that `!eq(x, y)`.
* `assertThrow(fn, descr)`: Asserts that executing the function `fn` asynchronously results in an exception. 
* `assertLazy(fn, descr)`: Asserts that asynchronous execution of the function `fn` results in a value strictly equal to `true`. 

## Units

Just as asserts live inside of tests, tests live inside of units. A unit has a package name, and can furthermore carry a list of arbitrary string qualifiers. Units are necessary so that testing can skip those tests which do not belong to the current package, but just to a package it depends on. A unit is started via 

```
insta.beginUnit("package", ...);
```
and ends with 
```
insta.endUnit("package", ...);
```
where the package name and qualifiers in `beginUnit` and `endUnit` must be the same, and unique compared to other units.

## Instantaneous Testing 

You can store your tests separately from the modules you are testing, or you can alternatively embed them directly in your modules.
Directly embedding tests is encouraged, and we call it *instantaneous testing*. It does not come with significant performance penalties, because simply loading a module which contains an `insta.test` statement will not execute the test; rather it will just schedule it for execution. The scheduled tests can be executed manually via 
```
insta.runTests(unitFilter);
```
Here `unitFilter` is a function that decides whether a particular test unit `[packageName, q0, q1, ...]` should be run. You can also pass a string `packageName`, or a prefix
`[packageName, q0, q1, ...]` instead of a function.

## Running Your Tests In The Browser

By passing the `--browser` option to instatest, instead of running the tests directly, it will generate a directory `instatest-browser`, for example:
```
npx instatest src --browser
```
To make use of it, you should have `webpack` and `http-server` installed:
```
npm install --save-dev webpack webpack-cli http-server
```
Then first run webpack via
```
npx webpack --config=instatest-browser/webpack.config.js
```
If that step was successful, you can now run the tests in the browser:
```
npx http-server -c-1 -o instatest-browser/index.html
```
Assuming you have already registered instatest in your `package.json` as a `test` script, you can streamline this by adding a `test-browser` script to your `package.json`:
```
...
"scripts": {
    "test": "instatest src",
    "pretest-browser": "npm run test -- --browser && npx webpack --config=instatest-browser/webpack.config.js",
    "test-browser": "npx http-server -c-1 -o instatest-browser",
    ...
  },
...
```
Now calling `npm run test-browser` will first freshly generate the `instatest-browser` directory, run webpack, and then start up a local http-server and a browser running your tests.

## Lockdown

Instatest encourages *locking down* your modules and APIs as much as possible. In particular, you can lock down instatest itself and the basic `Object` API via
```
insta.lockdown();
```
After executing above statement, the following will throw an error:
```
insta.assert.hey = "doesn't really make sense";
```
It also switches off the possibility to manipulate `Object`:
```
Object.really = "now why would you want to do that?";
```
will also throw an error.

To run your tests via npm in lockdown mode, configure instatest via the `package.json` of your package as follows:
```
...
 "config": {
    "instatest": {
      "lockdown": true
    },
    ...
  },
...
```
You can also pass `--lockdown` or `--lockdown=true` to instatest as an option.

There are two utility functions to help you lock down your own APIs:
* `insta.lockClass(cls)` locks down the class `cls`
* `insta.lockFunc(fn)` locks down the function `fn`





   
     



