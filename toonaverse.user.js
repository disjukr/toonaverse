// ==UserScript==
// @name         toonaverse
// @description  renovate naver webtoon
// @version      0.0.0
// @namespace    http://0xABCDEF.com/toonaverse
// @copyright    2014 JongChan Choi
// @match        http://comic.naver.com/webtoon*
// @require      http://code.jquery.com/jquery-2.1.3.min.js
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
            self.dom('http://comic.naver.com/webtoon/list.nhn' + self.searchStr({
                titleId: titleId || self.search.titleId,
                page: 1
            })).then(function (listDom) {
                resolve({
                    title: $('.detail > h2', listDom)[0].childNodes[0].textContent.trim(),
                    author: $('.detail > h2 .wrt_nm', listDom).text().trim(),
                    description: $('.detail > p', listDom).text(),
                    lastNo: +self.urlToSearchObj($('.viewList tr', listDom).eq(2).find('a').attr('href')).no
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
window.toonaverse = toonaverse; // userscript is running on sandbox


// 마개조 시작
function launchNuclearBomb() {
    return new Promise(function (resolve, reject) {
        $(function () {
            document.body.parentElement.innerHTML = [
                '<head>', '</head>',
                '<body>', '</body>'
            ].join('');
            resolve();
        });
    });
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
    (function () {
        var currentContent;
        toonaverse.content().then(function (currentContent) {
            launchNuclearBomb().then(function () {
                $(document.body).html([
                    '<p>제목: ' + currentContent.title + '</p>',
                    '<p>작가의 말: ' + currentContent.authorComment + '</p>',
                    currentContent.imgUrls.map(function (imgUrl) {
                        return '<img style="display:block" src="' + imgUrl + '">'
                    }).join('')
                ].join(''));
            });
        });
    })();
    // launchNuclearBomb().then(function () {
    //     return toonaverse.info();
    // }).then(function (info) {
    //     var contentPromises = [];
    //     for (var i = 1; i <= info.lastNo; ++i)
    //         contentPromises.push(toonaverse.content(toonaverse.search.titleId, i));
    //     Promise.all(contentPromises).then(function (contents) {
    //         document.body.innerHTML = contents.map(function (content) {
    //             if (content === null) return '';
    //             return [
    //                 '<p>제목: ' + content.title + '</p>',
    //                 '<p>작가의 말: ' + content.authorComment + '</p>',
    //                 content.imgUrls.map(function (imgUrl) {
    //                     return '<img style="display:block" src="' + imgUrl + '">'
    //                 }).join('')
    //             ].join('');
    //         }).join('');
    //     });
    // });
    break;
}
