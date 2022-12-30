// ==UserScript==
// @name         NC Value Label
// @namespace    https://github.com/Camilra/neo-scripts/tree/main/nc-value-label
// @description  Label NC items with Waka & Owls value.
// @icon         http://images.neopets.com/themes/h5/basic/images/nc-icon.svg
// @version      1.1
// @author       Camilra
// @match        http*://www.neopets.com/~waka
// @match        http*://www.neopets.com/~Waka
// @match        http*://www.neopets.com/~owls
// @match        http*://www.neopets.com/~Owls
// @match        http*://www.neopets.com/~owlstwo
// @match        http*://www.neopets.com/~OwlsTwo
// @match        http*://www.neopets.com/inventory.phtml*
// @match        http*://www.neopets.com/closet.phtml*
// @match        http*://www.neopets.com/safetydeposit.phtml*
// @match        http*://www.neopets.com/gallery*
// @match        http*://items.jellyneo.net/*
// @match        http*://impress-2020.openneo.net/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(() => {
    "use strict";

    function getWakaValue () {
        const raw = document.querySelector(".itemList").innerText.split("\n"),
            data = raw.reduce((prev, next) => {
                const [name, value] = next.split("~").map(string => string.trim().toLowerCase());
                if (value) {
                    prev[name] = !value.includes("no trade") ? value.replace("-", " - ") : "No Trade";
                } else if (name.includes("untradeable")) {
                    prev[name.split(" - ")[0]] = "No Trade";
                } else if (name.length >= 3) {
                    prev[name] = "Unknown";
                };
                return prev;
            }, {});
        GM_setValue("Waka", data);
        console.info(`Waka value of ${ Object.keys(data).length } NC items updated.`);
    };

    function getOwlsValue () {
        var Owls = GM_getValue("Owls");
        if (!Owls) {
            Owls = {};
            GM_setValue("Owls", Owls);
        };

        const list = document.querySelectorAll(".tooltip"),
            raw = [];
        list.forEach(element => {
            raw.push(element.innerText);
        });
        const data = raw.reduce((prev, next) => {
            const [name, value] = next.split("~").map(string => string.trim().toLowerCase());
            if (value.includes("no trade")) {
                prev[name] = "No Trade";
            } else if (value.includes("buyable") || value.includes("permanent dyeworks")) {
                prev[name] = "Buyable";
            } else if (value.includes("00 - 00")) {
                prev[name] = "Unknown";
            } else {
                prev[name] = value.replace("-", " - ");
            }
            return prev;
        }, {});

        const merge = {
            ...Owls,
            ...data
        };

        GM_setValue("Owls", merge);
        console.info(`Owls value of ${ Object.keys(data).length } NC items updated.`);
    };

    function displayNCValue () {
        var Waka, Owls;
        Waka = GM_getValue("Waka");
        Owls = GM_getValue("Owls");
        createStyle();
        if (Waka) {
            pasteLabel(Waka, "waka");
        } else {
            console.info("Please update NC items value at https://www.neopets.com/~Waka");
        };
        if (Owls) {
            pasteLabel(Owls, "owls");
        } else {
            console.info("Please update NC items value at https://www.neopets.com/~Owls");
        };
    };

    function createStyle () {
        const style = document.createElement("style");
        style.innerText = `
        .owls, .waka{
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .owls > div, .waka > div{
            font-family: "Helvetica Neue","Helvetica",Helvetica,Arial,sans-serif;
            font-size: 0.7rem;
            font-weight: bold;
            text-align: center;
            color: #FFFFFF;
            padding: 0.05rem 0.5rem;
            border-radius: 50px;
            margin-top: 2.5px;
            cursor: default;
        }
        .owls > div{
            background-color: #8A68AD;
        }
        .waka > div{
            background-color: #AAAAAA;
        }
        `;
        document.body.appendChild(style);
    };

    function pasteLabel (data, label) {
        const locations = {
            "neopets.com/inventory.phtml": inventory,
            "neopets.com/closet.phtml": closet,
            "neopets.com/safetydeposit.phtml": sdb,
            "neopets.com/gallery": gallery,
            "items.jellyneo.net": jellyneo,
            "impress-2020.openneo.net": dti
        };
        for (const destination in locations) {
            if (window.location.href.toLowerCase().includes(destination)) {
                locations[destination](data, label);
                break;
            }
        };
    };

    function inventory (data, label) {
        if (document.querySelector("#navnewsdropdown__2020")) {
            document.querySelectorAll(".inv-display").forEach(element => {
                const observer = new MutationObserver(() => {
                    const names = document.querySelectorAll(".item-img[data-itemset='nc'] ~ .item-name");
                    names.forEach((name) => {
                        const text = name.innerText.toLowerCase(),
                            value = data[text] || "No Entry";
                        if (!name.parentElement.querySelector(`.${ label }`)) {
                            name.outerHTML += `<div class="${ label }"><div>${ value }</div></div>`;
                        };
                    });
                });
                observer.observe(element, { childList: true });
            });
        } else {
            document.querySelectorAll("a[name='ncItems'] + .contentModule .inventory td").forEach(element => {
                const array = element.innerText.split("\n"),
                    text = array[array.length - 3].toLowerCase(),
                    value = data[text] || "No Entry";
                if (!element.querySelector(`.${ label }`)) {
                    element.querySelector("br").outerHTML += `<div class="${ label }"><div>${ value }</div></div>`;
                };
            });
        };
    };

    function closet (data, label) {
        document.querySelectorAll("td span.medText font[color='red']").forEach(element => {
            const text = element.parentElement.parentElement.parentElement.innerText.split("\n(Artifact - 500)")[0].toLowerCase(),
                value = data[text] || "No Entry",
                target = element.parentElement.parentElement.parentElement.parentElement.previousElementSibling;
            if (!target.querySelector(`.${ label }`)) {
                target.querySelector("img").outerHTML += `<div class="${ label }"><div>${ value }</div></div>`;
            };
        });
    };

    function sdb (data, label) {
        document.querySelectorAll("#boxform ~ tr > td:nth-child(4)").forEach(element => {
            if (element.innerText === "Neocash") {
                const text = element.previousElementSibling.previousElementSibling.innerText.split("\n(wearable)")[0].toLowerCase(),
                    value = data[text] || "No Entry",
                    target = element.previousElementSibling.previousElementSibling.previousElementSibling;
                if (!target.querySelector(`.${ label }`)) {
                    target.querySelector("img").outerHTML += `<div class="${ label }"><div>${ value }</div></div>`;
                };
            };
        });
    };

    function gallery (data, label) {
        document.querySelectorAll("img[src*='mall_'], img[src*='mme_']").forEach(element => {
            const text = element.parentElement.querySelector("b.textcolor").innerText.toLowerCase(),
                value = data[text] || "No Entry";
            if (!element.parentElement.querySelector(`.${ label }`)) {
                element.outerHTML += `<div class="${ label }"><div>${ value }</div></div>`;
            };
        });
    };

    function jellyneo (data, label) {
        document.querySelectorAll("img.nc").forEach(element => {
            const text = element.getAttribute("title").split(" - r500")[0].toLowerCase(),
                value = data[text] || "No Entry";
            if (!element.parentElement.querySelector(`.${ label }`)) {
                element.outerHTML += `<div class="${ label }"><div>${ value }</div></div>`;
            };
        });
    };

    function dti (data, label) {
        const body = document.body,
            observer = new MutationObserver(() => {
                const cards = document.querySelectorAll(".css-1g6xv0r"),
                    details = document.querySelectorAll(".chakra-badge.css-wgyeqv");
                if (cards.length && label === "owls") {
                    cards.forEach((card) => {
                        if (card.innerText === "NC") {
                            const text = card.parentElement.nextElementSibling.innerText.toLowerCase(),
                                value = data[text] || "No Entry";
                            if (!card.parentElement.parentElement.querySelector(`.${ label }`)) {
                                card.parentElement.outerHTML += `<div class="${ label }"><div>${ value }</div></div>`;
                            };
                        };
                    });
                } else if (details.length) {
                    details.forEach(detail => {
                        if (detail !== null && detail.innerText === "NC" && document.querySelector(".chakra-heading.css-kl6jvz, .chakra-heading.css-rpnzn8")) {
                            const text = document.querySelector(".chakra-heading.css-kl6jvz, .chakra-heading.css-rpnzn8").innerText.toLowerCase(),
                                image = document.querySelector(".chakra-skeleton"),
                                value = data[text] || "No Entry";
                            if (image && !image.querySelector(`.css-sussob ~ .${ label }`)) {
                                image.firstElementChild.outerHTML += `<div class="${ label }"><div>${ value }</div></div>`;
                            };
                        };
                    });
                };
            });
        observer.observe(body, { childList: true, subtree: true });
    };

    switch (true) {
        case window.location.href.toLowerCase().includes("/~waka"):
            getWakaValue();
            break;
        case window.location.href.toLowerCase().includes("/~owls"):
            getOwlsValue();
            break;
        default:
            displayNCValue();
    };
})();
