# smspro-nikita

> smspro.nikita.kg nodejs sdk

[![NPM Version][npm-image]][npm-url]

## Install

```bash
npm i -s smspro-nikita
```

## Usage
    const Sms = require('smspro-nikita');
    const sms = new Sms('username', 'password', 'registeredSenderID');

    let result = await sms.sendMessage('message', ['996xxxxxxxxx'])
    // let result = await sms.getAbonentInfo('996123456789')
    // let result = await sms.getAccountInfo()
         .catch((e) => {
             console.log(e);
         });

## License

[MIT](http://vjpr.mit-license.org)

[npm-image]: https://img.shields.io/badge/npm-1.0.0-green.svg
[npm-url]: https://github.com/2rusbekov/smspro-nikita
