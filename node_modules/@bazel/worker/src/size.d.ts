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
/// <reference types="node" />
/**
 * Extract the delimited header information from a buffer.
 * Size in bytes may vary depending on the size of the original message. Specified by `headerSize`
 * @param buffer the buffer to extract the varint message size
 * @returns an object that contains how long is the header and the size of the WorkRequest
 */
export declare function readWorkRequestSize(buffer: Buffer): {
    size: number;
    headerSize: number;
};
/**
 * Creates a varint header message that specifies size of the WorkResponse in bytes.
 * @param size Size of the WorkResponse in bytes.
 * @returns A buffer containing the size information in varint
 */
export declare function writeWorkResponseSize(size: number): Buffer;
