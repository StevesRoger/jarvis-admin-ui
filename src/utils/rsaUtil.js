import JSEncrypt from 'jsencrypt';
export const encrypt = (text, publicKey) => {
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    return encrypt.encrypt(text);
};
