import bcrypt from 'bcrypt';

let salt = await bcrypt.genSalt(11)
console.log(salt);

let hashed = await bcrypt.hash('password', salt)
// let hashed = await bcrypt.hash('password', '$2a$12$qkEyhOoRgXr0aTyiwe.R7O')
console.log(hashed);

// let storedPassword = '$2a$12$qkEyhOoRgXr0aTyiwe.R7OklQg8R38R9wopd05Hi4huGonC9dg/Hu'
// let userPass = 'password'

// let salt = storedPassword.substring(0, 29)
// let savePasswordHased = storedPassword.substring(29, 60)

// let calculateHasedPass = await bcrypt.hash(userPass, salt)

// console.log(calculateHasedPass);
// console.log(savePasswordHased);
// console.log(salt);

// let c = await bcrypt.compare(userPass, storedPassword)
// console.log(c);