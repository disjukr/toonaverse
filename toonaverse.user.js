// ==UserScript==
// @name         toonaverse
// @description  renovate naver webtoon
// @version      0.0.0
// @namespace    http://0xABCDEF.com/toonaverse
// @copyright    2014 JongChan Choi
// @match        http://comic.naver.com/webtoon*
// @require      http://code.jquery.com/jquery-2.1.3.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/mustache.js/0.8.1/mustache.min.js
// @resource     viewer http://0xabcdef.com/toonaverse/template/viewer.html
//// @resource     viewer http://localhost:1234/template/viewer.html
// @resource     webtoon_block http://0xabcdef.com/toonaverse/template/webtoon_block.html
//// @resource     webtoon_block http://localhost:1234/template/webtoon_block.html
// @grant        GM_getResourceText
// @grant        unsafeWindow
// ==/UserScript==

var toonaverse = {
    dom: function (url) {
        var self = this;
        return new Promise(function (resolve, reject) {
            if (url === undefined) {
                resolve(document);
                return;
            }
            var xhr = new XMLHttpRequest;
            xhr.open('get', url);
            xhr.onload = function () {
                var dom = (new DOMParser).parseFromString(xhr.responseText, 'text/html');
                if (xhr.getResponseHeader('TM-finalURL') !== null)
                    reject('redirected');
                else
                    resolve(dom);
            };
            xhr.send();
        });
    },
    content: function (titleId, no) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var url = new Promise(function (resolve, reject) {
                if (titleId === undefined) {
                    resolve(undefined);
                    return;
                }
                function compose(titleId, no) {
                    return 'http://comic.naver.com/webtoon/detail.nhn' + self.searchStr({
                        titleId: titleId,
                        no: no
                    });
                }
                if (no === undefined) {
                    toonaverse.info(titleId).then(function (info) {
                        resolve(compose(titleId, info.lastNo));
                    });
                    return;
                }
                resolve(compose(titleId, no));
            });
            url.then(function (url) {
                return self.dom(url);
            }).then(function (contentDom) {
                resolve({
                    title: $('.tit_area h3', contentDom).text(),
                    imgUrls: $('.wt_viewer > img', contentDom).map(function () { return this.src; }).toArray(),
                    authorComment: $('.writer_info > p', contentDom).text()
                });
            }).catch(function (e) { // maybe removed
                resolve(null);
            });
        });
    },
    info: function (titleId) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var cache = toonaverse.info.cache = toonaverse.info.cache || {};
            var info = cache[titleId];
            if (info !== undefined) {
                resolve(info);
                return;
            }
            self.dom('http://comic.naver.com/webtoon/list.nhn' + self.searchStr({
                titleId: titleId || self.search.titleId,
                page: 1
            })).then(function (listDom) {
                cache[titleId] = info = {
                    title: $('.detail > h2', listDom)[0].childNodes[0].textContent.trim(),
                    author: $('.detail > h2 .wrt_nm', listDom).text().trim(),
                    description: $('.detail > p', listDom).text(),
                    lastNo: +self.urlToSearchObj($('.viewList tr', listDom).eq(2).find('a').attr('href')).no
                };
                resolve(info);
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
window.toonaverse = toonaverse; // userscript is running on sandbox


// 마개조 시작
function launchNuclearBomb() {
    document.body.parentElement.innerHTML = '<head></head><body></body>';
}

function evalTemplate(template, data, context, parentElement) {
    template = Mustache.render(GM_getResourceText(template), data);
    context = context || {};
    var parentDiv = $('<div>')[0];
    parentDiv.innerHTML = template;
    var div = $('> div', parentDiv)[0];
    if (parentElement) $(parentElement).append(div);
    var scriptRegex = /<script.*?toonaverse.*?>((?:.|\s)*?)<\/script>/gi;
    do {
        var script = scriptRegex.exec(template);
        (function () {
            with (context) eval(script ? script[1] : '');
        })();
    } while (script !== null);
    return div;
}

switch (location.pathname.split('/').pop()) {
case 'weekday.nhn':
    break;
case 'weekdayList.nhn':
    break;
case 'bestChallenge.nhn':
    break;
case 'challenge.nhn':
    break;
case 'list.nhn':
    break;
case 'detail.nhn':
    $(function () {
        toonaverse.content().then(function (currentContent) {
            launchNuclearBomb();
            var search = toonaverse.search;
            evalTemplate('viewer', {
                titleId: search.titleId,
                no: search.no
            }, {
                content: currentContent
            }, document.body);
        });
    });
    break;
}
