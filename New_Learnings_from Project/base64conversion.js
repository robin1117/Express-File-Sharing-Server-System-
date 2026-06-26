let form = Buffer.from('Hello', 'utf8').toString('base64') //SGVsbG8=
console.log(form);

let p = Buffer.from('SGVsbG8=', 'base64').toString('utf8') //Hello
console.log(p);