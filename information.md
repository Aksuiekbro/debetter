# Express.js Documentation Snippets

Here are some up-to-date documentation snippets for Express.js fetched using Context7:

---

**TITLE:** Basic Express.js Server Setup
**DESCRIPTION:** Demonstrates how to create a minimal Express.js server that responds with 'Hello World' on the root route. Shows the basic pattern of importing Express, creating an app instance, defining a route, and starting the server.
**SOURCE:** https://github.com/expressjs/express/blob/master/Readme.md#2025-04-10_snippet_0
**LANGUAGE:** javascript
```javascript
import express from 'express'

const app = express()

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(3000)
```

---

**TITLE:** Creating a Basic Express.js Application
**DESCRIPTION:** This JavaScript code snippet demonstrates how to create a simple Express application. It sets up a server that listens on port 3000 and responds with 'Hello World!' when accessed.
**SOURCE:** https://github.com/expressjs/express/blob/master/test/fixtures/% of dogs.txt#2025-04-10_snippet_1
**LANGUAGE:** JavaScript
```javascript
const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
```

---

**TITLE:** Express.js Installation Command
**DESCRIPTION:** NPM command to install Express.js as a project dependency.
**SOURCE:** https://github.com/expressjs/express/blob/master/Readme.md#2025-04-10_snippet_1
**LANGUAGE:** bash
```bash
npm install express
```

---

**TITLE:** Installing Express.js via npm
**DESCRIPTION:** This command installs Express.js as a dependency in your Node.js project. It uses npm (Node Package Manager) to download and add Express to your project's package.json file.
**SOURCE:** https://github.com/expressjs/express/blob/master/test/fixtures/% of dogs.txt#2025-04-10_snippet_0
**LANGUAGE:** Shell
```shell
$ npm install express --save
```

---

**TITLE:** Express Generator Installation
**DESCRIPTION:** Command to install the Express application generator globally using npm.
**SOURCE:** https://github.com/expressjs/express/blob/master/Readme.md#2025-04-10_snippet_2
**LANGUAGE:** bash
```bash
npm install -g express-generator@4
```

---

**TITLE:** Express Application Generation
**DESCRIPTION:** Command to create a new Express application using the generator.
**SOURCE:** https://github.com/expressjs/express/blob/master/Readme.md#2025-04-10_snippet_3
**LANGUAGE:** bash
```bash
express /tmp/foo && cd /tmp/foo
```

---

**TITLE:** Express Project Dependencies Installation
**DESCRIPTION:** Command to install all dependencies for an Express project.
**SOURCE:** https://github.com/expressjs/express/blob/master/Readme.md#2025-04-10_snippet_4
**LANGUAGE:** bash
```bash
npm install
```

---

**TITLE:** Starting Express Server
**DESCRIPTION:** Command to start the Express application server.
**SOURCE:** https://github.com/expressjs/express/blob/master/Readme.md#2025-04-10_snippet_5
**LANGUAGE:** bash
```bash
npm start
```

---

**TITLE:** Running an Express.js Application
**DESCRIPTION:** This command starts the Express.js application. It uses Node.js to execute the app.js file, which contains the Express server code.
**SOURCE:** https://github.com/expressjs/express/blob/master/test/fixtures/% of dogs.txt#2025-04-10_snippet_2
**LANGUAGE:** Shell
```shell
$ node app.js
```

---

**TITLE:** Defining Route Middleware in Express.js
**DESCRIPTION:** Demonstrates how to use route-specific middleware in Express.js applications. This feature allows executing code before handling specific routes.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_13
**LANGUAGE:** JavaScript
```javascript
app.get('/user/:id', requireAuth, function(req, res) {
  // Route handler
});
```

---

**TITLE:** Proxy Trust Configuration
**DESCRIPTION:** Example showing how to configure proxy trust settings in Express.js. Demonstrates various trust options including trusting specific IPs, subnets, loopback addresses and configuring trust levels.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_4
**LANGUAGE:** javascript
```javascript
app.set('trust proxy', 1)               // trust first hop
app.set('trust proxy', 'loopback')      // trust loopback addresses
app.set('trust proxy', '10.0.0.1')      // trust single IP
app.set('trust proxy', '10.0.0.1/16')    // trust subnet
app.set('trust proxy', '10.0.0.1, 10.0.0.2') // trust list
app.set('trust proxy', false)            // turn off
app.set('trust proxy', true)             // trust everything
```

---

**TITLE:** Custom ETag Generation Configuration
**DESCRIPTION:** Code example showing how to configure custom ETag generation in Express.js using app.set(). Demonstrates different ETag options including custom functions, weak/strong tags, and enabling/disabling ETags.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_3
**LANGUAGE:** javascript
```javascript
app.set('etag', function(body, encoding){ return '"etag"' }) // custom etag generation
app.set('etag', 'weak')    // weak tag
app.set('etag', 'strong')  // strong etag
app.set('etag', false)     // turn off
app.set('etag', true)      // standard etag
```

---

**TITLE:** Configuring JSONP Callback in Express.js
**DESCRIPTION:** Shows how to enable or disable automatic JSONP wrapping for JSON responses in Express.js applications.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_14
**LANGUAGE:** JavaScript
```javascript
app.set('jsonp callback', true);
```

---

**TITLE:** Configuring Session Middleware in Express.js Application
**DESCRIPTION:** Adds a secret key to the session middleware configuration in Express.js examples and generated applications. This improves security for session management.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_10
**LANGUAGE:** JavaScript
```javascript
app.use(express.session({ secret: 'your secret here' }));
```

---

**TITLE:** Setting Charset and Encoding in Express.js Responses
**DESCRIPTION:** Setting the charset for responses in Express.js and specifying encoding options when rendering views.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_18
**LANGUAGE:** JavaScript
```javascript
Request#charset // Automatically assigned to 'UTF-8' when respond()'s encoding is set to 'utf8' or 'utf-8'
Request#render({ encoding: 'utf-8' })
```

---

**TITLE:** Fixing Request Host and Protocol Handling in Express.js
**DESCRIPTION:** Fixes issues with req.host and req.protocol when using the 'trust proxy' setting with a hops count. This ensures correct handling of proxied requests.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_6
**LANGUAGE:** JavaScript
```javascript
// Fix `req.host` when using "trust proxy" hops count
// Fix `req.protocol`/`req.secure` when using "trust proxy" hops count
```

---

**TITLE:** Enhancing Content-Disposition Header Handling in Express.js
**DESCRIPTION:** Improves the handling of Content-Disposition headers for file attachments and downloads. Uses the 'content-disposition' module for standards-compliant headers and full Unicode support.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_8
**LANGUAGE:** JavaScript
```javascript
// Use `content-disposition` module for `res.attachment`/`res.download`
// - Sends standards-compliant `Content-Disposition` header
// - Full Unicode support
```

---

**TITLE:** Generating ETags for All Request Responses in Express.js
**DESCRIPTION:** Extends ETag generation to all request responses, not just GET and HEAD requests. This improves caching and performance for all types of requests.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_7
**LANGUAGE:** JavaScript
```javascript
// Generate `ETag`s for all request responses
// No longer restricted to only responses for `GET` and `HEAD` requests
```

---

**TITLE:** Improving Subdomain Handling in Express.js
**DESCRIPTION:** Enhances subdomain support to handle X-Forwarded-Host headers and IP address hosts. This improves compatibility with various hosting configurations.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_9
**LANGUAGE:** JavaScript
```javascript
// Support `X-Forwarded-Host` in `req.subdomains`
// Support IP address host in `req.subdomains`
```

---

**TITLE:** Setting Views Directory Array in Express.js
**DESCRIPTION:** Added support for setting multiple view directories using app.set('views', array). Views are looked up sequentially in the array of directories.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_0
**LANGUAGE:** JavaScript
```javascript
app.set('views', ['path/to/views1', 'path/to/views2']);
```

---

**TITLE:** Updating Express.js Dependencies
**DESCRIPTION:** Updates various dependencies of Express.js to newer versions, including connect, debug, send, and others. This improves functionality and security.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_5
**LANGUAGE:** JavaScript
```javascript
"deps": {
  "express-session": "~1.10.4",
  "finalhandler": "0.3.4",
  "method-override": "~2.3.2",
  "morgan": "~1.5.2",
  "qs": "2.4.1",
  "serve-index": "~1.6.3",
  "serve-static": "~1.9.2",
  "type-is": "~1.6.1",
  "debug": "~2.1.3",
  "merge-descriptors": "1.0.0",
  "proxy-addr": "~1.0.7",
  "send": "0.12.2"
}
```

---

**TITLE:** Using res.sendStatus() in Express.js
**DESCRIPTION:** Fixed res.send(status) to mention res.sendStatus(status) as the preferred method for sending a status code response.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_1
**LANGUAGE:** JavaScript
```javascript
res.sendStatus(404); // sends the status code
```

---

**TITLE:** Setting DEBUG_FD Environment Variable for Debugging
**DESCRIPTION:** Added support for the DEBUG_FD environment variable to specify an alternative file descriptor for debug output.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_2
**LANGUAGE:** JavaScript
```javascript
process.env.DEBUG_FD = 3; // Set debug output to file descriptor 3
```

---

**TITLE:** Setting View Engine in Express.js CLI
**DESCRIPTION:** Adds a --template flag to the Express.js CLI tool to specify the template engine when generating a new application.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_11
**LANGUAGE:** JavaScript
```javascript
express --template ejs myapp
```

---

**TITLE:** Setting CSS Engine in Express.js CLI
**DESCRIPTION:** Adds a --css flag to the Express.js CLI tool to specify the CSS preprocessor (or plain CSS) when generating a new application.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_12
**LANGUAGE:** JavaScript
```javascript
express --css stylus myapp
```

---

**TITLE:** Running Express.js Test Suite and Linting
**DESCRIPTION:** Instructions for installing dependencies, running the test suite, and linting the codebase for Express.js contributions. This ensures code quality and adherence to project standards.
**SOURCE:** https://github.com/expressjs/express/blob/master/Collaborator-Guide.md#2025-04-10_snippet_0
**LANGUAGE:** shell
```shell
npm install
npm test
npm run lint
```

---

**TITLE:** Setting Debug Environment Variable Example
**DESCRIPTION:** Example showing how to enable detailed debug logging in Express.js applications using the DEBUG environment variable.
**SOURCE:** https://github.com/expressjs/express/blob/master/Triager-Guide.md#2025-04-10_snippet_0
**LANGUAGE:** bash
```bash
DEBUG=*
```

---

**TITLE:** Node.js Debugging Command
**DESCRIPTION:** Command to enable the Node.js inspector for debugging Express.js applications.
**SOURCE:** https://github.com/expressjs/express/blob/master/Triager-Guide.md#2025-04-10_snippet_1
**LANGUAGE:** bash
```bash
node --inspect
```

---

**TITLE:** Rendering Markdown View Template in Express.js
**DESCRIPTION:** A basic markdown template that renders a title using a template variable and includes an italicized text using markdown syntax.
**SOURCE:** https://github.com/expressjs/express/blob/master/examples/markdown/views/index.md#2025-04-10_snippet_0
**LANGUAGE:** markdown
```markdown
# {title}

Just an example view rendered with _markdown_.
```

---

**TITLE:** Running Express.js Benchmarks with wrk
**DESCRIPTION:** This snippet shows the output format of running Express.js benchmarks using wrk. It displays results for different numbers of connections and middleware, including response time and requests per second.
**SOURCE:** https://github.com/expressjs/express/blob/master/benchmarks/README.md#2025-04-10_snippet_0
**LANGUAGE:** markdown
```markdown
```
  50 connections
  1 middleware
 7.15ms
 6784.01

 [...redacted...]

  1000 connections
  10 middleware
 139.21ms
 6155.19

```
```

---

**TITLE:** Saving Benchmark Results to File
**DESCRIPTION:** This command runs the benchmarks and saves the output to a file named 'results.log' for future reference or analysis.
**SOURCE:** https://github.com/expressjs/express/blob/master/benchmarks/README.md#2025-04-10_snippet_2
**LANGUAGE:** shell
```shell
make > results.log
```

---

**TITLE:** Running Benchmarks with Node.js Version Output
**DESCRIPTION:** This command runs the benchmarks and appends the Node.js version to the output, useful for tracking performance across different Node.js versions.
**SOURCE:** https://github.com/expressjs/express/blob/master/benchmarks/README.md#2025-04-10_snippet_1
**LANGUAGE:** shell
```shell
make && node -v
```

---

**TITLE:** Cloning Express Repository
**DESCRIPTION:** Git command to clone the Express repository for accessing examples.
**SOURCE:** https://github.com/expressjs/express/blob/master/Readme.md#2025-04-10_snippet_6
**LANGUAGE:** bash
```bash
git clone https://github.com/expressjs/express.git --depth 1 && cd express
```

---

**TITLE:** Running Express Examples
**DESCRIPTION:** Command to run an example from the Express repository.
**SOURCE:** https://github.com/expressjs/express/blob/master/Readme.md#2025-04-10_snippet_7
**LANGUAGE:** bash
```bash
node examples/content-negotiation
```

---

**TITLE:** CSRF Protection Module Usage Example
**DESCRIPTION:** Basic example demonstrating how to require and use the csurf module. This is used to illustrate how code examples should be formatted in README files.
**SOURCE:** https://github.com/expressjs/express/blob/master/Readme-Guide.md#2025-04-10_snippet_1
**LANGUAGE:** js
```javascript
var csurf = require('csurf')
...
```

---

**TITLE:** Installing Module via npm Command
**DESCRIPTION:** Standard npm installation command format to be included in the Installation section of README files. This shows users how to install the module using npm.
**SOURCE:** https://github.com/expressjs/express/blob/master/Readme-Guide.md#2025-04-10_snippet_0
**LANGUAGE:** sh
```shell
$ npm install module-name
```

---

**TITLE:** Tagging Express.js Release Version
**DESCRIPTION:** Command to create a lightweight git tag for the new release version.
**SOURCE:** https://github.com/expressjs/express/blob/master/Release-Process.md#2025-04-10_snippet_3
**LANGUAGE:** bash
```bash
$ git tag <version-number>
```

---

**TITLE:** Pushing Express.js Release Changes to GitHub
**DESCRIPTION:** Commands to push the release branch changes and version tag to the main repository.
**SOURCE:** https://github.com/expressjs/express/blob/master/Release-Process.md#2025-04-10_snippet_4
**LANGUAGE:** bash
```bash
$ git push origin <release-branch>
$ git push origin <version-number>
```

---

**TITLE:** Publishing Express.js Release to npm
**DESCRIPTION:** Commands to authenticate with npm and publish the new release package.
**SOURCE:** https://github.com/expressjs/express/blob/master/Release-Process.md#2025-04-10_snippet_5
**LANGUAGE:** bash
```bash
$ npm login <npm-username>
$ npm publish
```

---

**TITLE:** History.md Version Update Example for Express.js Release
**DESCRIPTION:** Example diff showing how to update the History.md file when preparing a new Express.js release.
**SOURCE:** https://github.com/expressjs/express/blob/master/Release-Process.md#2025-04-10_snippet_1
**LANGUAGE:** diff
```diff
-unreleased
-==========
+4.13.3 / 2015-08-02
+===================

```

---

**TITLE:** Committing Version Changes for Express.js Release
**DESCRIPTION:** Commands to commit version number updates in History.md and package.json files.
**SOURCE:** https://github.com/expressjs/express/blob/master/Release-Process.md#2025-04-10_snippet_2
**LANGUAGE:** bash
```bash
$ git checkout <release-branch>
<..edit files..>
$ git add History.md package.json
$ git commit -m '<version-number>'
```

---

**TITLE:** Merging Proposal Branch for Non-patch Release in Express.js
**DESCRIPTION:** Commands to merge a proposal branch into the release branch using fast-forward merge to maintain clean git history.
**SOURCE:** https://github.com/expressjs/express/blob/master/Release-Process.md#2025-04-10_snippet_0
**LANGUAGE:** bash
```bash
$ git checkout <release-branch>
$ git merge --ff-only <proposal-branch>
```

---

**TITLE:** Updating Express.js Package Dependencies
**DESCRIPTION:** Adding the Connect middleware as a dependency in the package.json file for Express.js.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_16
**LANGUAGE:** JSON
```json
"dependencies": {
  "connect": "*"
}
```

---

**TITLE:** Installing Express.js Dependencies
**DESCRIPTION:** Command to install Express.js dependencies using npm and create the ~/.node_libraries directory if it doesn't exist.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_15
**LANGUAGE:** Shell
```shell
make install
```

---

**TITLE:** Rendering Views with Layouts in Express.js
**DESCRIPTION:** Examples of rendering views with different layout options in Express.js applications.
**SOURCE:** https://github.com/expressjs/express/blob/master/History.md#2025-04-10_snippet_17
**LANGUAGE:** JavaScript
```javascript
this.render('page.html.haml', { layout: 'super-cool-layout.html.ejs' });
this.render('page.html.haml', { layout: 'foo' }); // assumes 'foo.html.haml'
this.render('page.html.haml', { layout: false }); // no layout
