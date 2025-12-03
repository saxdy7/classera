import crypto from 'crypto';

/**
 * Generate a Gravatar URL from an email address
 * @param email - User's email address
 * @param size - Image size in pixels (default: 200)
 * @param defaultImage - Default image type if no Gravatar exists (default: 'identicon')
 * @returns Gravatar URL
 */
export function getGravatarUrl(
  email: string,
  size: number = 200,
  defaultImage: 'identicon' | 'monsterid' | 'wavatar' | 'retro' | 'robohash' | 'mp' = 'identicon'
): string {
  // Normalize email: trim and lowercase
  const normalizedEmail = email.trim().toLowerCase();
  
  // Create MD5 hash of the email
  const hash = crypto.createHash('md5').update(normalizedEmail).digest('hex');
  
  // Construct Gravatar URL
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
}

/**
 * Simple MD5 implementation for browser
 * Based on the RSA Data Security, Inc. MD5 Message-Digest Algorithm
 */
function md5(str: string): string {
  function rotateLeft(value: number, amount: number): number {
    return (value << amount) | (value >>> (32 - amount));
  }

  function addUnsigned(x: number, y: number): number {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }

  function convertToWordArray(str: string): number[] {
    const wordArray: number[] = [];
    for (let i = 0; i < str.length * 8; i += 8) {
      wordArray[i >> 5] |= (str.charCodeAt(i / 8) & 0xFF) << (i % 32);
    }
    return wordArray;
  }

  function wordToHex(value: number): string {
    let hex = '';
    for (let i = 0; i < 4; i++) {
      hex += ((value >> (i * 8)) & 0xFF).toString(16).padStart(2, '0');
    }
    return hex;
  }

  const x = convertToWordArray(str);
  const len = str.length * 8;
  
  x[len >> 5] |= 0x80 << (len % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  let a = 0x67452301;
  let b = 0xEFCDAB89;
  let c = 0x98BADCFE;
  let d = 0x10325476;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    for (let j = 0; j < 64; j++) {
      let f, g;
      if (j < 16) {
        f = (b & c) | (~b & d);
        g = j;
      } else if (j < 32) {
        f = (d & b) | (~d & c);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        f = b ^ c ^ d;
        g = (3 * j + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * j) % 16;
      }

      const temp = d;
      d = c;
      c = b;
      const s = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][Math.floor(j / 16) * 4 + (j % 4)];
      const k = [
        0xD76AA478, 0xE8C7B756, 0x242070DB, 0xC1BDCEEE, 0xF57C0FAF, 0x4787C62A, 0xA8304613, 0xFD469501,
        0x698098D8, 0x8B44F7AF, 0xFFFF5BB1, 0x895CD7BE, 0x6B901122, 0xFD987193, 0xA679438E, 0x49B40821,
        0xF61E2562, 0xC040B340, 0x265E5A51, 0xE9B6C7AA, 0xD62F105D, 0x02441453, 0xD8A1E681, 0xE7D3FBC8,
        0x21E1CDE6, 0xC33707D6, 0xF4D50D87, 0x455A14ED, 0xA9E3E905, 0xFCEFA3F8, 0x676F02D9, 0x8D2A4C8A,
        0xFFFA3942, 0x8771F681, 0x6D9D6122, 0xFDE5380C, 0xA4BEEA44, 0x4BDECFA9, 0xF6BB4B60, 0xBEBFBC70,
        0x289B7EC6, 0xEAA127FA, 0xD4EF3085, 0x04881D05, 0xD9D4D039, 0xE6DB99E5, 0x1FA27CF8, 0xC4AC5665,
        0xF4292244, 0x432AFF97, 0xAB9423A7, 0xFC93A039, 0x655B59C3, 0x8F0CCC92, 0xFFEFF47D, 0x85845DD1,
        0x6FA87E4F, 0xFE2CE6E0, 0xA3014314, 0x4E0811A1, 0xF7537E82, 0xBD3AF235, 0x2AD7D2BB, 0xEB86D391
      ][j];
      
      b = addUnsigned(b, rotateLeft(addUnsigned(addUnsigned(addUnsigned(a, f), k), x[i + g]), s));
      a = temp;
    }

    a = addUnsigned(a, olda);
    b = addUnsigned(b, oldb);
    c = addUnsigned(c, oldc);
    d = addUnsigned(d, oldd);
  }

  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
}

/**
 * Client-side version for browsers
 * @param email - User's email address
 * @param size - Image size in pixels (default: 200)
 * @param defaultImage - Default image type if no Gravatar exists (default: 'identicon')
 * @returns Promise<Gravatar URL>
 */
export async function getGravatarUrlClient(
  email: string,
  size: number = 200,
  defaultImage: 'identicon' | 'monsterid' | 'wavatar' | 'retro' | 'robohash' | 'mp' = 'identicon'
): Promise<string> {
  // Normalize email: trim and lowercase
  const normalizedEmail = email.trim().toLowerCase();
  
  // Create MD5 hash
  const hash = md5(normalizedEmail);
  
  // Construct Gravatar URL
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
}
