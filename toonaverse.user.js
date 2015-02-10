// ==UserScript==
// @name         toonaverse
// @description  renovate naver webtoon
// @version      0.0.0
// @namespace    http://0xABCDEF.com/toonaverse
// @copyright    2014 JongChan Choi
// @match        http://comic.naver.com/webtoon*
// @grant        none
// ==/UserScript==

var toonaverse = {
    dom: function (url) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest;
            xhr.open('get', url);
            xhr.onload = function () {
                var dom = (new DOMParser).parseFromString(xhr.responseText, 'text/html');
                resolve(dom);
            };
            xhr.send();
        });
    },
    detail: function (titleId) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.dom('http://comic.naver.com/webtoon/list.nhn' + self.searchStr({
                titleId: titleId || self.search.titleId,
                page: 1
            })).then(function (listDom) {
                var detail = listDom.getElementsByClassName('detail')[0];
                { // title & author
                    var titleAndAuthor = detail.children[0];
                    var title = titleAndAuthor.childNodes[0].textContent.trim();
                    var author = titleAndAuthor.childNodes[1].textContent.trim();
                }
                { // description
                    var description = detail.children[1].textContent;
                }
                { // last no
                    var viewListTable = listDom.getElementsByClassName('viewList')[0];
                    var tbody = listDom.getElementsByTagName('tbody')[0];
                    var lastItem = tbody.getElementsByTagName('tr')[1]; // 0 is blank
                    var anchor = lastItem.getElementsByTagName('a')[0];
                    var lastNo = +self.urlToSearchObj(anchor.getAttribute('href')).no;
                }
                resolve({
                    title: title,
                    author: author,
                    description: description,
                    lastNo: lastNo
                });
            });
        });
    },
    searchStr: function (searchObj) {
        return '?' + Object.keys(searchObj).map(function (key) {
            return key + '=' + searchObj[key];
        }).join('&');
    },
    urlToSearchStr: function (url) {
        var anchor = document.createElement('a');
        anchor.href = url;
        return anchor.search;
    },
    urlToSearchObj: function (url) {
        var self = this;
        return self.searchObj(self.urlToSearchStr(url));
    },
    searchObj: function (searchStr) {
        var obj = {};
        searchStr.replace(/^\?/, '').split('&').map(function (s) {
            return s.split('=');
        }).forEach(function (s) {
            obj[s[0]] = s[1];
        });
        return obj;
    },
    get search() {
        var self = this;
        return self.searchObj(location.search);
    }
};