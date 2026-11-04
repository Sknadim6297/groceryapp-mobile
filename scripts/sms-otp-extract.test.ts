/**
 * Pure SMS OTP extraction fixtures (no native module, no live SMS).
 */

import { extractSmsOtp } from '../src/utils/extractSmsOtp';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(extractSmsOtp('Your Mayapur Bazaar code is 482913\n\nFA+9qCX9VSu') === '482913', 'retriever-style SMS with hash');
assert(extractSmsOtp('Your verification code is: 123456') === '123456', 'plain consent-style SMS');
assert(extractSmsOtp('<#> Your OTP is: 998877\n\nAbCdEfGhIjK') === '998877', 'legacy <#>-prefixed SMS');
assert(extractSmsOtp('Code 12') === null, 'too short');
assert(extractSmsOtp('Codes 111111 and 222222') === null, 'rival six-digit numbers must not guess');
assert(extractSmsOtp('Order 7781 OTP 482913') === '482913', 'shorter order id must not block a single 6-digit OTP');
assert(extractSmsOtp('A123456B') === null, 'digits glued to letters are not standalone');
assert(extractSmsOtp('Pay 150000 code 482913') === null, 'six-digit amount rival must not guess');
assert(extractSmsOtp('') === null, 'empty message');

console.log('sms otp extract fixtures passed');
