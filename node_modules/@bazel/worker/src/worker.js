"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWorkerLoop = exports.runAsWorker = exports.debug = exports.log = exports.DEBUG = void 0;
require("./gc");
const size_1 = require("./size");
const worker_protocol_1 = require("./worker_protocol");
/**
 * Whether to print debug messages (to console.error) from the debug function
 * below.
 */
exports.DEBUG = false;
let output = "";
/**
 * Write a message to stderr, which appears in the bazel log and is visible to
 * the end user.
 */
function log(...args) {
    console.error(...args);
}
exports.log = log;
/** Maybe print a debug message (depending on a flag defaulting to false). */
function debug(...args) {
    if (exports.DEBUG)
        log(...args);
}
exports.debug = debug;
/**
 * runAsWorker returns true if the given arguments indicate the process should
 * run as a persistent worker.
 */
function runAsWorker(args) {
    return args.indexOf('--persistent_worker') !== -1;
}
exports.runAsWorker = runAsWorker;
/**
 * runWorkerLoop handles the interacton between bazel workers and the
 * any compiler. It reads compilation requests from stdin, unmarshals the
 * data, and dispatches into `runOneBuild` for the actual compilation to happen.
 *
 * The compilation handler is parameterized so that this code can be used by
 * different compiler entry points (currently TypeScript compilation, Angular
 * compilation, and the contrib vulcanize worker).
 *
 * It's also exposed publicly as an npm package:
 *   https://www.npmjs.com/package/@bazel/worker
 */
function runWorkerLoop(runOneBuild) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        process.stderr.write = (buffer, encoding, cb) => {
            output += Buffer.from(buffer).toString("utf-8");
            if (typeof encoding == "function") {
                encoding();
            }
            else if (typeof cb == "function") {
                cb();
            }
            return true;
        };
        // this hold the remaning data from the previous stdin loop.
        let prev = Buffer.alloc(0);
        try {
            for (var _b = __asyncValues(process.stdin), _c; _c = yield _b.next(), !_c.done;) {
                const buffer = _c.value;
                let chunk = Buffer.concat([prev, buffer]);
                let current;
                debug("Reiterating");
                const size = size_1.readWorkRequestSize(chunk);
                if (size.size <= chunk.length + size.headerSize) {
                    chunk = chunk.slice(size.headerSize);
                    current = chunk.slice(0, size.size);
                    prev = chunk.slice(size.size);
                    debug("Now we have the full message. Time to go!");
                }
                else {
                    prev = chunk;
                    debug("We do not have the full message yet. Keep reading");
                    continue;
                }
                const work = worker_protocol_1.blaze.worker.WorkRequest.deserialize(current);
                debug('Handling new build request: ' + work.request_id);
                let succedded;
                try {
                    debug('Compiling with:\n\t' + work.arguments.join('\n\t'));
                    succedded = yield runOneBuild(work.arguments, work.inputs.reduce((inputs, input) => {
                        let digest = null;
                        if (input.digest) {
                            digest = Buffer.from(input.digest).toString("hex");
                        }
                        inputs[input.path] = digest;
                        return inputs;
                    }, {}));
                    debug('Compilation was successful: ' + work.request_id);
                }
                catch (error) {
                    // will be redirected to stderr which we capture and put into output
                    log('Compilation failed:\t\n', error);
                    succedded = false;
                }
                const workResponse = new worker_protocol_1.blaze.worker.WorkResponse({
                    exit_code: succedded ? 0 : 1,
                    request_id: work.request_id,
                    output
                }).serialize();
                const responseSize = size_1.writeWorkResponseSize(workResponse.byteLength);
                process.stdout.write(Buffer.concat([
                    responseSize,
                    workResponse
                ]));
                // Force a garbage collection pass.  This keeps our memory usage
                // consistent across multiple compilations, and allows the file
                // cache to use the current memory usage as a guideline for expiring
                // data.  Note: this is intentionally not within runOneBuild(), as
                // we want to gc only after all its locals have gone out of scope.
                global.gc();
                // clear output
                output = "";
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
exports.runWorkerLoop = runWorkerLoop;
