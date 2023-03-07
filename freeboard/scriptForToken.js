var x = '';

async function getWebToken() {
    let url = 'http://localhost:8080/api/webtoken';

    let res = await fetch(url, {
        method: 'GET',
    });

    if (res.ok) {
        let ret = await res.text();
        
        return ret.replace(/(^"|"$)/g, '');

    } else {
        return 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdHgiOnsidXNlcmlkIjoiVTkzODc4ODI5NDUyMiIsImNsaWVudGlkIjoiN' +
                'WI0NGM0ZDRkMWMwODY5ZmE0YjNlZDkyZTFmNzgzYjgifSwic2NvcGUiOltdLCJpYXQiOjE2NjQ3ODQxNzYsIm5iZiI6MTY2NDc4NDE3NiwiZXhwIjo' +
                'xOTgwNDAzNTQ4LCJleHBpcmVJbiI6MzE1NjE5MzcyLCJqdGkiOiJpZ21rMUVpRSIsImlzcyI6ImNlcjp1c2VydG9rZW4ifQ.wNf8zR-wYqGOW5IRs4' +
                'EG7MzrukVer-HxSHHaXmW13LwGgA3YAxKq9uCMnhEhSjyptVgHFPjI9vTEhne15oG--A';
    }
}

function getToken() {
    return x;
}

getWebToken().then(ret => { x = ret; console.log(x); })
