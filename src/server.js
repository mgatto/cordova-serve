/**
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

/* globals Promise: true */

const chalk = require('chalk');
const express = require('express');
const fs = require('fs');

/**
 * @desc Launches a server with the specified options and optional custom handlers.
 * @param {{root: ?string, port: ?number, noLogOutput: ?bool, noServerInfo: ?bool, router: ?express.Router, events: EventEmitter}} opts
 * @returns {*|promise}
 */
module.exports = function (opts) {
    const that = this;
    const promise = new Promise((resolve, reject) => {
        opts = opts || {};
        let port = opts.port || 8000;

        const log = module.exports.log = msg => {
            if (!opts.noLogOutput) {
                if (opts.events) {
                    opts.events.emit('log', msg);
                } else {
                    console.log(msg);
                }
            }
        };

        const app = that.app;

        if (opts.https) {
            const server = require("https").createServer({
                key: fs.readFileSync(__dirname + '/private.key', 'utf8'),
                cert: fs.readFileSync(__dirname + '/public.cert', 'utf8')
            }, app);
        } else {
            const server = require("https").Server(app);
        }

        that.server = server;

        if (opts.router) {
            app.use(opts.router);
        }

        if (opts.root) {
            that.root = opts.root;
            app.use(express.static(opts.root));
        }

        // If we have a project root, make that available as a static root also. This can be useful in cases where source
        // files that have been transpiled (such as TypeScript) are located under the project root on a path that mirrors
        // the the transpiled file's path under the platform root and is pointed to by a map file.
        if (that.projectRoot) {
            app.use(express.static(that.projectRoot));
        }

        const listener = server.listen(port);
        listener.on('listening', () => {
            that.port = port;

            const message = `Static file server running on: ${chalk.green(`${opts.https ? 'https': 'http'}://localhost:${port}`)} (CTRL + C to shut down)`;
            if (!opts.noServerInfo) {
                log(message);
            }
            resolve(message);
        });
        listener.on('error', e => {
            if (e && e.toString().indexOf('EADDRINUSE') > -1) {
                port++;
                server.listen(port);
            } else {
                reject(e);
            }
        });
    });
    return promise;
};
