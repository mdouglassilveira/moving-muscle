/**
 * Test utility — generates an AES-256-CBC encrypted payload in Branch's exact
 * webhook format: data = base64( IV[16] ++ ciphertext ).
 *
 * Use it to validate the decrypt path before the real sandbox key arrives:
 *   deno run --allow-all gen-test-payload.ts
 *
 * Prints a base64 AES key (set as BRANCH_AES_KEY_SANDBOX) and a `data` string.
 */

const plaintext = JSON.stringify({
  employee_id: "wrk_test_123",
  payment_profile_status: "ACTIVE",
  payment_method: "BRANCH_WALLET",
});

const keyBytes = crypto.getRandomValues(new Uint8Array(32)); // AES-256
const iv = crypto.getRandomValues(new Uint8Array(16));

const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-CBC" }, false, [
  "encrypt",
]);
const ciphertext = new Uint8Array(
  await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    new TextEncoder().encode(plaintext),
  ),
);

const blob = new Uint8Array(iv.length + ciphertext.length);
blob.set(iv, 0);
blob.set(ciphertext, iv.length);

const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));

console.log("BRANCH_AES_KEY_SANDBOX=" + b64(keyBytes));
console.log("data=" + b64(blob));
console.log("plaintext=" + plaintext);
