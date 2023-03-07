async function cyblion_decrypt(ciphertext) {

    let url = 'http://localhost:8080/api/cipher';

    let res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/html',
        },
        body: ciphertext,
    });

    if (res.ok) {
        let plaintext = await res.json();

        console.log(res);

        //plaintext = plaintext.replace(/(^"|"$)/g, '');
        //plaintext = plaintext.split(/\r|\n/);

        console.log(plaintext);
        console.log(typeof(plaintext));

        return plaintext;

    } else {
        return `HTTP error: ${res.status}`;
    }
}

