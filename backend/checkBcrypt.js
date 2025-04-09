const bcrypt = require('bcrypt');

(async () => {
    try {
        // Хешируем пароль 'test2'
        console.log('Hashing password "test2"...');
        const hashedPassword = await bcrypt.hash('test2', 10);
        console.log('Generated hash:', hashedPassword);

        // Сравниваем пароль 'test2' с только что созданным хешем
        console.log('Comparing password "test2" with generated hash...');
        const isMatch1 = await bcrypt.compare('test2', hashedPassword);
        console.log('Result of comparing "test2" with generated hash:', isMatch1);

        // Сравниваем пароль 'test2' с хешем из базы данных
        const dbHash = '$2b$10$6CBvTMqXE.SiA3d5udKC.ebZjHEc/s7Rpok7IPJ3YEZ3LcmmbgEYK';
        console.log('Comparing password "test2" with DB hash...');
        const isMatch2 = await bcrypt.compare('test2', dbHash);
        console.log('Result of comparing "test2" with DB hash:', isMatch2);

        // Проверяем неправильный пароль
        console.log('Comparing wrong password "test3" with DB hash...');
        const isMatch3 = await bcrypt.compare('test3', dbHash);
        console.log('Result of comparing "test3" with DB hash:', isMatch3);
    } catch (error) {
        console.error('Error:', error);
    }
})();