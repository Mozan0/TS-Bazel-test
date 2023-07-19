"use strict";
/**
 * Each protocol buffer message is preceded by its length in varint format
 * The flow goes as
 * --->
 * WorkRequestMessageSize (varint)
 * WorkRequest {}
 * <----
 * WorkResponseMessageSize (varint)
 * WorkResponse
 * See: https://docs.bazel.build/versions/main/creating-workers.html#work-responses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeWorkResponseSize = exports.readWorkRequestSize = void 0;
/**
 * Extract the delimited header information from a buffer.
 * Size in bytes may vary depending on the size of the original message. Specified by `headerSize`
 * @param buffer the buffer to extract the varint message size
 * @returns an object that contains how long is the header and the size of the WorkRequest
 */
function readWorkRequestSize(buffer) {
    let b;
    let result = 0;
    let intOffset = 0;
    for (let i = 0; i < 5; i++) {
        b = buffer[intOffset++];
        result |= (b & 0x7f) << (7 * i);
        if (!(b & 0x80)) {
            break;
        }
    }
    return { size: result, headerSize: intOffset };
}
exports.readWorkRequestSize = readWorkRequestSize;
/**
 * Creates a varint header message that specifies size of the WorkResponse in bytes.
 * @param size Size of the WorkResponse in bytes.
 * @returns A buffer containing the size information in varint
 */
function writeWorkResponseSize(size) {
    const buffer = Buffer.alloc(10);
    let index = 0;
    while (size > 127) {
        buffer[index] = (size & 0x7f) | 0x80;
        size = size >>> 7;
        index++;
    }
    buffer[index] = size;
    return buffer.slice(0, index + 1);
}
exports.writeWorkResponseSize = writeWorkResponseSize;
