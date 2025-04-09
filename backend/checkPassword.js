const bcrypt = require('bcryptjs');

// Хешированный пароль из базы данных
const hashedPassword = '$2b$10$6z/v48Cg24zQ2OUNKNkrveUjiWrtnx9zSCkgUD7bHoHY1PfirME8q';

// Пароль, который вы вводите при входе
const inputPassword = '12';

bcrypt.compare(inputPassword, hashedPassword, (err, isMatch) => {
    if (err) {
        console.error('Error comparing passwords:', err);
        return;
    }
    if (isMatch) {
        console.log('Password matches!');
    } else {
        console.log('Password does not match.');
    }
});

// Сгенерируем хеш для пароля 'test' и сравним
bcrypt.hash(inputPassword, 10, (err, newHash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Generated hash for "test":', newHash);
    console.log('Does generated hash match the one in DB?', newHash === hashedPassword);
});