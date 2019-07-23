const Parser = require('fast-xml-parser');
const request = require('request');
const uniqid = require('uniqid');

const API_URL = 'smspro.nikita.kg/api/';

const HTTP = 'http://';
const HTTPS = 'https://';

const ACTION_SEND = 'message';
const ACTION_REPORT = 'dr';
const ACTION_ABONENT = 'def';
const ACTION_INFO = 'info';

class Sms {

    /**
     * @param login
     * @param pass
     * @param senderID
     * @param [useHttp=false]
     */
    constructor(login, pass, senderID, useHttp) {
        this.login = login;
        this.pass = pass;
        this.senderID = senderID;
        this.useHttp = useHttp !== undefined ? useHttp : false;
    }

    changeCredential(login, pass) {
        this.login = login;
        this.pass = pass;
    }

    setDenderID(senderID) {
        this.senderID = senderID;
    }

    /**
     * @param message
     * @param phones
     * @param [time]
     * @param [test]
     * @returns {Promise<SendResponse>}

     * @typedef {Object} SendResponse
     * @property {number} id - Id of send request.
     * @property {number} status - Described below.
     * @property {number} phones - Phones list.
     * @property {number} smscnt - Count of sent sms messages to one phone.

     Status codes description:
     0 Сообщения успешно приняты к отправке
     1 Ошибка в формате запроса
     2 Неверная авторизация
     3 Недопустимый IP-адрес отправителя
     4 Недостаточно средств на счету клиента.
     5 Недопустимое имя отправителя (значение поля sender в запросе не валидировано администратором smspro.nikita.kg)
     6 Сообщение заблокировано по стоп-словам (в сообщении содержатся слова, блокируемые роботом. Например, нецензурная лексика)
     7 Некорректное написание одного или нескольких номеров телефонов получателей
     8 Неверный формат времени отправки
     9 Отправка заблокирована из-за срабатывания SPAM фильтра.
     10 Отправка заблокирована из-за последовательного повторения id (ошибочная переотправка)
     11 Сообщение успешно обработано, но не принято к отправк
     */
    async sendMessage(message, phones, time, test) {
        let data = {
            message: {
                id: uniqid.process(),
                login: this.login,
                pwd: this.pass,
                sender: this.senderID,
                text: message,
                phones: [],
                time: time !== undefined ? time : '',
                test: test !== undefined ? 1 : 0
            }
        };

        for (let phone of phones) {
            data.message.phones.push({phone: phone});
        }

        return this.sendXMLRequest(data, ACTION_SEND);
    }

    /**
     * @param {Object} id
     * @param [phone]
     * @returns {Promise<ReportResponse>}

     * @typedef {Object} ReportedPhone
     * @property {number} number.
     * @property {number} report - Described below.
     * @property {number} sendTime.
     * @property {number} rcvTime - Receive time.

         Report codes description:
         0 Сообщение находится в очереди на отправку
         1 Сообщение отправлено (передано оператору)
         2 Сообщение отклонено (не передано. Например, из-за несуществующего регионального кода)
         3 Сообщение успешно доставлено
         4 Сообщение не доставлено
         5 Сообщение не отправлено из-за нехватки средств на счету партнера
         6 Неизвестный (новый) статус отправки
         7 Истек период ожидания отчета о доставке от SMSC. Обработка сообщения прекращена

     * @typedef {Object} ReportResponse
     * @property {number} status - Described below.
     * @property {ReportedPhone[]} phone.

        Status codes description:
        0 Запрос корректен
        1 Ошибка в формате запроса
        2 Неверная авторизация
        3 Недопустимый IP-адрес отправителя
        4 Отчет для указанных номера телефона и ID не найден.

     */
    async getReport(id, phone) {
        let data = {
            dr: {
                id: id,
                login: this.login,
                pwd: this.pass
            }
        };

        if(phone !== undefined) {
            data.dr.phone = phone;
        }

        return await this.sendXMLRequest(data, ACTION_REPORT);
    }

    /**
     *
     * @param phone
     * @returns {Promise<AbonentInfo>}

     * @typedef {Object} AbonentInfo
     * @property {number} status - Described below.
     * @property {string} region.
     * @property {string} operator.
     * @property {number} timezone.
     *
     *
         Status codes description:
         0 Запрос корректен и информация по номеру получена.
         1 Ошибка в формате запроса
         2 Неверная авторизация
         3 Некорректное написание номера телефона
         4 Данные для номера телефона не найдены в базе
     */
    async getAbonentInfo(phone) {
        let data = {
            def: {
                login: this.login,
                pwd: this.pass,
                phone: phone
            }
        };

        return await this.sendXMLRequest(data, ACTION_ABONENT);
    }

    /**
     * @returns {Promise<AccountInfo>}

     * @typedef {Object} AccountInfo
     * @property {number} status - Статус запроса. 0 – если запрос корректен и информация предоставлена.
            Подробное описание ошибочных кодов см. в таблице «статусы запроса».
     * @property {number} state [0, 1] - Флаг активности аккаунта. 0 – аккаунт активен. 1 – не активен либо блокирован.
     * @property {number} account - Состояние счета
            (положительная сумма денег доступных для расходования без учета возможного кредита - в валюте счета).
     * @property {number} smsprice - Стоимость одного SMS-сообщения в валюте счета.

         Status codes description:
         0 Запрос корректен
         1 Ошибка в формате запроса
         2 Неверная авторизация
         3 Недопустимый IP-адрес отправителя
     */
    async getAccountInfo() {
        let data = {
            info: {
                login: this.login,
                pwd: this.pass
            }
        };

        return await this.sendXMLRequest(data, ACTION_INFO);
    }

    async sendXMLRequest(data, action) {
        let xml = new Parser.j2xParser({}).parse(data);
        console.log(xml);
        let url = (this.useHttp ? HTTP : HTTPS) + API_URL + action;
        let result = await new Promise((resolve, reject) => {
            request.post(url, {body: xml}, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            });
        });

        let tObj = Parser.getTraversalObj(result, {});
        let jsonObj = Parser.convertToJson(tObj, {});
        console.log(jsonObj);
        return jsonObj.response;
    }

    /**
     *
     * @param {string} report - request body from smspro
     *
     * @return {Report[] | boolean} parsed report or false if failed to parse
     *
     * @typedef {Object} Report
     * @property {string} id
     * @property {ReportedPhone[]} phone.
     */
    static webHookReport(report) {
        let tObj = Parser.getTraversalObj(report, {});
        let jsonObj = Parser.convertToJson(tObj, {});

        if(jsonObj && jsonObj.report && jsonObj.dr){
            return jsonObj.report.dr;
        }

        return false;
    }
}

module.exports = Sms;

