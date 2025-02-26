---
category: advanced
path: /advanced/sherlock
title: "Sherlock"
hidden: true
---

In order to simplify our work maintaining Yarn, we ask you to help us by providing reproductions for the bugs you encounter. We can't stress this enough: under normal circumstances, **no reproduction will mean no help** and your issue may be closed for this reason.

To help you help us, we use a tool called [Sherlock](https://github.com/arcanis/sherlock) which allows you to attach reproduction testcases to your issues. In a sense, it's a bit like if you were writing a Jest test directly in your issue. By using this system we can quickly check whether a problem can be reproduced, and whether our fix is the right one. It's win-win for everyone!

```toc
# This code block gets replaced with the Table of Contents
```

## Adding a reproduction to your issue

Adding a reproduction is as simple as adding a markdown codefence to your issue:

~~~markdown
This is my reproduction case:

```js repro
const foo = await ...;
```
~~~

> **Important:** Note that the codefence is not only tagged `js`, but also `repro`. This is critical, as we don't want to execute every single snippet!

## Available functions

You can use all of Javascript inside the repro code, including `async/await`. In fact, you can even use top-level `await`! As far as the runtime go you should have access to all of Node's APIs, plus some extras:

- In order to simplify some tasks that would be very menial otherwise (like spawning the Yarn process, or running a Node script in the generated environment), we provide a set of builtin functions that abstract these semantics. You can find the full reference inside [our repository](scripts/actions/sherlock-prepare.js), along with some documentation.

- The [expect](https://jestjs.io/docs/en/expect) API is available globally and *must* be used to describe the assertions in your test (simply throwing will cause Sherlock to mark your reproduction case as broken).

## Examples

In [#478](https://github.com/yarnpkg/berry/issues/478), Yarn used to print an incorrect help message.

```js
const output = await yarn(`add`, `--help`);

expect(output).not.toContain(`yarn yarn`);
```

In [#448](https://github.com/yarnpkg/berry/issues/448), running `pnpify --sdk` used to fail when ESLint was missing.

```js
await packageJsonAndInstall({
  devDependencies: {
    [`@yarnpkg/pnpify`]: `^2.0.0-rc.3`,
    [`typescript`]: `^3.6.3`
  }
});

await expect(yarn(`pnpify`, `--sdk`)).rejects.not.toThrow(`Command failed`);
```

In [#361](https://github.com/yarnpkg/berry/issues/361), running `yarn add dep` when `dep` was already a devDependency used to duplicate it in both fields:

```js
const {promises: {readFile}} = require(`fs`);

await packageJsonAndInstall({
  devDependencies: {lodash: `*`},
});

await yarn(`add`, `lodash`);

const pkgJson = JSON.parse(await readFile(`package.json`, `utf8`));
expect(pkgJson.dependencies).not.toHaveProperty(`lodash`);
```

For more examples, consult the list of issues that have been tagged as having valid reproductions:

https://github.com/yarnpkg/berry/issues?q=is%3Aissue+label%3Areproducible+is%3Aclosed


## Q&A

### Can I develop my reproduction offline?

It's a bit annoying to build a reproduction directly on the repository tracker as you'll get flooded with the email notifications from the bot. Until we improve this part of the workflow, you can use this tip to easily build a reproduction offline and only share it once it's ready:

1. Clone our [repository](https://github.com/yarnpkg/berry)
2. Go into it, and write your issue in a markdown file (as if you were on GitHub)
3. Once ready, run `yarn sherlock <my-file.md>` to make Sherlock run your reproduction locally

Note that you must write the issue itself, not only the reproduction, so don't forget to add the codefence etc. Once you are done, copy-paste the result on GitHub and the bot will promptly review your code and approve it.

### The Sherlock bot doesn't label my message

It likely means that it didn't see your issue as containing a reproduction case. Make sure you properly added the `repro` tag to your codefence:

~~~markdown
This is my reproduction case:

```js repro
const foo = ...;
```
~~~

### The Sherlock bot is labelling my issue with `broken-repro`

This means that your code is throwing an exception on our systems which doesn't seem to be part of the expected testsuite. Note that only exceptions thrown by the [expect](https://jestjs.io/docs/en/expect) API will lead to your reproduction being correctly labelled.

If you wish to test that something is failing (for example to test that `yarn install --immutable` doesn't work when the lockfile isn't up-to-date, or something like this) you can use the following pattern:

```js
await expect(async () => {
  // ...
}()).rejects.toThrow();
```

### How can I run the bot again?

Editing the issue content will cause the bot to run again. If you're a maintainer, you can also remove the reproduction label from the issue and Sherlock will happilly execute it again.

### That's really cool, can I do the same on my own project?

Sherlock is an open-source project that we develop on [this repository](https://github.com/arcanis/sherlock). Try and let us know how it worked out for you!
